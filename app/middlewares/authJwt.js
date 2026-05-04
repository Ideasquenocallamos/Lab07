import jwt from "jsonwebtoken";
import config from "../config/auth.config.js";

export const verifyToken = (req, res, next) => {
  const token = req.headers["x-access-token"] || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(403).json({ message: "Token requerido" });

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token inválido" });
    req.userId = decoded.id;
    next();
  });
};
