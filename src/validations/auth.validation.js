import { z } from "zod";

export const loginSchema = z.object({
    email: z
        .string()
        .email("Invalid email format")
        .trim()
        .toLowerCase(),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(100, "Password must not exceed 100 characters"),
});

export const registerSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must not exceed 50 characters")
        .trim(),
    email: z
        .string()
        .email("Invalid email format")
        .trim()
        .toLowerCase(),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(100, "Password must not exceed 100 characters"),
    roles: z
        .array(z.string())
        .optional()
        .default([]),
});

export const refreshTokenSchema = z.object({
    refreshToken: z
        .string()
        .min(1, "Refresh token is required"),
});

export const updateUserSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must not exceed 50 characters")
        .trim()
        .optional(),
    email: z
        .string()
        .email("Invalid email format")
        .trim()
        .toLowerCase()
        .optional(),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(100, "Password must not exceed 100 characters")
        .optional(),
    roles: z
        .array(z.string())
        .optional(),
    isActive: z.boolean().optional(),
});
