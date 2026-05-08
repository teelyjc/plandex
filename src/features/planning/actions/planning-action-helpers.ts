import { revalidatePath } from "next/cache";
import type { PlanningPrismaClient } from "./planning-action-types";

export const defaultColumnOrder = "backlog,ready,active,review,done";

const statusRank = {
  backlog: 0,
  ready: 1,
  active: 2,
  review: 3,
  done: 4,
} as const;

type RankedStatus = keyof typeof statusRank;

export function revalidatePlannerPaths(workspaceId: string) {
  revalidatePath("/");

  if (workspaceId) {
    revalidatePath(`/workspaces/${workspaceId}`);
  }
}

export function getFormList(formData: FormData, name: string) {
  return formData.getAll(name).map(String).filter(Boolean);
}

export function getFormTags(formData: FormData) {
  return String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function applyAutomaticTaskTime<T extends {
  automaticTime: boolean;
  status: string;
  startDate: string;
  dueDate: string;
}>(task: T): T {
  if (!task.automaticTime) {
    return task;
  }

  const today = new Date().toISOString().slice(0, 10);
  const nextTask = { ...task };

  if (nextTask.status === "backlog") {
    nextTask.startDate = today;

    if (nextTask.dueDate < today) {
      nextTask.dueDate = today;
    }
  }

  if (nextTask.status === "done") {
    nextTask.dueDate = today;

    if (nextTask.startDate > today) {
      nextTask.startDate = today;
    }
  }

  return nextTask;
}

export async function findUserName(prisma: PlanningPrismaClient, userId?: string) {
  if (!userId) {
    return null;
  }

  const user = (await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })) as { name: string } | null;

  return user?.name ?? null;
}

export async function assertDependenciesAllowStatus(
  prisma: PlanningPrismaClient,
  status: string,
  dependencyIds: string[],
) {
  const rankedStatus = toRankedStatus(status);

  if (!rankedStatus || dependencyIds.length === 0) {
    return;
  }

  const dependencies = (await prisma.task.findMany({
    where: {
      id: {
        in: dependencyIds,
      },
    },
    select: {
      title: true,
      status: true,
    },
  })) as Array<{ title: string; status: string }>;
  const blockingDependency = dependencies.find((dependency) => {
    const dependencyStatus = toRankedStatus(dependency.status);
    return dependencyStatus ? statusRank[rankedStatus] > statusRank[dependencyStatus] : false;
  });

  if (blockingDependency) {
    throw new Error(
      `Task status cannot be greater than dependency "${blockingDependency.title}" status.`,
    );
  }
}

export async function enforceDependentStatuses(
  prisma: PlanningPrismaClient,
  taskId: string,
  status: string,
) {
  const rankedStatus = toRankedStatus(status);

  if (!rankedStatus) {
    return;
  }

  const queue = [taskId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const dependencyId = queue.shift();

    if (!dependencyId || visited.has(dependencyId)) {
      continue;
    }

    visited.add(dependencyId);

    const dependents = (await prisma.task.findMany({
      where: {
        dependencies: {
          some: {
            dependencyId,
          },
        },
      },
      select: {
        id: true,
        status: true,
      },
    })) as Array<{ id: string; status: string }>;
    const dependentsToLower = dependents.filter((dependent) => {
      const dependentStatus = toRankedStatus(dependent.status);
      return dependentStatus ? statusRank[dependentStatus] > statusRank[rankedStatus] : false;
    });

    if (dependentsToLower.length === 0) {
      continue;
    }

    const dependentIds = dependentsToLower.map((dependent) => dependent.id);

    await prisma.task.updateMany({
      where: {
        id: {
          in: dependentIds,
        },
      },
      data: {
        status: rankedStatus,
      },
    });
    queue.push(...dependentIds);
  }
}

function toRankedStatus(status: string): RankedStatus | null {
  return status in statusRank ? (status as RankedStatus) : null;
}
