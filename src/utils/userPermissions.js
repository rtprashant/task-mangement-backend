import pool from "../db/db.js";
import { ALL_APP_PERMISSIONS } from "../constants/appPermissions.js";

export const getUserRolesAndPermissions = async (userId) => {
  const userResult = await pool.query(
    "SELECT id, name, email, is_active FROM users WHERE id = $1",
    [userId]
  );
  if (userResult.rows.length === 0) return null;

  const user = userResult.rows[0];
  const rolesResult = await pool.query(
    `SELECT r.name FROM roles r
     INNER JOIN user_roles ur ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  const roles = rolesResult.rows.map((role) => role.name);

  let permissions;
  if (roles.includes("admin")) {
    const allPermissions = await pool.query(
      "SELECT name FROM permissions ORDER BY name"
    );
    const fromDb = allPermissions.rows.map((permission) => permission.name);
    permissions = [...new Set([...ALL_APP_PERMISSIONS, ...fromDb])].sort();
  } else {
    const permissionsResult = await pool.query(
      `SELECT DISTINCT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN roles r ON r.id = rp.role_id
       WHERE r.name = ANY($1)
       ORDER BY p.name`,
      [roles]
    );
    permissions = permissionsResult.rows.map(
      (permission) => permission.name
    );
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.is_active,
    roles,
    permissions,
  };
};
