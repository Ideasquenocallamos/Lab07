import net from "node:net";
import tls from "node:tls";

const smtpConfig = () => ({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || (process.env.SMTP_SECURE === "false" ? 587 : 465)),
  secure: (process.env.SMTP_SECURE || "true").toLowerCase() !== "false",
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.MAIL_FROM || process.env.SMTP_USER || process.env.ADMIN_EMAIL
});

const readResponse = (socket) => new Promise((resolve, reject) => {
  let data = "";
  const onData = (chunk) => {
    data += chunk.toString("utf8");
    const lines = data.trimEnd().split(/\r?\n/);
    const lastLine = lines[lines.length - 1] || "";
    if (/^\d{3} /.test(lastLine)) {
      socket.off("data", onData);
      socket.off("error", onError);
      resolve(data);
    }
  };
  const onError = (error) => {
    socket.off("data", onData);
    reject(error);
  };
  socket.on("data", onData);
  socket.once("error", onError);
});

const assertOk = (response, expectedCodes) => {
  const code = Number(response.slice(0, 3));
  if (!expectedCodes.includes(code)) {
    throw new Error(`SMTP respondió ${response.trim()}`);
  }
};

const command = async (socket, line, expectedCodes = [250]) => {
  socket.write(`${line}\r\n`);
  const response = await readResponse(socket);
  assertOk(response, expectedCodes);
  return response;
};

const sanitizeHeader = (value) => String(value || "").replace(/[\r\n]+/g, " ").trim();
const encodeAddress = (email, name = "") => name ? `"${sanitizeHeader(name)}" <${sanitizeHeader(email)}>` : sanitizeHeader(email);

const buildMessage = ({ from, to, cc = [], subject, text, html, replyTo }) => {
  const recipients = Array.isArray(to) ? to : [to];
  const ccList = Array.isArray(cc) ? cc.filter(Boolean) : [cc].filter(Boolean);
  const boundary = `booksocial_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const headers = [
    `From: ${encodeAddress(from, "BookSocial")}`,
    `To: ${recipients.map((email) => encodeAddress(email)).join(", ")}`,
    ccList.length ? `Cc: ${ccList.map((email) => encodeAddress(email)).join(", ")}` : "",
    replyTo ? `Reply-To: ${encodeAddress(replyTo)}` : "",
    `Subject: ${sanitizeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`
  ].filter(Boolean).join("\r\n");

  const safeText = String(text || "");
  const safeHtml = String(html || safeText.replace(/\n/g, "<br>"));

  return `${headers}\r\n\r\n--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${safeText}\r\n--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${safeHtml}\r\n--${boundary}--`;
};

export const sendMail = async ({ to, cc = [], subject, text, html, replyTo }) => {
  const config = smtpConfig();
  if (!config.host || !config.user || !config.pass || !config.from) {
    return { sent: false, reason: "SMTP_NOT_CONFIGURED" };
  }

  const recipients = [...(Array.isArray(to) ? to : [to]), ...(Array.isArray(cc) ? cc : [cc])].filter(Boolean);
  const socket = config.secure
    ? tls.connect({ host: config.host, port: config.port, servername: config.host })
    : net.connect({ host: config.host, port: config.port });

  try {
    assertOk(await readResponse(socket), [220]);
    await command(socket, `EHLO ${process.env.SMTP_EHLO || "booksocial.local"}`);
    await command(socket, "AUTH LOGIN", [334]);
    await command(socket, Buffer.from(config.user).toString("base64"), [334]);
    await command(socket, Buffer.from(config.pass).toString("base64"), [235]);
    await command(socket, `MAIL FROM:<${config.from}>`);
    for (const recipient of recipients) {
      await command(socket, `RCPT TO:<${recipient}>`, [250, 251]);
    }
    await command(socket, "DATA", [354]);
    const message = buildMessage({ from: config.from, to, cc, subject, text, html, replyTo }).replace(/^\./gm, "..");
    socket.write(`${message}\r\n.\r\n`);
    assertOk(await readResponse(socket), [250]);
    await command(socket, "QUIT", [221]);
    return { sent: true };
  } finally {
    socket.end();
  }
};
