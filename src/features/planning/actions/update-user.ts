"use server";

import { revalidatePath } from "next/cache";
import { getPrismaClient } from "@/lib/db/prisma";
import { updateUserSchema } from "../schemas/planning-schema";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function updateUser(formData: FormData) {
  const payload = updateUserSchema.parse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    color: formData.get("color") || "#35624a",
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.user.update({
    where: { id: payload.userId },
    data: {
      name: payload.name,
      email: payload.email || null,
      color: payload.color,
    },
  });

  revalidatePath("/");
}
