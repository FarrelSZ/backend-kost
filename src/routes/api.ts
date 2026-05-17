import express from "express";
import authController from "../controllers/auth.controller";
import authMiddleware from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import userController from "../controllers/user.controller";
import propertiController from "../controllers/properti.controller";
import { ROLES } from "../utils/constants";

const router = express.Router();

// Auth
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/refresh", authController.refreshToken);
router.post("/auth/logout", authController.logout);

router.put("/auth/update-password", authMiddleware, authController.updatePassword);

// User — self
router.get("/users/me", authMiddleware, userController.me);
router.put("/users/me", authMiddleware, userController.update);

// User — owner only
router.get("/users", authMiddleware, requireRole([ROLES.OWNER]), userController.findAll);
router.get("/users/:id", authMiddleware, requireRole([ROLES.OWNER]), userController.findById);
router.post("/users", authMiddleware, requireRole([ROLES.OWNER]), userController.create);
router.delete("/users/:id", authMiddleware, requireRole([ROLES.OWNER]), userController.remove);

// Properti
router.post("/properties", authMiddleware, requireRole([ROLES.OWNER]), propertiController.create);
router.get("/properties", authMiddleware, propertiController.findAll);
router.get("/properties/:id", authMiddleware, propertiController.findOne);
router.put("/properties/:id", authMiddleware, requireRole([ROLES.OWNER, ROLES.MANAGER]), propertiController.update);
router.delete("/properties/:id", authMiddleware, requireRole([ROLES.OWNER]), propertiController.remove);

export default router;
