import express from "express";
import authController from "../controllers/auth.controllers.js";
import { verifyAuth, verifyPermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes (no authentication required)
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);

// Protected routes (authentication required)
router.use(verifyAuth);
router.get("/me", authController.me);
router.get("/users", verifyPermission(["users:read"]), authController.listUsers);
router.post("/users", verifyPermission(["users:create"]), authController.createUser);
router.put("/users/:userId", verifyPermission(["users:update"]), authController.updateUser);
router.delete("/users/:userId", verifyPermission(["users:delete"]), authController.deleteUser);
router.delete("/logout", authController.logout);

export default router;
