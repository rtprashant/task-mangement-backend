import rbacService from "../services/rbac.services.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const rbacController = {};

rbacController.listRoles = async (req, res) => {
    try {
        const roles = await rbacService.listRoles();
        return res.status(200).json(
            new ApiResponse(200, "Roles fetched successfully", { roles })
        );
    } catch (error) {
        return res.status(400).json(
            new ApiResponse(400, error.message || "Failed to fetch roles", null)
        );
    }
};

rbacController.getRole = async (req, res) => {
    try {
        const role = await rbacService.getRole(req.params.roleId);
        return res.status(200).json(
            new ApiResponse(200, "Role fetched successfully", { role })
        );
    } catch (error) {
        const statusCode = error.message.includes("not found") ? 404 : 400;
        return res.status(statusCode).json(
            new ApiResponse(statusCode, error.message || "Failed to fetch role", null)
        );
    }
};

rbacController.listPermissions = async (req, res) => {
    try {
        const permissions = await rbacService.listPermissions();
        return res.status(200).json(
            new ApiResponse(200, "Permissions fetched successfully", { permissions })
        );
    } catch (error) {
        return res.status(400).json(
            new ApiResponse(400, error.message || "Failed to fetch permissions", null)
        );
    }
};

rbacController.getUserRoles = async (req, res) => {
    try {
        const { userId } = req.params;

        const roles = await rbacService.getUserRoles(userId);

        return res.status(200).json(
            new ApiResponse(200, "User roles fetched successfully", { roles })
        );
    } catch (error) {
        return res.status(400).json(
            new ApiResponse(400, error.message || "Failed to fetch user roles", null)
        );
    }
};

rbacController.getRolePermissions = async (req, res) => {
    try {
        const { roleId } = req.params;

        const permissions = await rbacService.getRolePermissions(roleId);

        return res.status(200).json(
            new ApiResponse(200, "Role permissions fetched successfully", {
                permissions,
            })
        );
    } catch (error) {
        return res.status(400).json(
            new ApiResponse(
                400,
                error.message || "Failed to fetch role permissions",
                null
            )
        );
    }
};

rbacController.createRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;

        const result = await rbacService.createRole(
            name,
            description,
            permissions
        );

        return res.status(201).json(
            new ApiResponse(201, result.message, result.data)
        );
    } catch (error) {
        return res.status(400).json(
            new ApiResponse(400, error.message || "Failed to create role", null)
        );
    }
};

rbacController.updateRole = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { name, description, permissions } = req.body;

        const result = await rbacService.updateRole(
            roleId,
            name,
            description,
            permissions
        );

        return res.status(200).json(
            new ApiResponse(200, result.message, result.data)
        );
    } catch (error) {
        const statusCode = error.message.includes("not found") ? 404 : 400;
        return res.status(statusCode).json(
            new ApiResponse(statusCode, error.message || "Failed to update role", null)
        );
    }
};

rbacController.deleteRole = async (req, res) => {
    try {
        const { roleId } = req.params;

        const result = await rbacService.deleteRole(roleId);

        return res.status(200).json(
            new ApiResponse(200, result.message, result.data)
        );
    } catch (error) {
        const statusCode = error.message.includes("not found") ? 404 : 400;
        return res.status(statusCode).json(
            new ApiResponse(statusCode, error.message || "Failed to delete role", null)
        );
    }
};

export default rbacController;
