"use server";

import { getPrismaClient } from "@/lib/db/prisma";
import { todoDoneSchema } from "../schemas/planning-schema";
import { revalidatePlannerPaths } from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function updateTodoDone(input: {
  workspaceId: string;
  todoId: string;
  done: boolean;
}) {
  const payload = todoDoneSchema.parse(input);
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.todoItem.update({
    where: { id: payload.todoId },
    data: { done: payload.done },
  });

  revalidatePlannerPaths(payload.workspaceId);
}
