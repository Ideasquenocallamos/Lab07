import { Router } from "express";
import { createAutor, deleteAutor, getAutor, getAutores, updateAutor } from "../controllers/autor.controller.js";
import { verifyToken } from "../middlewares/authJwt.js";
import { requireFields } from "../middlewares/validate.js";

const router = Router();
router.get("/api/autores", verifyToken, getAutores);
router.get("/api/autores/:id", verifyToken, getAutor);
router.post("/api/autores", verifyToken, requireFields(["nombre_autor", "pais_origen", "fecha_nacimiento"]), createAutor);
router.put("/api/autores/:id", verifyToken, updateAutor);
router.delete("/api/autores/:id", verifyToken, deleteAutor);
export default router;
