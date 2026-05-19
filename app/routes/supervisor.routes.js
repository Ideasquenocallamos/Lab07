import express from "express";
import * as supervisorController from "../controllers/supervisor.controller.js";
import { authJwt } from "../middlewares/index.js";

const router = express.Router();

// Dashboard
router.get("/api/supervisor/dashboard", [authJwt.verifyToken], supervisorController.getSupervisorDashboard);

// Usuarios
router.get("/api/supervisor/users", [authJwt.verifyToken], supervisorController.getAllUsers);
router.get("/api/supervisor/users/:userId", [authJwt.verifyToken], supervisorController.getUserDetails);
router.put("/api/supervisor/users/:userId", [authJwt.verifyToken], supervisorController.modifyUser);
router.post("/api/supervisor/users/:userId/disable", [authJwt.verifyToken], supervisorController.disableUser);

// Aplicaciones
router.get("/api/supervisor/apps", [authJwt.verifyToken], supervisorController.getAllApps);
router.post("/api/supervisor/apps/:appId/suspend", [authJwt.verifyToken], supervisorController.suspendApp);
router.post("/api/supervisor/apps/:appId/reactivate", [authJwt.verifyToken], supervisorController.reactivateApp);
router.delete("/api/supervisor/apps/:appId", [authJwt.verifyToken], supervisorController.deleteApp);

// Auditoría
router.get("/api/supervisor/audit-logs", [authJwt.verifyToken], supervisorController.getAuditLogs);

// Permisos (solo supervisores premium)
router.put("/api/supervisor/permissions/:targetSupervisorId", [authJwt.verifyToken], supervisorController.updateSupervisorPermissions);

export default router;
