import pool from "../db/db.js";

const rbacService = {};

const resolvePermissionId = async (permissionName) => {
    const trimmed = permissionName.trim();
    const existing = await pool.query(
        "SELECT id FROM permissions WHERE name = $1",
        [trimmed]
    );

    if (existing.rows.length === 0) {
        throw new Error(`Permission '${trimmed}' does not exist`);
    }

    return existing.rows[0].id;
};

const assignPermissionsToRole = async (roleId, permissions = []) => {
    for (const permissionName of permissions) {
        const permissionId = await resolvePermissionId(permissionName);
        await pool.query(
            `INSERT INTO role_permissions (role_id, permission_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [roleId, permissionId]
        );
    }
};

rbacService.getUserRoles = async (userId) => {
    const userRolesQuery = await pool.query(
        "SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1",
        [userId]
    );

    return userRolesQuery.rows.map((row) => row.name);

}
rbacService.getRolePermissions = async (roleId) => {
    const rolePermissionsQuery = await pool.query(
        "SELECT p.name FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = $1",
        [roleId]
    );
    return rolePermissionsQuery.rows.map((row) => row.name);
}
rbacService.createRole = async (name, description, permissions) => {
    try {
        const createRoleQuery = await pool.query(
            "INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *",
            [name, description]
        );

        const roleId = createRoleQuery.rows[0].id;

        if (permissions && Array.isArray(permissions)) {
            await assignPermissionsToRole(roleId, permissions);
        }

        return {
            success: true,
            message: "Role created successfully",
            data: createRoleQuery.rows[0],
        };
    } catch (error) {
        throw error;
    }
}
rbacService.updateRole = async (roleId, name, description, permissions) => {
    try {
        // Check if role exists
        const roleCheck = await pool.query(
            "SELECT id FROM roles WHERE id = $1",
            [roleId]
        );

        if (roleCheck.rows.length === 0) {
            throw new Error("Role not found");
        }

        // Update role name and description
        const updateQuery = await pool.query(
            "UPDATE roles SET name = $1, description = $2 WHERE id = $3 RETURNING *",
            [name, description, roleId]
        );

        // Handle permissions update if provided
        if (permissions && Array.isArray(permissions)) {
            await pool.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);
            await assignPermissionsToRole(roleId, permissions);
        }

        return {
            success: true,
            message: "Role updated successfully",
            data: updateQuery.rows[0],
        };
    } catch (error) {
        throw error;
    }
}

rbacService.listRoles = async () => {
    const result = await pool.query(
        `SELECT r.id, r.name, r.description, r.created_at, r.updated_at,
                COUNT(rp.permission_id)::int AS permission_count,
                COALESCE(
                    array_agg(p.name ORDER BY p.name) FILTER (WHERE p.name IS NOT NULL),
                    '{}'
                ) AS permissions
         FROM roles r
         LEFT JOIN role_permissions rp ON r.id = rp.role_id
         LEFT JOIN permissions p ON p.id = rp.permission_id
         GROUP BY r.id
         ORDER BY r.name`
    );

    return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        permissionCount: row.permission_count,
        permissions: row.permissions,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    })).filter((role)=>role.name !="admin");
};

rbacService.getRole = async (roleId) => {
    const roles = await rbacService.listRoles();
    const role = roles.find((item) => String(item.id) === String(roleId));
    if (!role) {
        throw new Error("Role not found");
    }
    return role;
};

rbacService.listPermissions = async () => {
    const result = await pool.query(
        "SELECT id, name, description, created_at FROM permissions ORDER BY name"
    );

    return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
    }));
};

rbacService.deleteRole = async (roleId) => {
    try {
        // Check if role exists
        const roleCheck = await pool.query(
            "SELECT id FROM roles WHERE id = $1",
            [roleId]
        );

        if (roleCheck.rows.length === 0) {
            throw new Error("Role not found");
        }

        // Delete role permissions first
        await pool.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);

        // Delete user role assignments
        await pool.query("DELETE FROM user_roles WHERE role_id = $1", [roleId]);

        // Delete the role
        const deleteQuery = await pool.query(
            "DELETE FROM roles WHERE id = $1 RETURNING id, name",
            [roleId]
        );

        return {
            success: true,
            message: "Role deleted successfully",
            data: deleteQuery.rows[0],
        };
    } catch (error) {
        throw error;
    }
}
export default rbacService