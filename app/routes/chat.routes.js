import { Router } from "express";
import { askAppAssistant, getConversation, getInbox, sendMessage } from "../controllers/chat.controller.js";
import { verifyToken } from "../middlewares/authJwt.js";
import { requireFields } from "../middlewares/validate.js";

const router = Router();
router.get('/api/chat/inbox', verifyToken, getInbox);
router.get('/api/chat/conversation/:userId', verifyToken, getConversation);
router.post('/api/chat/send', verifyToken, requireFields(['to_user_id', 'mensaje']), sendMessage);
router.post('/api/chat/ask', requireFields(['pregunta']), askAppAssistant);
export default router;
