"use server";

import { getPrismaClient } from "@/lib/db/prisma";
import { taskNoteSchema } from "../schemas/planning-schema";
import { revalidatePlannerPaths } from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function createTaskNote(formData: FormData) {
  const payload = taskNoteSchema.parse({
    workspaceId: formData.get("workspaceId"),
    taskId: formData.get("taskId"),
    authorId: formData.get("authorId") || undefined,
    content: formData.get("content"),
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.taskNote.create({
    data: {
      taskId: payload.taskId,
      authorId: payload.authorId || null,
      content: payload.content,
    },
  });

  revalidatePlannerPaths(payload.workspaceId);
}
