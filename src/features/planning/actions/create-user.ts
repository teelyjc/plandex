"use server";

import { revalidatePath } from "next/cache";
import { getPrismaClient } from "@/lib/db/prisma";
import { userSchema } from "../schemas/planning-schema";
import type { PlanningPrismaClient } from "./planning-action-types";

export async function createUser(formData: FormData) {
  const payload = userSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    color: formData.get("color") || "#35624a",
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email || null,
      color: payload.color,
    },
  });

  revalidatePath("/");
}
