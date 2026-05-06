import db from "../models/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/auth.config.js";
import { sendMail } from "../utils/mailer.js";

const User = db.user;
const captchaStore = new Map();
const adminCodeStore = new Map();
const premiumCodeStore = new Map();
const genCode = () => `AUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const genAdminCode = () => String(Math.floor(100000 + Math.random() * 900000));
const genPremiumCode = () => `PREM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const adminCodeKey = (email, rol) => `${String(email || "").trim().toLowerCase()}:${rol}`;
const premiumCodeKey = (email) => String(email || "").trim().toLowerCase();
const ADMIN_CODE_TTL_MS = 10 * 60 * 1000;

const isDbConnectionError = (error) =>
  ["SequelizeConnectionError", "SequelizeConnectionRefusedError", "SequelizeHostNotFoundError", "SequelizeAccessDeniedError"].includes(error.name);


const assertValidRoleChange = (currentRole, targetRole, isPremium = false) => {
  if (!["autor", "mixto"].includes(targetRole)) return "Solo puedes cambiar a autor o mixto";
  if (currentRole === targetRole && !(targetRole === "mixto" && !isPremium)) return "Tu cuenta ya tiene ese rol";
  if (currentRole === "mixto" && targetRole !== "mixto") return "La cuenta mixta ya conserva lector y autor; no requiere más cambios";
  return null;
};

const premiumCodeIsValid = (email, code) => {
  const cleanCode = String(code || "").trim();
  const expected = process.env.PREMIUM_ACTIVATION_CODE;
  if (expected && cleanCode === expected) return true;

  const key = premiumCodeKey(email);
  const stored = premiumCodeStore.get(key);
  if (!stored || Date.now() > stored.expiresAt) {
    premiumCodeStore.delete(key);
    return false;
  }
  if (stored.code !== cleanCode) return false;
  premiumCodeStore.delete(key);
  return true;
};

const validateAdminRegisterCode = (email, rol, code) => {
  const cleanCode = String(code || "").trim();
  const fixedCode = process.env.ADMIN_REGISTER_CODE;
  if (fixedCode && cleanCode === fixedCode) return true;

  const key = adminCodeKey(email, rol);
  const stored = adminCodeStore.get(key);
  if (!stored || Date.now() > stored.expiresAt) {
    adminCodeStore.delete(key);
    return false;
  }
  if (stored.code !== cleanCode) return false;
  adminCodeStore.delete(key);
  return true;
};

const validateCaptchaAnswer = (captcha_id, answer) => {
  const data = captchaStore.get(captcha_id);
  if (!data || Date.now() > data.expiresAt || String(answer || "").toUpperCase().trim() !== String(data.code).toUpperCase()) {
    return false;
  }
  captchaStore.delete(captcha_id);
  return true;
};

const buildRoleChangeEmail = ({ adminCode, premiumCode, targetRole, email, adminEmail }) => {
  const expiresMinutes = Math.floor(ADMIN_CODE_TTL_MS / 60000);
  const premiumLine = premiumCode ? `
Código premium mixto: ${premiumCode}` : "";
  const text = `Hola,

Solicitaste cambiar tu cuenta BookSocial al rol ${targetRole}.
Código admin para cambio de rol: ${adminCode}${premiumLine}

Correo solicitante: ${email}
Administrador de contacto: ${adminEmail}
Vence en ${expiresMinutes} minutos. Si no solicitaste este cambio, ignora este mensaje.

BookSocial`;
  const html = `<p>Hola,</p><p>Solicitaste cambiar tu cuenta BookSocial al rol <b>${targetRole}</b>.</p><p><b>Código admin:</b> ${adminCode}</p>${premiumCode ? `<p><b>Código premium mixto:</b> ${premiumCode}</p>` : ""}<p><b>Correo solicitante:</b> ${email}<br><b>Administrador de contacto:</b> ${adminEmail}<br><b>Vence en:</b> ${expiresMinutes} minutos</p><p>Si no solicitaste este cambio, ignora este mensaje.</p><p>BookSocial</p>`;
  return { text, html };
};

const buildAdminCodeEmail = ({ code, rol, email, adminEmail }) => {
  const expiresMinutes = Math.floor(ADMIN_CODE_TTL_MS / 60000);
  const text = `Hola,

Tu código automático de registro BookSocial para el rol ${rol} es: ${code}

Correo solicitante: ${email}
Administrador de contacto: ${adminEmail}
Vence en ${expiresMinutes} minutos. Si no solicitaste este código, ignora este mensaje.

BookSocial`;
  const html = `<p>Hola,</p><p>Tu código automático de registro BookSocial para el rol <b>${rol}</b> es:</p><h2 style="letter-spacing:4px">${code}</h2><p><b>Correo solicitante:</b> ${email}<br><b>Administrador de contacto:</b> ${adminEmail}<br><b>Vence en:</b> ${expiresMinutes} minutos</p><p>Si no solicitaste este código, ignora este mensaje.</p><p>BookSocial</p>`;
  return { text, html };
};

