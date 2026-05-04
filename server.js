import express from "express";
import cors from "cors";
import db from "./app/models/index.js";
import authRoutes from "./app/routes/auth.routes.js";
import autorRoutes from "./app/routes/autor.routes.js";
import libroRoutes from "./app/routes/libro.routes.js";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("app/uploads"));

app.use(authRoutes);
app.use(autorRoutes);
app.use(libroRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API CRUD de libros, autores y comunidades" });
});

db.sequelize.sync().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
}).catch((error) => console.error("Error de conexión:", error));
