"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrismaClient } from "@/lib/db/prisma";
import { workspaceSchema } from "../schemas/planning-schema";
import { defaultColumnOrder } from "./planning-action-helpers";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function createWorkspace(formData: FormData) {
  const payload = workspaceSchema.parse({
    ownerId: formData.get("ownerId") || undefined,
    name: formData.get("name"),
    description: formData.get("description"),
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  const workspace = (await prisma.workspace.create({
    data: {
      name: payload.name,
      description: payload.description,
      ownerId: payload.ownerId || null,
      boards: {
        create: {
          name: "Main board",
          description: "Default planning board",
          columnOrder: defaultColumnOrder,
        },
      },
    },
    select: {
      id: true,
    },
  })) as { id: string };

  revalidatePath("/");
  redirect(`/workspaces/${workspace.id}`);
}
