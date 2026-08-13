import authService from "../services/auth.services.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { setAuthCookies, clearAuthCookies } from "../utils/setAuthCookies.js";

const authController = {};

authController.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        setAuthCookies(res, result.accessToken, result.refreshToken);
        return res.status(200).json(
            new ApiResponse(200, "Login successful", {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            })
        );
    } catch (error) {
        return res.status(401).json(
            new ApiResponse(401, error.message || "Login failed", null)
        );
    }
};

authController.logout = async (req, res) => {
    try {
        clearAuthCookies(res);

        return res.status(200).json(
            new ApiResponse(200, "Logout successful", null)
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(500, "Logout failed", null)
        );
    }
};

authController.register = async (req, res) => {
    try {
        const { name, email, password, roles } = req.body;
        const result = await authService.createUser(name, email, password, roles);

        return res.status(201).json(
            new ApiResponse(201, result.message, result.user)
        );
    } catch (error) {
        return res.status(400).json(
            new ApiResponse(400, error.message || "Registration failed", null)
        );
    }
};

authController.createUser = async (req, res) => {
    try {
        const { name, email, password, roles } = req.body;
        const result = await authService.createUser(name, email, password, roles);

        return res.status(201).json(
            new ApiResponse(201, result.message, result.user)
        );
    } catch (error) {
        return res.status(400).json(
            new ApiResponse(400, error.message || "User creation failed", null)
        );
    }
};

authController.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        const result = await authService.updateUser(userId, updateData);

        return res.status(200).json(
            new ApiResponse(200, result.message, result.user)
        );
    } catch (error) {
        const statusCode = error.message.includes("not found") ? 404 : 400;
        return res.status(statusCode).json(
            new ApiResponse(statusCode, error.message || "Update failed", null)
        );
    }
};

authController.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await authService.deleteUser(userId);

        return res.status(200).json(
            new ApiResponse(200, result.message, result.data)
        );
    } catch (error) {
        const statusCode = error.message.includes("not found") ? 404 : 400;
        return res.status(statusCode).json(
            new ApiResponse(statusCode, error.message || "Delete failed", null)
        );
    }
};

authController.refreshToken = async (req, res) => {
    try {
        const refreshTokenValue =
            req.body?.refreshToken || req.cookies?.refreshToken;

        if (!refreshTokenValue) {
            return res.status(400).json(
                new ApiResponse(400, "Refresh token is required", null)
            );
        }

        const result = await authService.refreshToken(refreshTokenValue);
        setAuthCookies(res, result.accessToken, result.refreshToken);

        return res.status(200).json(
            new ApiResponse(200, result.message, {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            })
        );
    } catch (error) {
        return res.status(401).json(
            new ApiResponse(401, error.message || "Token refresh failed", null)
        );
    }
};

authController.me = async (req, res) => {
    try {
        const result = await authService.getMe(req.user.userId);
        setAuthCookies(res, result.accessToken, result.refreshToken);
        return res.status(200).json(
            new ApiResponse(200, "Current user fetched successfully", {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            })
        );
    } catch (error) {
        return res.status(401).json(
            new ApiResponse(401, error.message || "Unauthorized", null)
        );
    }
};

authController.listUsers = async (req, res) => {
    try {
        const users = await authService.listUsers({ search: req.query.search });
        return res
            .status(200)
            .json(new ApiResponse(200, "Users fetched successfully", { users }));
    } catch (error) {
        return res
            .status(400)
            .json(new ApiResponse(400, error.message || "Failed to list users", null));
    }
};

export default authController;
