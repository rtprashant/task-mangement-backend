import express from "express";
import taskController from "../controllers/task.controllers.js";
import { verifyAuth, verifyPermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyAuth);
router.get("/", verifyPermission(["tasks:read"]), taskController.list);
router.get("/:id", verifyPermission(["tasks:read"]), taskController.getById);
router.post("/", verifyPermission(["tasks:create"]), taskController.create);
router.put("/:id", verifyPermission(["tasks:update"]), taskController.update);
router.delete("/:id", verifyPermission(["tasks:delete"]), taskController.remove);

export default router;
