import { Router } from "express";
import { createLibro, deleteLibro, getLibro, getLibros, getPublicLibros, updateLibro } from "../controllers/libro.controller.js";
import { isAutor, verifyToken } from "../middlewares/authJwt.js";
import { requireFields } from "../middlewares/validate.js";

const router = Router();
router.get('/api/public/libros', getPublicLibros);
router.get('/api/libros', verifyToken, getLibros);
router.get('/api/libros/:id', verifyToken, getLibro);
router.post('/api/libros', verifyToken, isAutor, requireFields(['titulo', 'anio_publicacion', 'derechos']), createLibro);
router.put('/api/libros/:id', verifyToken, isAutor, updateLibro);
router.delete('/api/libros/:id', verifyToken, isAutor, deleteLibro);
export default router;
