import taskService from "../services/task.services.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const taskController = {};

taskController.list = async (req, res) => {
  try {
    const data = await taskService.list(req.query);
    return res.status(200).json(new ApiResponse(200, "Tasks fetched successfully", data));
  } catch (error) {
    return res.status(400).json(new ApiResponse(400, error.message || "Failed to fetch tasks", null));
  }
};

taskController.getById = async (req, res) => {
  try {
    const task = await taskService.getById(req.params.id);
    return res.status(200).json(new ApiResponse(200, "Task fetched successfully", { task }));
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json(new ApiResponse(statusCode, error.message, null));
  }
};

taskController.create = async (req, res) => {
  try {
    const task = await taskService.create(req.body);
    return res.status(201).json(new ApiResponse(201, "Task created successfully", { task }));
  } catch (error) {
    return res.status(400).json(new ApiResponse(400, error.message || "Failed to create task", null));
  }
};

taskController.update = async (req, res) => {
  try {
    const task = await taskService.update(req.params.id, req.body);
    return res.status(200).json(new ApiResponse(200, "Task updated successfully", { task }));
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json(new ApiResponse(statusCode, error.message, null));
  }
};

taskController.remove = async (req, res) => {
  try {
    const task = await taskService.remove(req.params.id);
    return res.status(200).json(new ApiResponse(200, "Task deleted successfully", { task }));
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json(new ApiResponse(statusCode, error.message, null));
  }
};

export default taskController;
