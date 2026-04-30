import jwt from "jsonwebtoken";
import authConfig from "../config/auth.config.js";
import db from "../models/index.js";

const User = db.user;
const Role = db.role;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ message: "No se proporcionó token" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Formato de token inválido" });
  }

  jwt.verify(token, authConfig.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token no válido o expirado" });
    }
    req.userId = decoded.id;
    next();
  });
};

const isAdmin = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      const hasRole = roles.some((role) => role.name === "admin");
      if (hasRole) {
        next();
      } else {
        res.status(403).json({ message: "Se requiere rol de administrador" });
      }
    });
  });
};

const isModerator = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      const hasRole = roles.some((role) => role.name === "moderator");
      if (hasRole) {
        next();
      } else {
        res.status(403).json({ message: "Se requiere rol de moderador" });
      }
    });
  });
};

const isModeratorOrAdmin = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      const hasRole = roles.some(
        (role) => role.name === "moderator" || role.name === "admin"
      );
      if (hasRole) {
        next();
      } else {
        res.status(403).json({ message: "Se requiere rol de moderador o administrador" });
      }
    });
  });
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  isModeratorOrAdmin
};

export default authJwt;
