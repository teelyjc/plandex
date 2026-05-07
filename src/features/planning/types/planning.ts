export type Label = {
  id: string;
  name: string;
  color: string;
};

export type Workspace = {
  id: string;
  name: string;
  description: string;
};

export type TaskStatus = "backlog" | "ready" | "active" | "review" | "done";

export type TaskPriority = "Low" | "Medium" | "High";

export type Task = {
  id: string;
  boardId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  startDate: string;
  dueDate: string;
  estimateHours: number;
  labels: string[];
  tags: string[];
  dependencies: string[];
  checklist: TodoItem[];
};

export type TodoItem = {
  id: string;
  workspaceId: string;
  taskId: string | null;
  title: string;
  done: boolean;
};

export type Board = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  columnOrder: TaskStatus[];
};

export type PlanningSnapshot = {
  workspaces: Workspace[];
  boards: Board[];
  labels: Label[];
  tasks: Task[];
  todos: TodoItem[];
};
