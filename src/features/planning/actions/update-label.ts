"use server";

import { getPrismaClient } from "@/lib/db/prisma";
import { updateLabelSchema } from "../schemas/planning-schema";
import { revalidatePlannerPaths } from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function updateLabel(formData: FormData) {
  const payload = updateLabelSchema.parse({
    workspaceId: formData.get("workspaceId"),
    labelId: formData.get("labelId"),
    name: formData.get("name"),
    color: formData.get("color"),
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.label.update({
    where: { id: payload.labelId },
    data: {
      name: payload.name,
      color: payload.color,
    },
  });

  revalidatePlannerPaths(payload.workspaceId ?? "");
}
