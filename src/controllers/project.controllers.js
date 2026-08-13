import projectService from "../services/project.services.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const projectController = {};

projectController.list = async (req, res) => {
  try {
    const data = await projectService.list(req.query);
    return res.status(200).json(new ApiResponse(200, "Projects fetched successfully", data));
  } catch (error) {
    return res.status(400).json(new ApiResponse(400, error.message || "Failed to fetch projects", null));
  }
};

projectController.getById = async (req, res) => {
  try {
    const project = await projectService.getById(req.params.id);
    return res.status(200).json(new ApiResponse(200, "Project fetched successfully", { project }));
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json(new ApiResponse(statusCode, error.message, null));
  }
};

projectController.create = async (req, res) => {
  try {
    const project = await projectService.create(req.body, req.user.userId);
    return res.status(201).json(new ApiResponse(201, "Project created successfully", { project }));
  } catch (error) {
    return res.status(400).json(new ApiResponse(400, error.message || "Failed to create project", null));
  }
};

projectController.update = async (req, res) => {
  try {
    const project = await projectService.update(req.params.id, req.body);
    return res.status(200).json(new ApiResponse(200, "Project updated successfully", { project }));
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json(new ApiResponse(statusCode, error.message, null));
  }
};

projectController.remove = async (req, res) => {
  try {
    const project = await projectService.remove(req.params.id);
    return res.status(200).json(new ApiResponse(200, "Project deleted successfully", { project }));
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json(new ApiResponse(statusCode, error.message, null));
  }
};

export default projectController;
