"use server";

import { getPrismaClient } from "@/lib/db/prisma";
import { updateTaskStatusSchema } from "../schemas/planning-schema";
import {
  assertDependenciesAllowStatus,
  enforceDependentStatuses,
  revalidatePlannerPaths,
} from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function updateTaskStatus(input: {
  workspaceId: string;
  taskId: string;
  status: string;
}) {
  const payload = updateTaskStatusSchema.parse(input);
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;
  const task = (await prisma.task.findUnique({
    where: { id: payload.taskId },
    select: {
      dependencies: {
        select: {
          dependencyId: true,
        },
      },
    },
  })) as { dependencies: Array<{ dependencyId: string }> } | null;

  await assertDependenciesAllowStatus(
    prisma,
    payload.status,
    task?.dependencies.map((dependency) => dependency.dependencyId) ?? [],
  );

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: {
        id: payload.taskId,
      },
      data: {
        status: payload.status,
      },
    });
    await enforceDependentStatuses(tx, payload.taskId, payload.status);
  });

  revalidatePlannerPaths(payload.workspaceId);
}
