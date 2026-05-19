import { Router } from "express";
import { createPost, getCommunityAnalytics, getFeed, getNotifications, getRootDatabaseSnapshot, getSalaMessages, getTablesOverview, joinComunidad, moderateMember, sendSalaMessage } from "../controllers/social.controller.js";
import { isMixtoPremium, verifyToken } from "../middlewares/authJwt.js";
import { requireFields } from "../middlewares/validate.js";

const router = Router();
router.post('/api/comunidades/join', verifyToken, requireFields(['id_comunidad']), joinComunidad);
router.post('/api/salas/message', verifyToken, requireFields(['id_sala', 'contenido']), sendSalaMessage);
router.get('/api/salas/:idSala/messages', verifyToken, getSalaMessages);
router.post('/api/feed/post', verifyToken, requireFields(['texto']), createPost);
router.get('/api/feed', verifyToken, getFeed);
router.get('/api/notifications', verifyToken, getNotifications);
router.get('/api/comunidades/:idComunidad/analytics', verifyToken, isMixtoPremium, getCommunityAnalytics);
router.get('/api/admin/tables-overview', verifyToken, isMixtoPremium, getTablesOverview);
router.get('/api/admin/root-snapshot', verifyToken, getRootDatabaseSnapshot);
router.post('/api/comunidades/members/moderate', verifyToken, isMixtoPremium, requireFields(['id_comunidad', 'user_id']), moderateMember);
export default router;
