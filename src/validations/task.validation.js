import { z } from "zod";

export const taskCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().optional().nullable(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  projectId: z.coerce.number().int().positive(),
  assigneeId: z.coerce.number().int().positive().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const taskListSchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  projectId: z.coerce.number().int().positive().optional(),
  assigneeId: z.coerce.number().int().positive().optional(),
  sort: z.enum(["created_at_desc", "due_date_asc", "due_date_desc", "title_asc"]).default("created_at_desc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
