import { Router } from "express";
import { addLibroReview, createLibro, deleteLibro, getLibro, getLibros, getLibrosPublicos, intelligentBookSearch, supervisorReportLibro, updateLibro, validateLibroLinks } from "../controllers/libro.controller.js";
import { isAutor, isSupervisor, verifyToken } from "../middlewares/authJwt.js";
import { requireFields } from "../middlewares/validate.js";

const router = Router();
router.get("/api/libros-publicos", getLibrosPublicos);
router.get("/api/libros/ai-search", intelligentBookSearch);
router.get("/api/libros", verifyToken, getLibros);
router.get("/api/libros/:id", verifyToken, getLibro);
router.post("/api/libros", verifyToken, isAutor, requireFields(["titulo", "anio_publicacion", "derechos"]), createLibro);
router.post("/api/libros/:id/review", verifyToken, requireFields(["texto"]), addLibroReview);
router.put("/api/libros/:id", verifyToken, isAutor, updateLibro);
router.post("/api/libros/:id/validate-links", verifyToken, isSupervisor, validateLibroLinks);
router.post("/api/libros/:id/supervisor-report", verifyToken, isSupervisor, requireFields(["motivo"]), supervisorReportLibro);
router.delete("/api/libros/:id", verifyToken, isAutor, deleteLibro);
export default router;
