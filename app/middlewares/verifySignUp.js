import db from "../models/index.js";

const ROLES = db.ROLES;
const User = db.user;

const checkDuplicateUsernameOrEmail = (req, res, next) => {
  User.findOne({
    where: {
      username: req.body.username
    }
  }).then((user) => {
    if (user) {
      res.status(400).json({ message: "El nombre de usuario ya existe" });
      return;
    }

    User.findOne({
      where: {
        email: req.body.email
      }
    }).then((user) => {
      if (user) {
        res.status(400).json({ message: "El correo electrónico ya está registrado" });
        return;
      }

      next();
    });
  });
};

const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).json({
          message: `El rol ${req.body.roles[i]} no existe`
        });
        return;
      }
    }
  }
  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted
};

export default verifySignUp;
