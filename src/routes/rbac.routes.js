import express from "express";
import rbacController from "../controllers/rbac.controllers.js";
import { verifyAuth, verifyRole, verifyPermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All RBAC routes require authentication
router.use(verifyAuth);

router.get("/permissions", verifyPermission(["roles:read"]), rbacController.listPermissions);
router.get("/roles", verifyPermission(["roles:read"]), rbacController.listRoles);
router.get("/roles/:roleId/permissions", rbacController.getRolePermissions);
router.get("/roles/:roleId", verifyPermission(["roles:read"]), rbacController.getRole);
router.get("/users/:userId/roles", rbacController.getUserRoles);

// Create role (admin only)
router.post("/roles", verifyRole(["admin"]), rbacController.createRole);

// Update role (admin only)
router.put("/roles/:roleId", verifyRole(["admin"]), rbacController.updateRole);

// Delete role (admin only)
router.delete("/roles/:roleId", verifyRole(["admin"]), rbacController.deleteRole);

export default router;
