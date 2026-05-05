import { Router } from "express";
import { createPost, getFeed, getNotifications, getSalaMessages, joinComunidad, sendSalaMessage } from "../controllers/social.controller.js";
import { verifyToken } from "../middlewares/authJwt.js";
import { requireFields } from "../middlewares/validate.js";

const router = Router();
router.post('/api/comunidades/join', verifyToken, requireFields(['id_comunidad']), joinComunidad);
router.post('/api/salas/message', verifyToken, requireFields(['id_sala', 'contenido']), sendSalaMessage);
router.get('/api/salas/:idSala/messages', verifyToken, getSalaMessages);
router.post('/api/feed/post', verifyToken, requireFields(['texto']), createPost);
router.get('/api/feed', verifyToken, getFeed);
router.get('/api/notifications', verifyToken, getNotifications);
export default router;
