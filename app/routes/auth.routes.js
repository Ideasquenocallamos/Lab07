import { Router } from "express";
import { signin, signup } from "../controllers/auth.controller.js";
import { requireFields } from "../middlewares/validate.js";

const router = Router();
router.post("/api/auth/signup", requireFields(["nombre", "email", "password"]), signup);
router.post("/api/auth/signin", requireFields(["email", "password"]), signin);
export default router;
