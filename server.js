import express from "express";
import cors from "cors";
import db from "./app/models/index.js";
import authRoutes from "./app/routes/auth.routes.js";
import autorRoutes from "./app/routes/autor.routes.js";
import libroRoutes from "./app/routes/libro.routes.js";
import chatRoutes from "./app/routes/chat.routes.js";
import comunidadRoutes from "./app/routes/comunidad.routes.js";
import salaRoutes from "./app/routes/sala.routes.js";
import socialRoutes from "./app/routes/social.routes.js";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("app/uploads"));

app.use(authRoutes);
app.use(autorRoutes);
app.use(libroRoutes);
app.use(chatRoutes);
app.use(comunidadRoutes);
app.use(salaRoutes);
app.use(socialRoutes);

app.get("/api/health", async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", db: "disconnected" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor en puerto ${PORT}`);
  try {
    await db.sequelize.sync();
    console.log("Base de datos sincronizada");
  } catch (error) {
    console.error("No se pudo sincronizar DB al iniciar:", error.message);
  }
});
