"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrismaClient } from "@/lib/db/prisma";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function deleteWorkspace(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  if (!workspaceId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.taskDependency.deleteMany({
      where: {
        OR: [
          { task: { board: { workspaceId } } },
          { dependency: { board: { workspaceId } } },
        ],
      },
    });
    await tx.workspace.delete({
      where: { id: workspaceId },
    });
  });

  revalidatePath("/");
  redirect("/");
}
