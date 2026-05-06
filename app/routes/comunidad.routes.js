import { Router } from "express";
import { createComunidad, deleteComunidad, getComunidades, updateComunidad } from "../controllers/comunidad.controller.js";
import { isAutor, verifyToken } from "../middlewares/authJwt.js";

const router = Router();
router.get('/api/comunidades', verifyToken, getComunidades);
router.post('/api/comunidades', verifyToken, isAutor, createComunidad);
router.put('/api/comunidades/:id', verifyToken, isAutor, updateComunidad);
router.delete('/api/comunidades/:id', verifyToken, isAutor, deleteComunidad);
export default router;
