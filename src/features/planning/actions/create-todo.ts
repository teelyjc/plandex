"use server";

import { getPrismaClient } from "@/lib/db/prisma";
import { todoSchema } from "../schemas/planning-schema";
import { revalidatePlannerPaths } from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function createTodo(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const payload = todoSchema.parse({
    workspaceId,
    taskId: formData.get("taskId"),
    title: formData.get("title"),
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.todoItem.create({
    data: {
      workspaceId: payload.workspaceId,
      taskId: payload.taskId || null,
      title: payload.title,
    },
  });

  revalidatePlannerPaths(workspaceId);
}
