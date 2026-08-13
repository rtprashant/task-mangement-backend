import pool from "../db/db.js";
import {
  projectCreateSchema,
  projectListSchema,
  projectUpdateSchema,
} from "../validations/project.validation.js";

const projectService = {};

const mapProject = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  status: row.status,
  ownerId: row.owner_id,
  ownerName: row.owner_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

projectService.list = async (query) => {
  const filters = projectListSchema.parse(query);
  const params = [];
  const conditions = [];
  let paramIndex = 1;

  if (filters.search) {
    conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex += 1;
  }

  if (filters.status) {
    conditions.push(`p.status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex += 1;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortMap = {
    created_at_desc: "p.created_at DESC",
    created_at_asc: "p.created_at ASC",
    name_asc: "p.name ASC",
    name_desc: "p.name DESC",
  };
  const orderBy = sortMap[filters.sort] || sortMap.created_at_desc;
  const offset = (filters.page - 1) * filters.limit;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM projects p ${where}`,
    params
  );

  params.push(filters.limit, offset);
  const result = await pool.query(
    `SELECT p.*, u.name AS owner_name
     FROM projects p
     LEFT JOIN users u ON u.id = p.owner_id
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );

  return {
    items: result.rows.map(mapProject),
    total: countResult.rows[0].total,
    page: filters.page,
    limit: filters.limit,
  };
};

projectService.getById = async (id) => {
  const result = await pool.query(
    `SELECT p.*, u.name AS owner_name
     FROM projects p
     LEFT JOIN users u ON u.id = p.owner_id
     WHERE p.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("Project not found");
  }

  return mapProject(result.rows[0]);
};

projectService.create = async (payload, userId) => {
  const data = projectCreateSchema.parse(payload);
  const ownerId = data.ownerId || userId;

  const result = await pool.query(
    `INSERT INTO projects (name, description, status, owner_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.name, data.description || null, data.status, ownerId]
  );

  return projectService.getById(result.rows[0].id);
};

projectService.update = async (id, payload) => {
  const data = projectUpdateSchema.parse(payload);
  await projectService.getById(id);

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }
  if (data.ownerId !== undefined) {
    fields.push(`owner_id = $${paramIndex++}`);
    values.push(data.ownerId);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  fields.push("updated_at = NOW()");
  values.push(id);

  await pool.query(
    `UPDATE projects SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );

  return projectService.getById(id);
};

projectService.remove = async (id) => {
  const project = await projectService.getById(id);
  await pool.query("DELETE FROM projects WHERE id = $1", [id]);
  return project;
};

export default projectService;
