import type { PlanningSnapshot, TaskPriority, TaskStatus } from "@/features/planning/types/planning";
import { getPrismaClient } from "@/lib/db/prisma";

const defaultColumnOrder: TaskStatus[] = ["backlog", "ready", "active", "review", "done"];

type DatabaseLabel = {
  id: string;
  name: string;
  color: string;
};

type DatabaseBoard = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  columnOrder: string;
  tasks: DatabaseTask[];
};

type DatabaseWorkspace = {
  id: string;
  name: string;
  description: string;
  boards: DatabaseBoard[];
  todos: DatabaseTodo[];
};

type DatabaseTask = {
  id: string;
  boardId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  startDate: Date;
  dueDate: Date;
  estimateHours: number;
  tags: string;
  labels: Array<{
    labelId: string;
  }>;
  dependencies: Array<{
    dependencyId: string;
  }>;
  checklist: Array<{
    id: string;
    workspaceId: string;
    taskId: string | null;
    title: string;
    done: boolean;
  }>;
};

type DatabaseTodo = {
  id: string;
  workspaceId: string;
  taskId: string | null;
  title: string;
  done: boolean;
};

type PlanningReadClient = {
  workspace: {
    findMany: (args: unknown) => Promise<DatabaseWorkspace[]>;
  };
  label: {
    findMany: (args: unknown) => Promise<DatabaseLabel[]>;
  };
};

export async function findPlanningSnapshot(workspaceId?: string) {
  try {
    const prisma = (await getPrismaClient()) as unknown as PlanningReadClient;
    const [workspaces, labels] = await Promise.all([
      prisma.workspace.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          boards: {
            orderBy: { createdAt: "asc" },
            include: {
              tasks: {
                orderBy: { createdAt: "asc" },
                include: {
                  labels: true,
                  dependencies: true,
                  checklist: {
                    orderBy: { createdAt: "asc" },
                  },
                },
              },
            },
          },
          todos: {
            where: {
              taskId: null,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.label.findMany({
        orderBy: { name: "asc" },
      }),
    ]);
    const boards = workspaces
      .filter((workspace) => !workspaceId || workspace.id === workspaceId)
      .flatMap((workspace) => workspace.boards);
    const workspaceTodos = workspaces
      .filter((workspace) => !workspaceId || workspace.id === workspaceId)
      .flatMap((workspace) => workspace.todos);

    return {
      workspaces: workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
      })),
      boards: boards.map((board) => ({
        id: board.id,
        workspaceId: board.workspaceId,
        name: board.name,
        description: board.description,
        columnOrder: parseColumnOrder(board.columnOrder),
      })),
      labels: labels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
      })),
      tasks: boards.flatMap((board) =>
        board.tasks.map((task) => ({
          id: task.id,
          boardId: task.boardId,
          title: task.title,
          description: task.description,
          status: parseStatus(task.status),
          priority: parsePriority(task.priority),
          assignee: task.assignee,
          startDate: toDateInputValue(task.startDate),
          dueDate: toDateInputValue(task.dueDate),
          estimateHours: task.estimateHours,
          labels: task.labels.map((label) => label.labelId),
          tags: parseTags(task.tags),
          dependencies: task.dependencies.map((dependency) => dependency.dependencyId),
          checklist: task.checklist.map((todo) => ({
            id: todo.id,
            workspaceId: todo.workspaceId,
            taskId: todo.taskId,
            title: todo.title,
            done: todo.done,
          })),
        })),
      ),
      todos: workspaceTodos.map((todo) => ({
        id: todo.id,
        workspaceId: todo.workspaceId,
        taskId: todo.taskId,
        title: todo.title,
        done: todo.done,
      })),
    };
  } catch (error) {
    console.error("Failed to load planning data", error);
    return getEmptyPlanningSnapshot();
  }
}

function getEmptyPlanningSnapshot(): PlanningSnapshot {
  return {
    workspaces: [],
    boards: [],
    labels: [],
    tasks: [],
    todos: [],
  };
}

function parseColumnOrder(value: string): TaskStatus[] {
  const columns = value
    .split(",")
    .map((column) => column.trim())
    .filter(isTaskStatus);

  return columns.length > 0 ? columns : defaultColumnOrder;
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseStatus(value: string): TaskStatus {
  return isTaskStatus(value) ? value : "backlog";
}

function parsePriority(value: string): TaskPriority {
  if (value === "Low" || value === "Medium" || value === "High") {
    return value;
  }

  return "Medium";
}

function isTaskStatus(value: string): value is TaskStatus {
  return (
    value === "backlog" ||
    value === "ready" ||
    value === "active" ||
    value === "review" ||
    value === "done"
  );
}

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}
