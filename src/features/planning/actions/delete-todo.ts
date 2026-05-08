"use server";

import { getPrismaClient } from "@/lib/db/prisma";
import { revalidatePlannerPaths } from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function deleteTodo(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const todoId = String(formData.get("todoId") ?? "");
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  if (!todoId) {
    return;
  }

  await prisma.todoItem.delete({
    where: { id: todoId },
  });

  revalidatePlannerPaths(workspaceId);
}
