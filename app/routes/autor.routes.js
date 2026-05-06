import { Router } from "express";
import { createAutor, deleteAutor, getAutor, getAutores, updateAutor } from "../controllers/autor.controller.js";
import { isAutor, verifyToken } from "../middlewares/authJwt.js";
import { requireFields } from "../middlewares/validate.js";

const router = Router();
router.get("/api/autores", verifyToken, getAutores);
router.get("/api/autores/:id", verifyToken, getAutor);
router.post("/api/autores", verifyToken, isAutor, requireFields(["nombre_autor", "pais_origen", "fecha_nacimiento"]), createAutor);
router.put("/api/autores/:id", verifyToken, isAutor, updateAutor);
router.delete("/api/autores/:id", verifyToken, isAutor, deleteAutor);
export default router;
