import express from "express";
import cors from "cors";
import db from "./app/models/index.js";
import authRoutes from "./app/routes/auth.routes.js";
import userRoutes from "./app/routes/user.routes.js";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(authRoutes);
app.use(userRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Bienvenido al laboratorio JWT" });
});

function inicializarRoles() {
  const Role = db.role;
  Role.create({ id: 1, name: "user" });
  Role.create({ id: 2, name: "moderator" });
  Role.create({ id: 3, name: "admin" });
}

db.sequelize
  .sync({ force: true })
  .then(() => {
    console.log("Base de datos sincronizada");
    inicializarRoles();
    console.log("Roles creados: user, moderator, admin");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error al sincronizar la base de datos:", err);
  });
