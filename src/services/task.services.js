import pool from "../db/db.js";
import {
  taskCreateSchema,
  taskListSchema,
  taskUpdateSchema,
} from "../validations/task.validation.js";

const taskService = {};

const mapTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  projectId: row.project_id,
  projectName: row.project_name,
  assigneeId: row.assignee_id,
  assigneeName: row.assignee_name,
  dueDate: row.due_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

taskService.list = async (query) => {
  const filters = taskListSchema.parse(query);
  const params = [];
  const conditions = [];
  let paramIndex = 1;

  if (filters.search) {
    conditions.push(`(t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex += 1;
  }
  if (filters.status) {
    conditions.push(`t.status = $${paramIndex++}`);
    params.push(filters.status);
  }
  if (filters.priority) {
    conditions.push(`t.priority = $${paramIndex++}`);
    params.push(filters.priority);
  }
  if (filters.projectId) {
    conditions.push(`t.project_id = $${paramIndex++}`);
    params.push(filters.projectId);
  }
  if (filters.assigneeId) {
    conditions.push(`t.assignee_id = $${paramIndex++}`);
    params.push(filters.assigneeId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortMap = {
    created_at_desc: "t.created_at DESC",
    due_date_asc: "t.due_date ASC NULLS LAST",
    due_date_desc: "t.due_date DESC NULLS LAST",
    title_asc: "t.title ASC",
  };
  const orderBy = sortMap[filters.sort] || sortMap.created_at_desc;
  const offset = (filters.page - 1) * filters.limit;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM tasks t ${where}`,
    params
  );

  params.push(filters.limit, offset);
  const result = await pool.query(
    `SELECT t.*, p.name AS project_name, u.name AS assignee_name
     FROM tasks t
     LEFT JOIN projects p ON p.id = t.project_id
     LEFT JOIN users u ON u.id = t.assignee_id
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );

  return {
    items: result.rows.map(mapTask),
    total: countResult.rows[0].total,
    page: filters.page,
    limit: filters.limit,
  };
};

taskService.getById = async (id) => {
  const result = await pool.query(
    `SELECT t.*, p.name AS project_name, u.name AS assignee_name
     FROM tasks t
     LEFT JOIN projects p ON p.id = t.project_id
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE t.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("Task not found");
  }

  return mapTask(result.rows[0]);
};

taskService.create = async (payload) => {
  const data = taskCreateSchema.parse(payload);

  const projectCheck = await pool.query("SELECT id FROM projects WHERE id = $1", [data.projectId]);
  if (projectCheck.rows.length === 0) {
    throw new Error("Project not found");
  }

  const result = await pool.query(
    `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      data.title,
      data.description || null,
      data.status,
      data.priority,
      data.projectId,
      data.assigneeId || null,
      data.dueDate || null,
    ]
  );

  return taskService.getById(result.rows[0].id);
};

taskService.update = async (id, payload) => {
  const data = taskUpdateSchema.parse(payload);
  await taskService.getById(id);

  const fields = [];
  const values = [];
  let paramIndex = 1;

  const fieldMap = {
    title: "title",
    description: "description",
    status: "status",
    priority: "priority",
    projectId: "project_id",
    assigneeId: "assignee_id",
    dueDate: "due_date",
  };

  Object.entries(fieldMap).forEach(([key, column]) => {
    if (data[key] !== undefined) {
      fields.push(`${column} = $${paramIndex++}`);
      values.push(data[key]);
    }
  });

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  fields.push("updated_at = NOW()");
  values.push(id);

  await pool.query(
    `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );

  return taskService.getById(id);
};

taskService.remove = async (id) => {
  const task = await taskService.getById(id);
  await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  return task;
};

export default taskService;
