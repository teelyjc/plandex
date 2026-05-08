"use server";

import { getPrismaClient } from "@/lib/db/prisma";
import { updateWorkspaceSchema } from "../schemas/planning-schema";
import { revalidatePlannerPaths } from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function updateWorkspace(formData: FormData) {
  const payload = updateWorkspaceSchema.parse({
    workspaceId: formData.get("workspaceId"),
    ownerId: formData.get("ownerId") || undefined,
    name: formData.get("name"),
    description: formData.get("description"),
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.workspace.update({
    where: { id: payload.workspaceId },
    data: {
      name: payload.name,
      description: payload.description,
      ownerId: payload.ownerId || null,
    },
  });

  revalidatePlannerPaths(payload.workspaceId);
}
