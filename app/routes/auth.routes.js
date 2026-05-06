import { Router } from "express";
import { changeRole, getCaptcha, requestAdminCode, revealAuthorCode, signin, signup, toggleIncognito } from "../controllers/auth.controller.js";
import { requireFields } from "../middlewares/validate.js";
import { verifyToken } from "../middlewares/authJwt.js";

const router = Router();
router.post("/api/auth/signup", requireFields(["nombre", "email", "password"]), signup);
router.post("/api/auth/signin", requireFields(["email", "password"]), signin);
router.post("/api/auth/request-admin-code", requireFields(["email", "rol", "captcha_id", "answer"]), requestAdminCode);
router.get("/api/auth/captcha", getCaptcha);
router.post("/api/auth/author-code", verifyToken, requireFields(["captcha_id", "answer"]), revealAuthorCode);
router.post("/api/auth/change-role", verifyToken, requireFields(["target_rol", "admin_code"]), changeRole);
router.post("/api/auth/incognito/toggle", verifyToken, toggleIncognito);
export default router;
