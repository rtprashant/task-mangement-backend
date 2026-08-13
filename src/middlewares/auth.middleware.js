import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import pool from "../db/db.js";

export const verifyAuth = (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        const token =
            req.cookies?.accessToken ||
            req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json(
                new ApiResponse(401, "Unauthorized: No token provided", null)
            );
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET || "your-secret-key"
        );

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json(
            new ApiResponse(401, "Unauthorized: Invalid token", null)
        );
    }
};

export const verifyRole = (requiredRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json(
                    new ApiResponse(401, "Unauthorized: No user found", null)
                );
            }

            const userRoles = req.user.roles || [];
            const hasRole = requiredRoles.some((role) =>
                userRoles.includes(role)
            );

            if (!hasRole) {
                return res.status(403).json(
                    new ApiResponse(
                        403,
                        `Forbidden: Required roles are ${requiredRoles.join(", ")}`,
                        null
                    )
                );
            }

            next();
        } catch (error) {
            return res.status(500).json(
                new ApiResponse(500, "Internal server error", null)
            );
        }
    };
};

export const verifyPermission = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json(
                    new ApiResponse(401, "Unauthorized: No user found", null)
                );
            }

            const userRoles = req.user.roles || [];

            // Admin has access to everything
            if (userRoles.includes("admin")) {
                return next();
            }


            if (userRoles.length === 0) {
                return res.status(403).json(
                    new ApiResponse(403, "Forbidden: No roles assigned", null)
                );
            }


            const permissionsQuery = await pool.query(
                `SELECT DISTINCT p.name 
                FROM permissions p 
                JOIN role_permissions rp ON p.id = rp.permission_id 
                JOIN roles r ON r.id = rp.role_id 
                WHERE r.name = ANY($1)`,
                [userRoles]
            );

            const userPermissions = permissionsQuery.rows.map((row) => row.name);

            const hasPermission = requiredPermissions.some((perm) =>
                userPermissions.includes(perm)
            );

            if (!hasPermission) {
                return res.status(403).json(
                    new ApiResponse(
                        403,
                        `Forbidden: Required permissions are ${requiredPermissions.join(
                            ", "
                        )}`,
                        null
                    )
                );
            }
            req.userPermissions = userPermissions;
            next();
        } catch (error) {
            console.error("Permission check error:", error);
            return res.status(500).json(
                new ApiResponse(500, "Internal server error", null)
            );
        }
    };
};


