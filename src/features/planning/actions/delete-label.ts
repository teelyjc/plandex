"use server";

import { getPrismaClient } from "@/lib/db/prisma";
import { deleteLabelSchema } from "../schemas/planning-schema";
import { revalidatePlannerPaths } from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function deleteLabel(formData: FormData) {
  const payload = deleteLabelSchema.parse({
    workspaceId: formData.get("workspaceId"),
    labelId: formData.get("labelId"),
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.label.delete({
    where: { id: payload.labelId },
  });

  revalidatePlannerPaths(payload.workspaceId ?? "");
}
