import test from "node:test";
import assert from "node:assert/strict";
import pool from "../db/db.js";
import { getUserRolesAndPermissions } from "../utils/userPermissions.js";

test("admin profile contains every catalog permission", async (t) => {
  t.after(() => pool.end());

  const admin = await pool.query(
    `SELECT u.id
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE r.name = 'admin'
     LIMIT 1`
  );
  assert.ok(admin.rows[0], "an admin user is required");

  const profile = await getUserRolesAndPermissions(admin.rows[0].id);
  const catalog = await pool.query("SELECT name FROM permissions ORDER BY name");

  assert.deepEqual(profile.permissions, catalog.rows.map(({ name }) => name));
});
