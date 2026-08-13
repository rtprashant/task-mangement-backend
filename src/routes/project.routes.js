import express from "express";
import projectController from "../controllers/project.controllers.js";
import { verifyAuth, verifyPermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyAuth);
router.get("/", verifyPermission(["projects:read"]), projectController.list);
router.get("/:id", verifyPermission(["projects:read"]), projectController.getById);
router.post("/", verifyPermission(["projects:create"]), projectController.create);
router.put("/:id", verifyPermission(["projects:update"]), projectController.update);
router.delete("/:id", verifyPermission(["projects:delete"]), projectController.remove);

export default router;
