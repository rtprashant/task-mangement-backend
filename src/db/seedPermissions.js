import pool from "./db.js";
import { ALL_APP_PERMISSIONS } from "../constants/appPermissions.js";

const PERMISSION_DESCRIPTIONS = {
  "users:read": "List users",
  "users:create": "Create users",
  "users:update": "Update users",
  "users:delete": "Delete users",
  "roles:read": "List roles",
  "roles:create": "Create roles",
  "roles:update": "Update roles",
  "roles:delete": "Delete roles",
  "projects:read": "List projects",
  "projects:create": "Create projects",
  "projects:update": "Update projects",
  "projects:delete": "Delete projects",
  "tasks:read": "List tasks",
  "tasks:create": "Create tasks",
  "tasks:update": "Update tasks",
  "tasks:delete": "Delete tasks",
};

const seedPermissions = async () => {
  for (const name of ALL_APP_PERMISSIONS) {
    await pool.query(
      `INSERT INTO permissions (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING`,
      [name, PERMISSION_DESCRIPTIONS[name] || null]
    );
  }
  console.log("Permissions seed complete");
};

export default seedPermissions;
