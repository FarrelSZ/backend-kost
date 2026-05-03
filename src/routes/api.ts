import express from "express";
import authController from "../controllers/auth.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = express.Router();

// Auth
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/refresh", authController.refreshToken);
router.post("/auth/logout", authController.logout);
router.get("/auth/me", authMiddleware, authController.me);
router.put("/auth/update-password", authMiddleware, authController.updatePassword);

export default router;