const dbErrorMessage = (error) => {
  if (isDbConnectionError(error)) {
    return "No hay conexión con MySQL. En Railway revisa DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME o usa las variables MYSQLHOST/MYSQLPORT/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE.";
  }
  if (error.name === "SequelizeDatabaseError") {
    return "Error de base de datos. Activa DB_SYNC_ALTER=true y reinicia Railway para sincronizar la tabla users.";
  }
  return error.message || "No se pudo completar el registro";
};

export const getCaptcha = async (req, res) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  const captcha_id = `cap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  captchaStore.set(captcha_id, { code, expiresAt: Date.now() + 2 * 60 * 1000 });

  const noise = Array.from({ length: 6 }).map((_, i) =>
    `<line x1="${10 + i * 30}" y1="${Math.random() * 50}" x2="${20 + i * 30}" y2="${Math.random() * 50}" stroke="#999" />`
  ).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70"><rect width="100%" height="100%" fill="#f4f4f4"/>${noise}<text x="20" y="45" font-size="32" font-family="monospace" fill="#222" letter-spacing="6">${code}</text></svg>`;
  const image_base64 = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  res.json({ captcha_id, image_base64 });
};


export const requestAdminCode = async (req, res) => {
  const { email, rol, captcha_id, answer } = req.body;
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(cleanEmail)) {
    return res.status(400).json({ message: "Debes usar un correo Gmail válido" });
  }
  if (!["autor", "mixto"].includes(rol)) {
    return res.status(400).json({ message: "El código admin solo aplica para autor o mixto" });
  }

  if (!validateCaptchaAnswer(captcha_id, answer)) {
    return res.status(400).json({ message: "Captcha inválido o expirado" });
  }

  const adminEmail = process.env.ADMIN_EMAIL || "andersson.guevara.b@tecsup.edu.pe";
  const code = genAdminCode();
  adminCodeStore.set(adminCodeKey(cleanEmail, rol), { code, expiresAt: Date.now() + ADMIN_CODE_TTL_MS });

  const { text, html } = buildAdminCodeEmail({ code, rol, email: cleanEmail, adminEmail });
  let mailResult;
  try {
    mailResult = await sendMail({
      to: cleanEmail,
      cc: [adminEmail],
      subject: `Código automático BookSocial para registro ${rol}`,
      text,
      html,
      replyTo: adminEmail
    });
  } catch (error) {
    mailResult = { sent: false, reason: error.message };
  }

  const includeCode = process.env.ADMIN_CODE_RESPONSE !== "false" || !mailResult.sent;
  res.json({
    message: mailResult.sent
      ? "Código automático enviado a tu Gmail. Revisa tu bandeja de entrada o spam y pégalo para registrarte."
      : "Código automático generado. Configura SMTP_HOST/SMTP_USER/SMTP_PASS para enviarlo por correo; mientras tanto se muestra en pantalla.",
    admin_email: adminEmail,
    email_sent: mailResult.sent,
    mail_status: mailResult.reason || "sent",
    expires_in_minutes: Math.floor(ADMIN_CODE_TTL_MS / 60000),
    ...(includeCode ? { admin_code: code } : {})
  });
};

