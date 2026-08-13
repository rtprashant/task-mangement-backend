import pool from "../db/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema, registerSchema, updateUserSchema, refreshTokenSchema } from "../validations/auth.validation.js";
import { generateToken } from "../utils/generateToken.js";
import { getUserRolesAndPermissions } from "../utils/userPermissions.js";

const authService = {}


authService.login = async (email, password) => {
    try {
        const validatedData = loginSchema.parse({ email, password });

        const result = await pool.query(
            "SELECT id, name, email, password_hash, is_active FROM users WHERE email = $1",
            [validatedData.email]
        );

        if (result.rows.length === 0) {
            throw new Error("Invalid email or password");
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(
            validatedData.password,
            user.password_hash
        );

        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        const profile = await getUserRolesAndPermissions(user.id);
        const { accessToken, refreshToken } = generateToken(
            profile.id,
            profile.email,
            profile.roles
        );
        return {
            success: true,
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                roles: profile.roles,
                permissions: profile.permissions,
            },
        };
    } catch (error) {
        if (error.name === "ZodError") {
            throw new Error(`Validation error: ${error.errors[0].message}`);
        }
        throw error;
    }
}
authService.createUser = async (name, email, password, roles) => {
    try {

        const validatedData = registerSchema.parse({
            name,
            email,
            password,
            roles,
        });

        // Check if email already exists
        const emailCheck = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [validatedData.email]
        );

        if (emailCheck.rows.length > 0) {
            throw new Error("Email already registered");
        }

        const userCount = await pool.query("SELECT COUNT(*) FROM users");
        const isFirstUser = parseInt(userCount.rows[0].count, 10) === 0;

        let userRoles = validatedData.roles || [];
        if (isFirstUser) {
            await pool.query(
                `INSERT INTO roles (name, description)
                 VALUES ('admin', 'Full access')
                 ON CONFLICT (name) DO NOTHING`
            );
            userRoles = ["admin"];
        }

        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        const userResult = await pool.query(
            "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
            [validatedData.name, validatedData.email, hashedPassword]
        );

        const user = userResult.rows[0];

        for (const roleName of userRoles) {
            const roleResult = await pool.query(
                "SELECT id FROM roles WHERE name = $1",
                [roleName]
            );

            if (roleResult.rows.length === 0) {
                throw new Error(`Role '${roleName}' does not exist`);
            }

            const roleId = roleResult.rows[0].id;
            await pool.query(
                "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
                [user.id, roleId]
            );
        }

        return {
            success: true,
            message: "User created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                roles: userRoles,
            },
        };
    } catch (error) {
        if (error.name === "ZodError") {
            throw new Error(`Validation error: ${error.errors[0].message}`);
        }
        throw error;
    }
}

