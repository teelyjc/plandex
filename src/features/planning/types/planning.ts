export type Label = {
  id: string;
  name: string;
  color: string;
};

export type Workspace = {
  id: string;
  ownerId: string | null;
  name: string;
  description: string;
  owner: User | null;
};

export type User = {
  id: string;
  name: string;
  email: string | null;
  color: string;
};

export type TaskStatus = "backlog" | "ready" | "active" | "review" | "done";

export type TaskPriority = "Low" | "Medium" | "High";

export type Task = {
  id: string;
  boardId: string;
  ownerId: string | null;
  assigneeId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  owner: User | null;
  assigneeUser: User | null;
  startDate: string;
  dueDate: string;
  estimateHours: number;
  labels: string[];
  tags: string[];
  dependencies: string[];
  checklist: TodoItem[];
  notes: TaskNote[];
};

export type TaskNote = {
  id: string;
  taskId: string;
  authorId: string | null;
  author: User | null;
  content: string;
  createdAt: string;
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
  users: User[];
  workspaces: Workspace[];
  boards: Board[];
  labels: Label[];
  tasks: Task[];
  todos: TodoItem[];
};