export const requestRoleChangeCode = async (req, res) => {
  try {
    const { target_rol, captcha_id, answer } = req.body;
    const targetRole = ["autor", "mixto"].includes(target_rol) ? target_rol : "autor";
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const roleError = assertValidRoleChange(user.rol, targetRole, user.is_premium);
    if (roleError) return res.status(400).json({ message: roleError });
    if (!validateCaptchaAnswer(captcha_id, answer)) {
      return res.status(400).json({ message: "Captcha inválido o expirado" });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "andersson.guevara.b@tecsup.edu.pe";
    const adminCode = genAdminCode();
    const premiumCode = targetRole === "mixto" ? genPremiumCode() : null;
    adminCodeStore.set(adminCodeKey(user.email, targetRole), { code: adminCode, expiresAt: Date.now() + ADMIN_CODE_TTL_MS });
    if (premiumCode) premiumCodeStore.set(premiumCodeKey(user.email), { code: premiumCode, expiresAt: Date.now() + ADMIN_CODE_TTL_MS });

    const { text, html } = buildRoleChangeEmail({ adminCode, premiumCode, targetRole, email: user.email, adminEmail });
    let mailResult;
    try {
      mailResult = await sendMail({
        to: user.email,
        cc: [adminEmail],
        subject: `Códigos BookSocial para cambio a ${targetRole}`,
        text,
        html,
        replyTo: adminEmail
      });
    } catch (error) {
      mailResult = { sent: false, reason: error.message };
    }

    const includeCode = process.env.ADMIN_CODE_RESPONSE !== "false" || !mailResult.sent;
    res.json({
      message: mailResult.sent
        ? "Códigos enviados a tu Gmail. Revisa bandeja de entrada o spam y pégalos para cambiar rol."
        : "Códigos generados. Configura SMTP_HOST/SMTP_USER/SMTP_PASS para enviarlos por correo; mientras tanto se muestran en pantalla.",
      admin_email: adminEmail,
      email_sent: mailResult.sent,
      mail_status: mailResult.reason || "sent",
      expires_in_minutes: Math.floor(ADMIN_CODE_TTL_MS / 60000),
      ...(includeCode ? { admin_code: adminCode } : {}),
      ...(includeCode && premiumCode ? { premium_code: premiumCode } : {})
    });
  } catch (error) {
    res.status(500).json({ message: dbErrorMessage(error) });
  }
};

export const revealAuthorCode = async (req, res) => {
  const { captcha_id, answer } = req.body;
  if (!validateCaptchaAnswer(captcha_id, answer)) {
    return res.status(400).json({ message: "Captcha inválido" });
  }
  const user = await User.findByPk(req.userId);
  if (!user || !["autor", "mixto"].includes(user.rol)) return res.status(403).json({ message: "Solo autor puede obtener código" });
  if (!user.author_code) {
    user.author_code = genCode();
    await user.save();
  }
  res.json({ author_code: user.author_code });
};

export const signup = async (req, res) => {
  try {
    const { nombre, email, password, rol = "lector", admin_code } = req.body;
    const cleanNombre = String(nombre || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanNombre || !password) {
      return res.status(400).json({ message: "Completa nombre, Gmail y contraseña" });
    }
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(cleanEmail)) {
      return res.status(400).json({ message: "Por ahora solo se permite registro con correo Gmail" });
    }
    const targetRole = ["autor", "lector", "mixto"].includes(rol) ? rol : "lector";
    if (["autor", "mixto"].includes(targetRole) && !validateAdminRegisterCode(cleanEmail, targetRole, admin_code)) {
      return res.status(403).json({ message: "Código admin inválido o expirado. Solicita un código automático nuevo para autor/mixto." });
    }
    const user = await User.create({
      nombre: cleanNombre,
      email: cleanEmail,
      rol: targetRole,
      author_code: ["autor", "mixto"].includes(targetRole) ? genCode() : null,
      password: bcrypt.hashSync(password, 8)
    });
    res.status(201).json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Ese Gmail ya está registrado. Inicia sesión y usa Cambiar rol para pasar de lector a autor/mixto sin crear otra cuenta." });
    }
    if (isDbConnectionError(error) || error.name === "SequelizeDatabaseError") {
      return res.status(500).json({ message: dbErrorMessage(error) });
    }
    res.status(500).json({ message: dbErrorMessage(error) });
  }
};

export const changeRole = async (req, res) => {
  try {
    const { target_rol, admin_code, premium_code } = req.body;
    const targetRole = ["autor", "mixto"].includes(target_rol) ? target_rol : "autor";
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const roleError = assertValidRoleChange(user.rol, targetRole, user.is_premium);
    if (roleError) return res.status(400).json({ message: roleError });
    if (!validateAdminRegisterCode(user.email, targetRole, admin_code)) {
      return res.status(403).json({ message: "Código admin inválido o expirado. Solicita un código automático nuevo para cambiar de rol." });
    }
    if (targetRole === "mixto" && !user.is_premium && !premiumCodeIsValid(user.email, premium_code)) {
      return res.status(402).json({ message: "La cuenta mixta es premium. Genera y pega el código premium para activar mixto." });
    }

    user.rol = targetRole;
    if (targetRole === "mixto") user.is_premium = true;
    if (["autor", "mixto"].includes(targetRole) && !user.author_code) user.author_code = genCode();
    await user.save();

    const token = jwt.sign({ id: user.id, rol: user.rol }, config.secret, { expiresIn: 86400 });
    res.json({
      message: targetRole === "mixto"
        ? "Cuenta actualizada a mixto premium. Conservas lectura y acceso administrativo avanzado."
        : "Cuenta actualizada a autor. Conservas tu acceso lector y habilitas gestión de autor.",
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      is_premium: user.is_premium,
      incognito_mode: user.incognito_mode,
      linked_author_id: user.linked_author_id,
      bio: user.bio,
      avatar_url: user.avatar_url,
      accessToken: token
    });
  } catch (error) {
    res.status(500).json({ message: dbErrorMessage(error) });
  }
};

export const signin = async (req, res) => {
  try {
    const cleanEmail = String(req.body.email || "").trim().toLowerCase();
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(cleanEmail)) {
      return res.status(400).json({ message: "Por ahora solo se permite Gmail" });
    }
    const user = await User.findOne({ where: { email: cleanEmail } });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    if (!bcrypt.compareSync(req.body.password, user.password)) return res.status(401).json({ accessToken: null, message: "Contraseña inválida" });
    const token = jwt.sign({ id: user.id, rol: user.rol }, config.secret, { expiresIn: 86400 });
    res.json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, is_premium: user.is_premium, incognito_mode: user.incognito_mode, linked_author_id: user.linked_author_id, bio: user.bio, avatar_url: user.avatar_url, accessToken: token });
  } catch (error) {
    res.status(500).json({ message: dbErrorMessage(error) });
  }
};


export const toggleIncognito = async (req, res) => {
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
  if (user.rol !== "mixto") return res.status(403).json({ message: "Solo rol mixto" });
  if (!user.is_premium) return res.status(402).json({ message: "Función premium" });
  user.incognito_mode = !user.incognito_mode;
  await user.save();
  res.json({ incognito_mode: user.incognito_mode });
};
