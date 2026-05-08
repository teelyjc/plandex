"use server";

import { getPrismaClient } from "@/lib/db/prisma";
import { labelSchema } from "../schemas/planning-schema";
import { revalidatePlannerPaths } from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function createLabel(formData: FormData) {
  const payload = labelSchema.parse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    color: formData.get("color"),
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.label.create({
    data: {
      name: payload.name,
      color: payload.color,
    },
  });

  revalidatePlannerPaths(payload.workspaceId ?? "");
}
