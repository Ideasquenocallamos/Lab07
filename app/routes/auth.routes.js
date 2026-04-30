import { Router } from "express";
import { signup, signin } from "../controllers/auth.controller.js";
import { verifySignUp } from "../middlewares/index.js";

const router = Router();

router.post(
  "/api/auth/signup",
  [
    verifySignUp.checkDuplicateUsernameOrEmail,
    verifySignUp.checkRolesExisted
  ],
  signup
);

router.post("/api/auth/signin", signin);

export default router;
