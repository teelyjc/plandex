"use server";

import { getPrismaClient } from "@/lib/db/prisma";
import { updateTodoSchema } from "../schemas/planning-schema";
import { revalidatePlannerPaths } from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function updateTodo(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const payload = updateTodoSchema.parse({
    workspaceId,
    todoId: formData.get("todoId"),
    taskId: formData.get("taskId"),
    title: formData.get("title"),
    done: formData.get("done") === "on",
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.todoItem.update({
    where: { id: payload.todoId },
    data: {
      taskId: payload.taskId || null,
      title: payload.title,
      done: payload.done,
    },
  });

  revalidatePlannerPaths(payload.workspaceId);
}
