import { Router } from "express";
import {
  allAccess, userBoard, moderatorBoard, adminBoard
} from "../controllers/user.controller.js";
import { authJwt } from "../middlewares/index.js";

const router = Router();

router.get("/api/test/all", allAccess);
router.get("/api/test/user", [authJwt.verifyToken], userBoard);
router.get("/api/test/mod",
  [authJwt.verifyToken, authJwt.isModerator],
  moderatorBoard
);
router.get("/api/test/admin",
  [authJwt.verifyToken, authJwt.isAdmin],
  adminBoard
);

export default router;
