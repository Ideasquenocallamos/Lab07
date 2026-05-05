import { Router } from "express";
import { createSala, deleteSala, getSalasByComunidad } from "../controllers/sala.controller.js";
import { isAutor, verifyToken } from "../middlewares/authJwt.js";

const router = Router();
router.get('/api/comunidades/:idComunidad/salas', verifyToken, getSalasByComunidad);
router.post('/api/salas', verifyToken, isAutor, createSala);
router.delete('/api/salas/:id', verifyToken, isAutor, deleteSala);
export default router;
