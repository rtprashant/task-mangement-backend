import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().optional().nullable(),
  status: z.enum(["active", "on_hold", "completed"]).default("active"),
  ownerId: z.coerce.number().int().positive().optional().nullable(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const projectListSchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["active", "on_hold", "completed"]).optional(),
  sort: z.enum(["created_at_desc", "created_at_asc", "name_asc", "name_desc"]).default("created_at_desc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
