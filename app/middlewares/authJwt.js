import jwt from "jsonwebtoken";
import config from "../config/auth.config.js";
import db from "../models/index.js";

export const verifyToken = (req, res, next) => {
  const token = req.headers["x-access-token"] || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(403).json({ message: "Token requerido" });
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token inválido" });
    req.userId = decoded.id; req.userRole = decoded.rol; req.incognito = !!decoded.incognito; next();
  });
};

export const isAutor = async (req, res, next) => {
  if (["autor", "mixto"].includes(req.userRole)) return next();
  const user = await db.user.findByPk(req.userId);
  if (!user || !["autor", "mixto"].includes(user.rol)) return res.status(403).json({ message: "Solo autores administradores" });
  next();
};
