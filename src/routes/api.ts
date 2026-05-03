import express from "express";
import authController from "../controllers/auth.controller";
import authMiddleware from "../middleware/auth.middleware";
import userController from "../controllers/user.controller";

const router = express.Router();

// Auth
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/refresh", authController.refreshToken);
router.post("/auth/logout", authController.logout);

router.put("/auth/update-password", authMiddleware, authController.updatePassword);

// User
router.get("/users/me", authMiddleware, userController.me);
router.put("/users/me", authMiddleware, userController.update);

export default router;
