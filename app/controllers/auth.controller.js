import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const User = db.user;
const Role = db.role;
const Op = db.Sequelize.Op;

export const signup = (req, res) => {
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8)
  })
    .then((user) => {
      if (req.body.roles) {
        Role.findAll({
          where: { name: { [Op.or]: req.body.roles } }
        }).then((roles) => {
          user.setRoles(roles).then(() => {
            res.status(201).json({ message: "Usuario registrado exitosamente" });
          });
        });
      } else {
        user.setRoles([1]).then(() => {
          res.status(201).json({ message: "Usuario registrado exitosamente" });
        });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
};

export const signin = (req, res) => {
  User.findOne({
    where: { username: req.body.username }
  })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).json({
          accessToken: null,
          message: "Contrasena incorrecta"
        });
      }

      const token = jwt.sign({ id: user.id }, authConfig.secret, {
        algorithm: "HS256",
        expiresIn: 86400
      });

      user.getRoles().then((roles) => {
        res.status(200).json({
          id: user.id,
          username: user.username,
          email: user.email,
          roles: roles.map((role) => role.name),
          accessToken: token
        });
      });
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
};
