import { z } from "zod";

export const taskStatusSchema = z.enum([
  "backlog",
  "ready",
  "active",
  "review",
  "done",
]);

export const taskSchema = z
  .object({
    boardId: z.string().trim().min(1, "Board is required"),
    ownerId: z.string().trim().optional(),
    assigneeId: z.string().trim().optional(),
    title: z.string().trim().min(2, "Task title is required"),
    description: z.string().trim().max(500).default(""),
    status: taskStatusSchema,
    automaticTime: z.boolean().default(false),
    priority: z.enum(["Low", "Medium", "High"]),
    assignee: z.string().trim().min(1).default("You"),
    startDate: z.iso.date(),
    dueDate: z.iso.date(),
    estimateHours: z.coerce.number().int().positive().max(200),
    labels: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    dependencies: z.array(z.string()).default([]),
  })
  .refine((task) => task.startDate <= task.dueDate, {
    message: "Due date must be on or after start date",
    path: ["dueDate"],
  });

export const updateTaskSchema = taskSchema.extend({
  taskId: z.string().trim().min(1, "Task is required"),
});

export const taskNoteSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace is required"),
  taskId: z.string().trim().min(1, "Task is required"),
  authorId: z.string().trim().optional(),
  content: z.string().trim().min(2, "Note is required").max(1000),
});

export const workspaceSchema = z.object({
  ownerId: z.string().trim().optional(),
  name: z.string().trim().min(2),
  description: z.string().trim().max(240).default(""),
});

export const updateWorkspaceSchema = workspaceSchema.extend({
  workspaceId: z.string().trim().min(1, "Workspace is required"),
});

export const userSchema = z.object({
  name: z.string().trim().min(2, "User name is required").max(80),
  email: z
    .string()
    .trim()
    .email("Email must be valid")
    .optional()
    .or(z.literal("")),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "User color must be a hex color"),
});

export const updateUserSchema = userSchema.extend({
  userId: z.string().trim().min(1, "User is required"),
});

export const labelSchema = z.object({
  workspaceId: z.string().trim().optional(),
  name: z.string().trim().min(2, "Label name is required").max(40),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Label color must be a hex color"),
});

export const updateLabelSchema = labelSchema.extend({
  labelId: z.string().trim().min(1, "Label is required"),
});

export const deleteLabelSchema = z.object({
  workspaceId: z.string().trim().optional(),
  labelId: z.string().trim().min(1, "Label is required"),
});

export const todoSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace is required"),
  taskId: z.string().trim().optional(),
  title: z.string().trim().min(2, "Todo title is required"),
});

export const updateTodoSchema = todoSchema.extend({
  todoId: z.string().trim().min(1, "Todo is required"),
  done: z.coerce.boolean().default(false),
});

export const todoDoneSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace is required"),
  todoId: z.string().trim().min(1, "Todo is required"),
  done: z.boolean(),
});

export const updateTaskStatusSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace is required"),
  taskId: z.string().trim().min(1, "Task is required"),
  status: taskStatusSchema,
});
