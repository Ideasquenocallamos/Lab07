import db from "../models/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/auth.config.js";

const User = db.user;

export const signup = async (req, res) => {
  try {
    const { nombre, email, password, rol = "lector", admin_code } = req.body;
    const targetRole = rol === "autor" ? "autor" : "lector";
    if (targetRole === "autor" && admin_code !== (process.env.ADMIN_REGISTER_CODE || "LAB07_ADMIN")) {
      return res.status(403).json({ message: "Código admin inválido para rol autor" });
    }
    const user = await User.create({
      nombre,
      email,
      rol: targetRole,
      password: bcrypt.hashSync(password, 8)
    });
    res.status(201).json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const signin = async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) return res.status(401).json({ accessToken: null, message: "Contraseña inválida" });

    const token = jwt.sign({ id: user.id, rol: user.rol }, config.secret, { expiresIn: 86400 });
    res.json({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, bio: user.bio, avatar_url: user.avatar_url, accessToken: token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
