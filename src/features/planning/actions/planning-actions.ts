"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrismaClient } from "@/lib/db/prisma";
import {
  deleteLabelSchema,
  labelSchema,
  taskSchema,
  todoDoneSchema,
  todoSchema,
  updateLabelSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  updateTodoSchema,
  updateWorkspaceSchema,
  workspaceSchema,
} from "../schemas/planning-schema";

const defaultColumnOrder = "backlog,ready,active,review,done";

type PlanningPrismaClient = {
  workspace: {
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  task: {
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  todoItem: {
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    updateMany: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  taskDependency: {
    createMany: (args: unknown) => Promise<unknown>;
    deleteMany: (args: unknown) => Promise<unknown>;
  };
  taskLabel: {
    createMany: (args: unknown) => Promise<unknown>;
    deleteMany: (args: unknown) => Promise<unknown>;
  };
  label: {
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
  $transaction: <T>(callback: (client: PlanningPrismaClient) => Promise<T>) => Promise<T>;
};

export async function createWorkspace(formData: FormData) {
  const payload = workspaceSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  const workspace = (await prisma.workspace.create({
    data: {
      name: payload.name,
      description: payload.description,
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

export async function updateWorkspace(formData: FormData) {
  const payload = updateWorkspaceSchema.parse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
    description: formData.get("description"),
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.workspace.update({
    where: { id: payload.workspaceId },
    data: {
      name: payload.name,
      description: payload.description,
    },
  });

  revalidatePlannerPaths(payload.workspaceId);
}

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

export async function createTask(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const labelIds = formData.getAll("labels").map(String).filter(Boolean);
  const dependencyIds = formData.getAll("dependencies").map(String).filter(Boolean);
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const payload = taskSchema.parse({
    boardId: formData.get("boardId"),
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status") ?? "backlog",
    priority: formData.get("priority") ?? "Medium",
    assignee: formData.get("assignee") || "You",
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
    estimateHours: formData.get("estimateHours"),
    labels: labelIds,
    tags,
    dependencies: dependencyIds,
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.$transaction(async (tx) => {
    const task = (await tx.task.create({
      data: {
        boardId: payload.boardId,
        title: payload.title,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        assignee: payload.assignee,
        startDate: new Date(`${payload.startDate}T00:00:00`),
        dueDate: new Date(`${payload.dueDate}T00:00:00`),
        estimateHours: payload.estimateHours,
        tags: payload.tags.join(","),
      },
      select: {
        id: true,
      },
    })) as { id: string };

    if (payload.labels.length > 0) {
      await tx.taskLabel.createMany({
        data: payload.labels.map((labelId) => ({
          taskId: task.id,
          labelId,
        })),
      });
    }

    if (payload.dependencies.length > 0) {
      await tx.taskDependency.createMany({
        data: payload.dependencies.map((dependencyId) => ({
          taskId: task.id,
          dependencyId,
        })),
      });
    }
  });

  revalidatePlannerPaths(workspaceId);
}

export async function updateTask(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const labelIds = formData.getAll("labels").map(String).filter(Boolean);
  const dependencyIds = formData.getAll("dependencies").map(String).filter(Boolean);
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const payload = updateTaskSchema.parse({
    taskId: formData.get("taskId"),
    boardId: formData.get("boardId"),
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status") ?? "backlog",
    priority: formData.get("priority") ?? "Medium",
    assignee: formData.get("assignee") || "You",
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
    estimateHours: formData.get("estimateHours"),
    labels: labelIds,
    tags,
    dependencies: dependencyIds.filter((dependencyId) => dependencyId !== formData.get("taskId")),
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: payload.taskId },
      data: {
        title: payload.title,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        assignee: payload.assignee,
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
  });

  revalidatePlannerPaths(workspaceId);
}

export async function deleteTask(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  if (!taskId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.taskDependency.deleteMany({
      where: {
        OR: [{ taskId }, { dependencyId: taskId }],
      },
    });
    await tx.todoItem.updateMany({
      where: { taskId },
      data: { taskId: null },
    });
    await tx.task.delete({
      where: { id: taskId },
    });
  });

  revalidatePlannerPaths(workspaceId);
}

export async function createTodo(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const payload = todoSchema.parse({
    workspaceId,
    taskId: formData.get("taskId"),
    title: formData.get("title"),
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.todoItem.create({
    data: {
      workspaceId: payload.workspaceId,
      taskId: payload.taskId || null,
      title: payload.title,
    },
  });

  revalidatePlannerPaths(workspaceId);
}

export async function updateTodo(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const payload = updateTodoSchema.parse({
    workspaceId,
    todoId: formData.get("todoId"),
    taskId: formData.get("taskId"),
    title: formData.get("title"),
    done: formData.get("done") === "on",
  });
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.todoItem.update({
    where: { id: payload.todoId },
    data: {
      taskId: payload.taskId || null,
      title: payload.title,
      done: payload.done,
    },
  });

  revalidatePlannerPaths(payload.workspaceId);
}

export async function deleteTodo(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const todoId = String(formData.get("todoId") ?? "");
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  if (!todoId) {
    return;
  }

  await prisma.todoItem.delete({
    where: { id: todoId },
  });

  revalidatePlannerPaths(workspaceId);
}

export async function updateTodoDone(input: {
  workspaceId: string;
  todoId: string;
  done: boolean;
}) {
  const payload = todoDoneSchema.parse(input);
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.todoItem.update({
    where: { id: payload.todoId },
    data: { done: payload.done },
  });

  revalidatePlannerPaths(payload.workspaceId);
}

export async function updateTaskStatus(input: {
  workspaceId: string;
  taskId: string;
  status: string;
}) {
  const payload = updateTaskStatusSchema.parse(input);
  const prisma = (await getPrismaClient()) as unknown as PlanningPrismaClient;

  await prisma.task.update({
    where: {
      id: payload.taskId,
    },
    data: {
      status: payload.status,
    },
  });

  revalidatePlannerPaths(payload.workspaceId);
}

function revalidatePlannerPaths(workspaceId: string) {
  revalidatePath("/");

  if (workspaceId) {
    revalidatePath(`/workspaces/${workspaceId}`);
  }
}
