import db from "../models/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/auth.config.js";

const User = db.user;
const captchaStore = new Map();
const genCode = () => `AUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const getCaptcha = async (req, res) => { const a=Math.floor(Math.random()*9)+1,b=Math.floor(Math.random()*9)+1,id=`cap_${Date.now()}`; captchaStore.set(id,a+b); res.json({ captcha_id:id, question:`${a} + ${b} = ?`}); };
export const revealAuthorCode = async (req, res) => { const {captcha_id,answer}=req.body; if(!captchaStore.has(captcha_id)||Number(answer)!==captchaStore.get(captcha_id)) return res.status(400).json({message:'Captcha inválido'}); captchaStore.delete(captcha_id); const user=await User.findByPk(req.userId); if(!user||!["autor","mixto"].includes(user.rol)) return res.status(403).json({message:'Solo autor'}); if(!user.author_code){user.author_code=genCode(); await user.save();} res.json({author_code:user.author_code}); };

export const signup = async (req, res) => {
  try {
    const { nombre, email, password, rol = "lector", admin_code, parent_author_email, premium_code } = req.body;
    const targetRole = ["autor", "lector", "mixto"].includes(rol) ? rol : "lector";
    let parent_user_id = null; let is_premium_secondary = false;
    if (["autor"].includes(targetRole) && admin_code !== (process.env.ADMIN_REGISTER_CODE || "LAB07_ADMIN")) return res.status(403).json({ message: "Código admin inválido" });
    if (targetRole === "mixto") {
      if (premium_code !== (process.env.PREMIUM_CODE || "PREMIUM123")) return res.status(403).json({ message: "Función premium requerida" });
      const parent = await User.findOne({ where: { email: parent_author_email, rol: "autor" } });
      if (!parent) return res.status(404).json({ message: "Autor principal no encontrado" });
      parent_user_id = parent.id; is_premium_secondary = true;
    }
    const user = await User.create({ nombre, email, rol: targetRole, parent_user_id, is_premium_secondary, author_code: ["autor", "mixto"].includes(targetRole) ? genCode() : null, password: bcrypt.hashSync(password, 8) });
    res.status(201).json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const signin = async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    if (!bcrypt.compareSync(req.body.password, user.password)) return res.status(401).json({ accessToken: null, message: "Contraseña inválida" });
    const incognito = req.body.incognito === true && user.rol === "mixto";
    const token = jwt.sign({ id: user.id, rol: user.rol, incognito }, config.secret, { expiresIn: 86400 });
    res.json({ id: user.id, nombre: incognito ? "Modo incógnito" : user.nombre, email: incognito ? "oculto@incognito" : user.email, rol: user.rol, incognito, accessToken: token });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
