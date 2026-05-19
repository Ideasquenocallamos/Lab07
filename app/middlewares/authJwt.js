import jwt from "jsonwebtoken";
import config from "../config/auth.config.js";
import db from "../models/index.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = req.headers["x-access-token"] || authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(403).json({ message: "Token requerido" });
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token inválido" });
    req.userId = decoded.id; req.userRole = decoded.rol; next();
  });
};

export const isAutor = async (req, res, next) => {
  if (["autor", "mixto", "supervisor"].includes(req.userRole)) return next();
  const user = await db.user.findByPk(req.userId);
  if (!user || !["autor", "mixto", "supervisor"].includes(user.rol)) return res.status(403).json({ message: "Solo autores administradores" });
  next();
};

export const isMixtoPremium = async (req, res, next) => {
  if (req.userRole === "supervisor") return next();
  const user = await db.user.findByPk(req.userId);
  if (!user || user.rol !== "mixto" || !user.is_premium) {
    return res.status(403).json({ message: "Función premium exclusiva para cuentas mixtas o supervisor" });
  }
  next();
};

export const isSupervisor = (req, res, next) => {
  if (req.userRole === "supervisor") return next();
  return res.status(403).json({ message: "Solo el supervisor puede usar este módulo" });
};
