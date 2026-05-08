"use server";

import { getPrismaClient } from "@/lib/db/prisma";
import { updateTaskSchema } from "../schemas/planning-schema";
import {
  applyAutomaticTaskTime,
  assertDependenciesAllowStatus,
  enforceDependentStatuses,
  findUserName,
  getFormList,
  getFormTags,
  revalidatePlannerPaths,
} from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function updateTask(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const taskId = formData.get("taskId");
  const labelIds = getFormList(formData, "labels");
  const dependencyIds = getFormList(formData, "dependencies");
  const tags = getFormTags(formData);
  const payload = applyAutomaticTaskTime(updateTaskSchema.parse({
    taskId,
    boardId: formData.get("boardId"),
    ownerId: formData.get("ownerId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status") ?? "backlog",
    automaticTime: formData.has("automaticTime"),
    priority: formData.get("priority") ?? "Medium",
    assignee: formData.get("assignee") || "You",
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
    estimateHours: formData.get("estimateHours"),
    labels: labelIds,
    tags,
    dependencies: dependencyIds.filter((dependencyId) => dependencyId !== taskId),
  }));
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await assertDependenciesAllowStatus(prisma, payload.status, payload.dependencies);
  const assigneeName = (await findUserName(prisma, payload.assigneeId)) ?? payload.assignee;

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: payload.taskId },
      data: {
        ownerId: payload.ownerId || null,
        assigneeId: payload.assigneeId || null,
        title: payload.title,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        assignee: assigneeName,
        startDate: new Date(`${payload.startDate}T00:00:00`),
        dueDate: new Date(`${payload.dueDate}T00:00:00`),
        estimateHours: payload.estimateHours,
        tags: payload.tags.join(","),
      },
    });
    await tx.taskLabel.deleteMany({ where: { taskId: payload.taskId } });
    await tx.taskDependency.deleteMany({ where: { taskId: payload.taskId } });

    if (payload.labels.length > 0) {
      await tx.taskLabel.createMany({
        data: payload.labels.map((labelId) => ({
          taskId: payload.taskId,
          labelId,
        })),
      });
    }

    if (payload.dependencies.length > 0) {
      await tx.taskDependency.createMany({
        data: payload.dependencies.map((dependencyId) => ({
          taskId: payload.taskId,
          dependencyId,
        })),
      });
    }
    await enforceDependentStatuses(tx, payload.taskId, payload.status);
  });

  revalidatePlannerPaths(workspaceId);
}
