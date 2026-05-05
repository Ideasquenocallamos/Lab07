import db from "../models/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/auth.config.js";

const User = db.user;
const captchaStore = new Map();
const genCode = () => `AUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const getCaptcha = async (req, res) => {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const captcha_id = `cap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  captchaStore.set(captcha_id, a + b);
  res.json({ captcha_id, question: `${a} + ${b} = ?` });
};

export const revealAuthorCode = async (req, res) => {
  const { captcha_id, answer } = req.body;
  if (!captchaStore.has(captcha_id) || Number(answer) !== captchaStore.get(captcha_id)) {
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
    const targetRole = ["autor", "lector", "mixto"].includes(rol) ? rol : "lector";
    if (["autor", "mixto"].includes(targetRole) && admin_code !== (process.env.ADMIN_REGISTER_CODE || "LAB07_ADMIN")) {
      return res.status(403).json({ message: "Código admin inválido para rol autor/mixto" });
    }
    const user = await User.create({ nombre, email, rol: targetRole, author_code: ["autor", "mixto"].includes(targetRole) ? genCode() : null, password: bcrypt.hashSync(password, 8) });
    res.status(201).json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const signin = async (req, res) => {
  try {
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
