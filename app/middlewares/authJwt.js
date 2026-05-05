import jwt from "jsonwebtoken";
import config from "../config/auth.config.js";
import db from "../models/index.js";

export const verifyToken = (req, res, next) => {
  const token = req.headers["x-access-token"] || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(403).json({ message: "Token requerido" });

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token inválido" });
    req.userId = decoded.id;
    req.userRole = decoded.rol;
    next();
  });
};

export const isAutor = async (req, res, next) => {
  if (req.userRole === "autor") return next();
  const user = await db.user.findByPk(req.userId);
  if (!user || user.rol !== "autor") return res.status(403).json({ message: "Solo autores administradores" });
  next();
};
