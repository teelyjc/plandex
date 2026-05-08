"use server";

import { getPrismaClient } from "@/lib/db/prisma";
import { revalidatePlannerPaths } from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function deleteTask(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  if (!taskId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.taskDependency.deleteMany({
      where: {
        OR: [{ taskId }, { dependencyId: taskId }],
      },
    });
    await tx.todoItem.updateMany({
      where: { taskId },
      data: { taskId: null },
    });
    await tx.task.delete({
      where: { id: taskId },
    });
  });

  revalidatePlannerPaths(workspaceId);
}
