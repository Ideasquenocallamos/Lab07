import { Router } from "express";
import { createLibro, deleteLibro, getLibro, getLibros, updateLibro } from "../controllers/libro.controller.js";
import { verifyToken } from "../middlewares/authJwt.js";
import { requireFields } from "../middlewares/validate.js";

const router = Router();
router.get("/api/libros", verifyToken, getLibros);
router.get("/api/libros/:id", verifyToken, getLibro);
router.post("/api/libros", verifyToken, requireFields(["titulo", "anio_publicacion", "derechos", "id_autor"]), createLibro);
router.put("/api/libros/:id", verifyToken, updateLibro);
router.delete("/api/libros/:id", verifyToken, deleteLibro);
export default router;