authService.updateUser = async (userId, updateData) => {
    try {
        // Validate input with Zod
        const validatedData = updateUserSchema.parse(updateData);

        // Check if user exists
        const userCheck = await pool.query(
            "SELECT id, email FROM users WHERE id = $1",
            [userId]
        );

        if (userCheck.rows.length === 0) {
            throw new Error("User not found");
        }

        const user = userCheck.rows[0];

        // Check if email is being changed and if it's already in use
        if (validatedData.email && validatedData.email !== user.email) {
            const emailCheck = await pool.query(
                "SELECT id FROM users WHERE email = $1",
                [validatedData.email]
            );

            if (emailCheck.rows.length > 0) {
                throw new Error("Email already in use");
            }
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (validatedData.name) {
            updateFields.push(`name = $${paramIndex}`);
            updateValues.push(validatedData.name);
            paramIndex++;
        }

        if (validatedData.email) {
            updateFields.push(`email = $${paramIndex}`);
            updateValues.push(validatedData.email);
            paramIndex++;
        }

        if (validatedData.password) {
            const hashedPassword = await bcrypt.hash(validatedData.password, 10);
            updateFields.push(`password_hash = $${paramIndex}`);
            updateValues.push(hashedPassword);
            paramIndex++;
        }

        if (validatedData.isActive !== undefined) {
            updateFields.push(`is_active = $${paramIndex}`);
            updateValues.push(validatedData.isActive);
            paramIndex++;
        }

        if (updateFields.length === 0 && validatedData.roles === undefined) {
            throw new Error("No fields to update");
        }

        // Update user fields
        if (updateFields.length > 0) {
            updateValues.push(userId);
            const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING id, name, email`;
            await pool.query(query, updateValues);
        }

        // Handle role updates if provided
        let finalRoles = [];
        if (validatedData.roles !== undefined) {
            await pool.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);

            for (const roleName of validatedData.roles) {
                const roleResult = await pool.query(
                    "SELECT id FROM roles WHERE name = $1",
                    [roleName]
                );

                if (roleResult.rows.length === 0) {
                    throw new Error(`Role '${roleName}' does not exist`);
                }

                const roleId = roleResult.rows[0].id;
                await pool.query(
                    "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
                    [userId, roleId]
                );
            }
            finalRoles = validatedData.roles;
        }

        const updatedUserResult = await pool.query(
            "SELECT id, name, email, is_active FROM users WHERE id = $1",
            [userId]
        );
        const updatedUser = updatedUserResult.rows[0];

        if (finalRoles.length === 0 && validatedData.roles === undefined) {
            const rolesResult = await pool.query(
                "SELECT r.name FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1",
                [updatedUser.id]
            );
            finalRoles = rolesResult.rows.map((row) => row.name);
        }

        return {
            success: true,
            message: "User updated successfully",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                isActive: updatedUser.is_active,
                roles: finalRoles,
            },
        };
    } catch (error) {
        if (error.name === "ZodError") {
            throw new Error(`Validation error: ${error.errors[0].message}`);
        }
        throw error;
    }
}

authService.deleteUser = async (userId) => {
    try {
        // Check if user exists
        const userCheck = await pool.query(
            "SELECT id FROM users WHERE id = $1",
            [userId]
        );

        if (userCheck.rows.length === 0) {
            throw new Error("User not found");
        }

        // Delete user roles first (foreign key constraint)
        await pool.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);

        // Delete user
        const result = await pool.query(
            "DELETE FROM users WHERE id = $1 RETURNING id, email",
            [userId]
        );

        return {
            success: true,
            message: "User deleted successfully",
            data: {
                id: result.rows[0].id,
                email: result.rows[0].email,
            },
        };
    } catch (error) {
        throw error;
    }
}

authService.refreshToken = async (refreshTokenValue) => {
    try {
        // Validate input with Zod
        const validatedData = refreshTokenSchema.parse({
            refreshToken: refreshTokenValue,
        });

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(
                validatedData.refreshToken,
                process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret"
            );
        } catch (error) {
            throw new Error("Invalid or expired refresh token");
        }

        const profile = await getUserRolesAndPermissions(decoded.userId);
        if (!profile) {
            throw new Error("User not found");
        }

        const { accessToken, refreshToken: newRefreshToken } = generateToken(
            profile.id,
            profile.email,
            profile.roles
        );

        return {
            success: true,
            message: "Token refreshed successfully",
            accessToken,
            refreshToken: newRefreshToken,
            user: {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                roles: profile.roles,
                permissions: profile.permissions,
            },
        };
    } catch (error) {
        if (error.name === "ZodError") {
            throw new Error(`Validation error: ${error.errors[0].message}`);
        }
        throw error;
    }
}

authService.getMe = async (userId) => {
    const profile = await getUserRolesAndPermissions(userId);
    if (!profile) throw new Error("User not found");

    const { accessToken, refreshToken } = generateToken(
        profile.id,
        profile.email,
        profile.roles
    );
    return {
        accessToken,
        refreshToken,
        user: {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            roles: profile.roles,
            permissions: profile.permissions,
        },
    };
};

authService.listUsers = async ({ search = "" } = {}) => {
    const params = [];
    let where = "";
    if (search) {
        params.push(`%${search}%`);
        where = "WHERE u.name ILIKE $1 OR u.email ILIKE $1";
    }
    const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.is_active, u.created_at,
                COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON r.id = ur.role_id
         ${where}
         GROUP BY u.id
         ORDER BY u.created_at DESC`,
        params
    );
    return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        isActive: row.is_active,
        roles: row.roles,
        createdAt: row.created_at,
    }));
};

export default authService