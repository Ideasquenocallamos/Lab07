import db from "../models/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/auth.config.js";

const User = db.user;
const captchaStore = new Map();
const genCode = () => `AUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

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
  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email || "")) {
    return res.status(400).json({ message: "Debes usar un correo Gmail válido" });
  }
  if (!["autor", "mixto"].includes(rol)) {
    return res.status(400).json({ message: "El código admin solo aplica para autor o mixto" });
  }

  const data = captchaStore.get(captcha_id);
  if (!data || Date.now() > data.expiresAt || String(answer || "").toUpperCase().trim() !== String(data.code).toUpperCase()) {
    return res.status(400).json({ message: "Captcha inválido o expirado" });
  }
  captchaStore.delete(captcha_id);

  const adminEmail = process.env.ADMIN_EMAIL || "admin.autor@lab07.com";
  const subject = encodeURIComponent(`Solicitud de código admin para rol ${rol}`);
  const body = encodeURIComponent(`Hola administrador, solicito el código de registro para rol ${rol}.
Correo Gmail solicitante: ${email}

Por favor responder a este correo con el código autorizado.`);
  const mailto_url = `mailto:${adminEmail}?subject=${subject}&body=${body}`;
  const gmail_url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(adminEmail)}&su=${subject}&body=${body}`;

  res.json({
    message: "Solicitud validada. Envía este correo al administrador desde Gmail para recibir el código en tu correo.",
    admin_email: adminEmail,
    gmail_url,
    mailto_url
  });
};

export const revealAuthorCode = async (req, res) => {
  const { captcha_id, answer } = req.body;
  const data = captchaStore.get(captcha_id);
  if (!data || Date.now() > data.expiresAt || String(answer || "").toUpperCase().trim() !== String(data.code).toUpperCase()) {
    return res.status(400).json({ message: "Captcha inválido" });
  }
  captchaStore.delete(captcha_id);
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
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email || "")) {
      return res.status(400).json({ message: "Por ahora solo se permite registro con correo Gmail" });
    }
    const targetRole = ["autor", "lector", "mixto"].includes(rol) ? rol : "lector";
    if (["autor", "mixto"].includes(targetRole) && admin_code !== (process.env.ADMIN_REGISTER_CODE || "LAB07_ADMIN")) {
      return res.status(403).json({ message: "Código admin inválido para rol autor/mixto" });
    }
    const user = await User.create({ nombre, email, rol: targetRole, author_code: ["autor", "mixto"].includes(targetRole) ? genCode() : null, password: bcrypt.hashSync(password, 8) });
    res.status(201).json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Ese correo Gmail ya está registrado. Inicia sesión o usa otro Gmail." });
    }
    if (error.name === "SequelizeDatabaseError") {
      return res.status(500).json({ message: "Error de base de datos. Revisa que Railway haya sincronizado las tablas y variables DB." });
    }
    res.status(500).json({ message: error.message || "No se pudo completar el registro" });
  }
};

export const signin = async (req, res) => {
  try {
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(req.body.email || "")) {
      return res.status(400).json({ message: "Por ahora solo se permite Gmail" });
    }
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    if (!bcrypt.compareSync(req.body.password, user.password)) return res.status(401).json({ accessToken: null, message: "Contraseña inválida" });
    const token = jwt.sign({ id: user.id, rol: user.rol }, config.secret, { expiresIn: 86400 });
    res.json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, is_premium: user.is_premium, incognito_mode: user.incognito_mode, linked_author_id: user.linked_author_id, bio: user.bio, avatar_url: user.avatar_url, accessToken: token });
  } catch (error) { res.status(500).json({ message: error.message }); }
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
