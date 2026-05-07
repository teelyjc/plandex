"use client";

import { formatShortDate } from "@/lib/utils/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createLabel,
  createTask,
  createTodo,
  deleteLabel,
  deleteTask,
  deleteTodo,
  deleteWorkspace,
  updateLabel,
  updateTask,
  updateTaskStatus,
  updateTodo,
  updateTodoDone,
  updateWorkspace,
} from "../actions/planning-actions";
import type { Label, PlanningSnapshot, Task, TaskStatus, TodoItem } from "../types/planning";

const columnLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  ready: "Ready",
  active: "Active",
  review: "Review",
  done: "Done",
};

const defaultColumnOrder: TaskStatus[] = ["backlog", "ready", "active", "review", "done"];

function calculateEstimateHours(startDate: string, dueDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const due = new Date(`${dueDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(due.getTime()) || due < start) {
    return 1;
  }

  const days = Math.floor((due.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.min(Math.max(days * 8, 1), 200);
}

type PlannerWorkspaceProps = {
  initialSnapshot: PlanningSnapshot;
  initialWorkspaceId?: string;
};

export function PlannerWorkspace({ initialSnapshot, initialWorkspaceId }: PlannerWorkspaceProps) {
  const router = useRouter();
  const [workspaces] = useState(initialSnapshot.workspaces);
  const [boards] = useState(initialSnapshot.boards);
  const [labels] = useState(initialSnapshot.labels);
  const [tasks, setTasks] = useState(initialSnapshot.tasks);
  const standaloneTodos = initialSnapshot.todos;
  const activeWorkspaceId = initialWorkspaceId ?? workspaces[0]?.id ?? "";
  const workspaceBoards = boards.filter((board) => board.workspaceId === activeWorkspaceId);
  const [activeBoardId, setActiveBoardId] = useState(workspaceBoards[0]?.id ?? boards[0]?.id ?? "");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"workspace" | "task" | "todo" | "label" | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [deleteWorkspaceConfirmation, setDeleteWorkspaceConfirmation] = useState("");

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
  const activeBoard =
    workspaceBoards.find((board) => board.id === activeBoardId) ?? workspaceBoards[0];
  const columnOrder = activeBoard?.columnOrder ?? defaultColumnOrder;
  const boardTasks = tasks.filter((task) => task.boardId === activeBoard?.id);
  const labelById = new Map(labels.map((label) => [label.id, label]));
  const tasksWithTodos = boardTasks.filter((task) => task.checklist.length > 0);

  const metrics = {
    done: boardTasks.filter((task) => task.status === "done").length,
    blocked: boardTasks.filter((task) => task.dependencies.length > 0).length,
    hours: boardTasks.reduce((total, task) => total + task.estimateHours, 0),
  };

  async function createTaskAndRefresh(formData: FormData) {
    await createTask(formData);
    setActiveModal(null);
    router.refresh();
  }

  async function createTodoAndRefresh(formData: FormData) {
    await createTodo(formData);
    setActiveModal(null);
    router.refresh();
  }

  async function createLabelAndRefresh(formData: FormData) {
    await createLabel(formData);
    setActiveModal(null);
    router.refresh();
  }

  async function updateWorkspaceAndRefresh(formData: FormData) {
    await updateWorkspace(formData);
    setActiveModal(null);
    router.refresh();
  }

  async function updateTaskAndRefresh(formData: FormData) {
    await updateTask(formData);
    setEditingTask(null);
    router.refresh();
  }

  async function deleteTaskAndRefresh(formData: FormData) {
    await deleteTask(formData);
    router.refresh();
  }

  async function updateTodoAndRefresh(formData: FormData) {
    await updateTodo(formData);
    setEditingTodo(null);
    router.refresh();
  }

  async function updateLabelAndRefresh(formData: FormData) {
    await updateLabel(formData);
    setEditingLabel(null);
    router.refresh();
  }

  async function deleteTodoAndRefresh(formData: FormData) {
    await deleteTodo(formData);
    router.refresh();
  }

  async function deleteLabelAndRefresh(formData: FormData) {
    await deleteLabel(formData);
    router.refresh();
  }

  async function moveTask(taskId: string, status: TaskStatus) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );
    setDraggedTaskId(null);

    try {
      await updateTaskStatus({
        workspaceId: activeWorkspaceId,
        taskId,
        status,
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to save task status", error);
      router.refresh();
    }
  }

  async function toggleTodo(taskId: string, todoId: string, done: boolean) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        return {
          ...task,
          checklist: task.checklist.map((todo) =>
            todo.id === todoId ? { ...todo, done } : todo,
          ),
        };
      }),
    );
    await updateTodoDone({
      workspaceId: activeWorkspaceId,
      todoId,
      done,
    });
    router.refresh();
  }

  async function toggleStandaloneTodo(todoId: string, done: boolean) {
    await updateTodoDone({
      workspaceId: activeWorkspaceId,
      todoId,
      done,
    });
    router.refresh();
  }

  return (
    <main className="bg-[#f7f6f2] text-[#1f2623]">
      <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[#dedbd2] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-md border border-[#d6d2c8] bg-white px-3 text-sm font-medium text-[#3d4742] transition hover:border-[#949b93]"
            >
              Back to workspaces
            </Link>
            <div>
              <h1 className="text-3xl font-semibold tracking-normal text-[#17201c] sm:text-4xl">
                {activeWorkspace?.name ?? "Planning workspace"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66736d]">
                {activeWorkspace?.description || "No description provided."}
              </p>
            </div>
          </div>
          <ActionDropdown align="right">
            <button
              type="button"
              onClick={() => setActiveModal("workspace")}
              className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea]"
            >
              Edit workspace
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDeletingWorkspace(true);
                setDeleteWorkspaceConfirmation("");
              }}
              className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#9f1d1d] hover:bg-[#fde8e8]"
            >
              Delete workspace
            </button>
          </ActionDropdown>
        </header>

        {workspaceBoards.length > 1 ? (
          <section className="flex flex-wrap gap-2">
            {workspaceBoards.map((board) => (
              <button
                key={board.id}
                type="button"
                onClick={() => setActiveBoardId(board.id)}
                className={`min-h-10 rounded-md border px-3 text-sm font-medium transition ${
                  board.id === activeBoard?.id
                    ? "border-[#35624a] bg-[#e8f0ea] text-[#234433]"
                    : "border-[#d6d2c8] bg-white text-[#3d4742] hover:border-[#949b93]"
                }`}
              >
                {board.name}
              </button>
            ))}
          </section>
        ) : null}

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!activeBoard}
              onClick={() => setActiveModal("task")}
              className="h-10 rounded-md bg-[#1f2623] px-4 text-sm font-semibold text-white disabled:bg-[#9aa39d]"
            >
              New task
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("todo")}
              className="h-10 rounded-md border border-[#d6d2c8] bg-white px-4 text-sm font-semibold text-[#24302a]"
            >
              New todo
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("label")}
              className="h-10 rounded-md border border-[#d6d2c8] bg-white px-4 text-sm font-semibold text-[#24302a]"
            >
              New label
            </button>
          </div>
          <Link
            href={`/workspaces/${activeWorkspaceId}/documents`}
            className="text-sm font-semibold text-[#285b40] underline underline-offset-4"
          >
            Document preview
          </Link>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Scheduled hours" value={`${metrics.hours}h`} />
          <Metric label="Tasks complete" value={`${metrics.done}/${boardTasks.length}`} />
          <Metric label="Dependencies" value={String(metrics.blocked)} />
        </section>

        <Panel title="Labels">
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <span
                key={label.id}
                className="inline-flex items-center gap-2 rounded-md border border-[#dedbd2] bg-white px-2 py-1 text-sm"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="font-medium text-[#202924]">{label.name}</span>
                <ActionDropdown>
                  <button
                    type="button"
                    onClick={() => setEditingLabel(label)}
                    className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea]"
                  >
                    Edit
                  </button>
                  <form action={deleteLabelAndRefresh}>
                    <input type="hidden" name="workspaceId" value={activeWorkspaceId} />
                    <input type="hidden" name="labelId" value={label.id} />
                    <button
                      type="submit"
                      onClick={(event) => {
                        if (!window.confirm(`Delete label "${label.name}"?`)) {
                          event.preventDefault();
                        }
                      }}
                      className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#9f1d1d] hover:bg-[#fde8e8]"
                    >
                      Delete
                    </button>
                  </form>
                </ActionDropdown>
              </span>
            ))}
            {labels.length === 0 ? (
              <p className="text-sm text-[#66736d]">
                No labels yet. Create labels to categorize tasks.
              </p>
            ) : null}
          </div>
        </Panel>

        {workspaces.length === 0 ? (
          <section className="rounded-lg border border-dashed border-[#c8c2b6] bg-white px-5 py-8">
            <h2 className="text-lg font-semibold text-[#202924]">No planning data yet</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66736d]">
              Create a workspace to begin planning.
            </p>
          </section>
        ) : null}

        <section className="space-y-5">
          <div className="w-full overflow-x-auto pb-2">
            <div className="grid min-w-[1120px] grid-cols-5 gap-3">
              {columnOrder.map((status) => {
                const columnTasks = boardTasks.filter((task) => task.status === status);

                return (
                  <section
                    key={status}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => draggedTaskId && moveTask(draggedTaskId, status)}
                    className="min-h-[620px] rounded-lg border border-[#dedbd2] bg-[#fbfaf7] p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-[#2d3632]">
                        {columnLabels[status]}
                      </h2>
                      <span className="rounded-md bg-[#ebe7dc] px-2 py-1 text-xs font-semibold text-[#58635d]">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          tasks={boardTasks}
                          labelById={labelById}
                          onDragStart={() => setDraggedTaskId(task.id)}
                          onToggleTodo={toggleTodo}
                          onEdit={() => setEditingTask(task)}
                          deleteAction={deleteTaskAndRefresh}
                          workspaceId={activeWorkspaceId}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>

          <Panel title="Schedule">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {boardTasks
                .slice()
                .sort((a, b) => a.startDate.localeCompare(b.startDate))
                .map((task) => (
                  <div
                    key={task.id}
                    className="rounded-md border border-[#dedbd2] bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#202924]">{task.title}</p>
                        <p className="mt-1 text-xs text-[#68736d]">
                          {formatShortDate(task.startDate)} to {formatShortDate(task.dueDate)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-[#e8f0ea] px-2 py-1 text-xs font-semibold text-[#2e6241]">
                        {task.estimateHours}h
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </Panel>

          <Panel title="Todo List">
            <div className="space-y-3">
              {standaloneTodos.length > 0 ? (
                <TodoGroup
                  title="Workspace todos"
                  completeCount={standaloneTodos.filter((todo) => todo.done).length}
                  totalCount={standaloneTodos.length}
                >
                  {standaloneTodos.map((todo) => (
                    <TodoRow
                      key={todo.id}
                      todo={todo}
                      subtitle="No linked task"
                      onToggle={(done) => toggleStandaloneTodo(todo.id, done)}
                      onEdit={() => setEditingTodo(todo)}
                      deleteAction={deleteTodoAndRefresh}
                    />
                  ))}
                </TodoGroup>
              ) : null}

              {tasksWithTodos.map((task) => (
                <TodoGroup
                  key={task.id}
                  title={task.title}
                  completeCount={task.checklist.filter((todo) => todo.done).length}
                  totalCount={task.checklist.length}
                >
                  {task.checklist.map((todo) => (
                    <TodoRow
                      key={todo.id}
                      todo={todo}
                      subtitle={task.status}
                      onToggle={(done) => toggleTodo(task.id, todo.id, done)}
                      onEdit={() => setEditingTodo(todo)}
                      deleteAction={deleteTodoAndRefresh}
                    />
                  ))}
                </TodoGroup>
              ))}

              {standaloneTodos.length === 0 && tasksWithTodos.length === 0 ? (
                <p className="rounded-md border border-dashed border-[#c8c2b6] bg-white p-4 text-sm text-[#66736d]">
                  No todos yet.
                </p>
              ) : null}
            </div>
          </Panel>
        </section>
      </section>

      {activeModal === "task" ? (
        <Modal title="Create task and schedule" onClose={() => setActiveModal(null)}>
          <TaskForm
            action={createTaskAndRefresh}
            activeBoardId={activeBoard?.id ?? ""}
            activeWorkspaceId={activeWorkspace?.id ?? ""}
            labels={labels}
            tasks={boardTasks}
            disabled={!activeBoard}
          />
        </Modal>
      ) : null}

      {activeModal === "workspace" && activeWorkspace ? (
        <Modal title="Edit workspace" onClose={() => setActiveModal(null)}>
          <WorkspaceForm
            action={updateWorkspaceAndRefresh}
            workspaceId={activeWorkspace.id}
            name={activeWorkspace.name}
            description={activeWorkspace.description}
          />
        </Modal>
      ) : null}

      {activeModal === "todo" ? (
        <Modal title="Create todo" onClose={() => setActiveModal(null)}>
          <TodoForm
            action={createTodoAndRefresh}
            activeWorkspaceId={activeWorkspace?.id ?? ""}
            tasks={boardTasks}
            disabled={!activeWorkspace}
          />
        </Modal>
      ) : null}

      {activeModal === "label" ? (
        <Modal title="Create label" onClose={() => setActiveModal(null)}>
          <LabelForm
            action={createLabelAndRefresh}
            activeWorkspaceId={activeWorkspaceId}
          />
        </Modal>
      ) : null}

      {editingTask ? (
        <Modal title="Edit task" onClose={() => setEditingTask(null)}>
          <TaskForm
            action={updateTaskAndRefresh}
            task={editingTask}
            activeBoardId={editingTask.boardId}
            activeWorkspaceId={activeWorkspace?.id ?? ""}
            labels={labels}
            tasks={boardTasks.filter((task) => task.id !== editingTask.id)}
            disabled={!activeWorkspace}
            submitLabel="Save task"
          />
        </Modal>
      ) : null}

      {editingTodo ? (
        <Modal title="Edit todo" onClose={() => setEditingTodo(null)}>
          <TodoForm
            action={updateTodoAndRefresh}
            todo={editingTodo}
            activeWorkspaceId={activeWorkspace?.id ?? ""}
            tasks={boardTasks}
            disabled={!activeWorkspace}
            submitLabel="Save todo"
          />
        </Modal>
      ) : null}

      {editingLabel ? (
        <Modal title="Edit label" onClose={() => setEditingLabel(null)}>
          <LabelForm
            action={updateLabelAndRefresh}
            activeWorkspaceId={activeWorkspaceId}
            label={editingLabel}
            submitLabel="Save label"
          />
        </Modal>
      ) : null}

      {isDeletingWorkspace && activeWorkspace ? (
        <Modal title="Delete workspace" onClose={() => setIsDeletingWorkspace(false)}>
          <DeleteWorkspaceForm
            workspaceId={activeWorkspace.id}
            workspaceName={activeWorkspace.name}
            confirmation={deleteWorkspaceConfirmation}
            onConfirmationChange={setDeleteWorkspaceConfirmation}
          />
        </Modal>
      ) : null}
    </main>
  );
}

function DeleteWorkspaceForm({
  workspaceId,
  workspaceName,
  confirmation,
  onConfirmationChange,
}: {
  workspaceId: string;
  workspaceName: string;
  confirmation: string;
  onConfirmationChange: (value: string) => void;
}) {
  return (
    <form action={deleteWorkspace} className="grid gap-3">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <p className="text-sm leading-6 text-[#66736d]">
        Type <span className="font-semibold text-[#202924]">{workspaceName}</span> to confirm
        deletion.
      </p>
      <label className="grid gap-1 text-sm font-medium text-[#3d4742]">
        Workspace name confirmation
        <input
          value={confirmation}
          onChange={(event) => onConfirmationChange(event.currentTarget.value)}
          className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm font-normal outline-none focus:border-[#1f2623]"
        />
      </label>
      <button
        type="submit"
        disabled={confirmation !== workspaceName}
        className="h-10 rounded-md bg-[#9f1d1d] px-3 text-sm font-semibold text-white disabled:bg-[#d6a6a6]"
      >
        Delete workspace
      </button>
    </form>
  );
}

function WorkspaceForm({
  action,
  workspaceId,
  name,
  description,
}: {
  action: (formData: FormData) => void | Promise<void>;
  workspaceId: string;
  name: string;
  description: string;
}) {
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <label className="grid gap-1 text-sm font-medium text-[#3d4742]">
        Workspace name
        <input
          name="name"
          required
          minLength={2}
          defaultValue={name}
          className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm font-normal outline-none focus:border-[#1f2623]"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[#3d4742]">
        Description
        <textarea
          name="description"
          defaultValue={description}
          rows={4}
          className="min-h-24 rounded-md border border-[#d6d2c8] px-3 py-2 text-sm font-normal outline-none focus:border-[#1f2623]"
        />
      </label>
      <button
        type="submit"
        className="h-10 rounded-md bg-[#1f2623] px-3 text-sm font-semibold text-white"
      >
        Save workspace
      </button>
    </form>
  );
}

function TaskForm({
  action,
  task,
  activeBoardId,
  activeWorkspaceId,
  labels,
  tasks,
  disabled,
  submitLabel = "Create task",
}: {
  action: (formData: FormData) => void | Promise<void>;
  task?: Task;
  activeBoardId: string;
  activeWorkspaceId: string;
  labels: PlanningSnapshot["labels"];
  tasks: Task[];
  disabled: boolean;
  submitLabel?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(task?.startDate ?? today);
  const [dueDate, setDueDate] = useState(task?.dueDate ?? today);
  const [estimateHours, setEstimateHours] = useState(
    String(task?.estimateHours ?? calculateEstimateHours(task?.startDate ?? today, task?.dueDate ?? today)),
  );
  const [estimateEdited, setEstimateEdited] = useState(false);

  function changeStartDate(value: string) {
    setStartDate(value);
    const nextDueDate = value > dueDate ? value : dueDate;
    setDueDate(nextDueDate);
    if (!estimateEdited) {
      setEstimateHours(String(calculateEstimateHours(value, nextDueDate)));
    }
  }

  function changeDueDate(value: string) {
    const nextStartDate = value < startDate ? value : startDate;
    setStartDate(nextStartDate);
    setDueDate(value);
    if (!estimateEdited) {
      setEstimateHours(String(calculateEstimateHours(nextStartDate, value)));
    }
  }

  return (
    <form action={action}>
      {task ? <input type="hidden" name="taskId" value={task.id} /> : null}
      <input type="hidden" name="workspaceId" value={activeWorkspaceId} />
      <input type="hidden" name="boardId" value={activeBoardId} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Task title">
          <input name="title" required minLength={2} defaultValue={task?.title} placeholder="Task title" disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Assignee">
          <input name="assignee" defaultValue={task?.assignee ?? "You"} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea name="description" defaultValue={task?.description} placeholder="Description" disabled={disabled} rows={4} className="min-h-24 rounded-md border border-[#d6d2c8] px-3 py-2 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={task?.status ?? "backlog"} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]">
            {defaultColumnOrder.map((status) => (
              <option key={status} value={status}>{columnLabels[status]}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select name="priority" defaultValue={task?.priority ?? "Medium"} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]">
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
        </Field>
        <Field label="Start date">
          <input name="startDate" type="date" required value={startDate} max={dueDate} onChange={(event) => changeStartDate(event.currentTarget.value)} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Due date">
          <input name="dueDate" type="date" required value={dueDate} min={startDate} onChange={(event) => changeDueDate(event.currentTarget.value)} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Estimate hours">
          <input name="estimateHours" type="number" min={1} max={200} value={estimateHours} onChange={(event) => {
            setEstimateEdited(true);
            setEstimateHours(event.currentTarget.value);
          }} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Tags">
          <input name="tags" defaultValue={task?.tags.join(", ")} placeholder="tags, comma separated" disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Labels">
          <select name="labels" multiple defaultValue={task?.labels} disabled={disabled || labels.length === 0} className="min-h-20 rounded-md border border-[#d6d2c8] px-3 py-2 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]">
            {labels.map((label) => <option key={label.id} value={label.id}>{label.name}</option>)}
          </select>
        </Field>
        <Field label="Dependencies">
          <select name="dependencies" multiple defaultValue={task?.dependencies} disabled={disabled || tasks.length === 0} className="min-h-20 rounded-md border border-[#d6d2c8] px-3 py-2 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]">
            {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
          </select>
        </Field>
        <button
          type="submit"
          disabled={disabled}
          className="h-10 rounded-md bg-[#1f2623] px-3 text-sm font-semibold text-white disabled:bg-[#9aa39d] sm:col-span-2"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function TodoForm({
  action,
  todo,
  activeWorkspaceId,
  tasks,
  disabled,
  submitLabel = "Create todo",
}: {
  action: (formData: FormData) => void | Promise<void>;
  todo?: TodoItem;
  activeWorkspaceId: string;
  tasks: Task[];
  disabled: boolean;
  submitLabel?: string;
}) {
  return (
    <form action={action}>
      {todo ? <input type="hidden" name="todoId" value={todo.id} /> : null}
      <input type="hidden" name="workspaceId" value={activeWorkspaceId} />
      <div className="grid gap-2">
        <Field label="Linked task">
          <select name="taskId" defaultValue={todo?.taskId ?? ""} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]">
            <option value="">No task</option>
            {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
          </select>
        </Field>
        <Field label="Todo title">
          <input name="title" required minLength={2} defaultValue={todo?.title} placeholder="Todo title" disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]" />
        </Field>
        {todo ? (
          <label className="flex items-center gap-2 text-sm text-[#3d4742]">
            <input
              name="done"
              type="checkbox"
              defaultChecked={todo.done}
              className="h-4 w-4 accent-[#1f7a4d]"
            />
            Done
          </label>
        ) : null}
        <button
          type="submit"
          disabled={disabled}
          className="h-10 rounded-md bg-[#1f2623] px-3 text-sm font-semibold text-white disabled:bg-[#9aa39d]"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function LabelForm({
  action,
  activeWorkspaceId,
  label,
  submitLabel = "Create label",
}: {
  action: (formData: FormData) => void | Promise<void>;
  activeWorkspaceId: string;
  label?: Label;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="grid gap-3">
      {label ? <input type="hidden" name="labelId" value={label.id} /> : null}
      <input type="hidden" name="workspaceId" value={activeWorkspaceId} />
      <Field label="Label name">
        <input
          name="name"
          required
          minLength={2}
          maxLength={40}
          defaultValue={label?.name}
          placeholder="Frontend"
          className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623]"
        />
      </Field>
      <Field label="Color">
        <input
          name="color"
          type="color"
          defaultValue={label?.color ?? "#35624a"}
          className="h-10 w-full rounded-md border border-[#d6d2c8] px-2 py-1 outline-none focus:border-[#1f2623]"
        />
      </Field>
      <button
        type="submit"
        className="h-10 rounded-md bg-[#1f2623] px-3 text-sm font-semibold text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#dedbd2] bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#202924]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md border border-[#d6d2c8] px-3 text-sm font-medium text-[#3d4742]"
          >
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-1 text-sm font-medium text-[#3d4742] ${className}`}>
      {label}
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#dedbd2] bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68736d]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#202924]">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#dedbd2] bg-[#fbfaf7] p-3">
      <h2 className="mb-3 text-sm font-semibold text-[#2d3632]">{title}</h2>
      {children}
    </section>
  );
}

function TodoGroup({
  title,
  completeCount,
  totalCount,
  children,
}: {
  title: string;
  completeCount: number;
  totalCount: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-[#dedbd2] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#ece8dd] px-3 py-2">
        <h3 className="text-sm font-semibold text-[#202924]">{title}</h3>
        <span className="shrink-0 rounded-md bg-[#e8f0ea] px-2 py-1 text-xs font-semibold text-[#2e6241]">
          {completeCount}/{totalCount} done
        </span>
      </div>
      <div className="divide-y divide-[#ece8dd]">{children}</div>
    </section>
  );
}

function TodoRow({
  todo,
  subtitle,
  onToggle,
  onEdit,
  deleteAction,
}: {
  todo: TodoItem;
  subtitle: string;
  onToggle: (done: boolean) => void;
  onEdit: () => void;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <div className="flex items-start gap-3 px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={todo.done}
        onChange={(event) => onToggle(event.currentTarget.checked)}
        className="mt-1 h-4 w-4 accent-[#1f7a4d]"
      />
      <div className="min-w-0 flex-1">
        <p
          className={`font-medium ${
            todo.done ? "text-[#7a837d] line-through" : "text-[#202924]"
          }`}
        >
          {todo.title}
        </p>
        <p className="mt-1 text-xs text-[#68736d]">{subtitle}</p>
      </div>
      <TodoActions todo={todo} onEdit={onEdit} deleteAction={deleteAction} />
    </div>
  );
}

function TodoActions({
  todo,
  onEdit,
  deleteAction,
}: {
  todo: TodoItem;
  onEdit: () => void;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <span className="ml-auto shrink-0">
      <ActionDropdown>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          onEdit();
        }}
        className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea]"
      >
        Edit
      </button>
      <form action={deleteAction}>
        <input type="hidden" name="workspaceId" value={todo.workspaceId} />
        <input type="hidden" name="todoId" value={todo.id} />
        <button
          type="submit"
          onClick={(event) => event.stopPropagation()}
          className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#9f1d1d] hover:bg-[#fde8e8]"
        >
          Delete
        </button>
      </form>
      </ActionDropdown>
    </span>
  );
}

function TaskCard({
  task,
  tasks,
  labelById,
  onDragStart,
  onToggleTodo,
  onEdit,
  deleteAction,
  workspaceId,
}: {
  task: Task;
  tasks: Task[];
  labelById: Map<string, { id: string; name: string; color: string }>;
  onDragStart: () => void;
  onToggleTodo: (taskId: string, todoId: string, done: boolean) => void;
  onEdit: () => void;
  deleteAction: (formData: FormData) => void | Promise<void>;
  workspaceId: string;
}) {
  const dependencies = task.dependencies
    .map((dependencyId) => tasks.find((candidate) => candidate.id === dependencyId)?.title)
    .filter(Boolean);
  const completedTodos = task.checklist.filter((todo) => todo.done).length;

  return (
    <article
      draggable
      onDragStart={onDragStart}
      className="cursor-grab rounded-lg border border-[#d9d5ca] bg-white p-3 shadow-sm transition hover:border-[#a6ada6] active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold leading-5 text-[#202924]">{task.title}</h3>
          <p className="mt-2 text-xs leading-5 text-[#64706a]">{task.description}</p>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${task.priority === "High"
              ? "bg-[#fde8e8] text-[#9f1d1d]"
              : task.priority === "Medium"
                ? "bg-[#fff0cf] text-[#7a4f00]"
                : "bg-[#e8f0ea] text-[#2e6241]"
            }`}
        >
          {task.priority}
        </span>
      </div>

      <div className="mt-3">
        <ActionDropdown>
        <button
          type="button"
          onClick={onEdit}
          className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea]"
        >
          Edit
        </button>
        <form action={deleteAction}>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="taskId" value={task.id} />
          <button
            type="submit"
            onClick={(event) => {
              if (!window.confirm(`Delete task "${task.title}"?`)) {
                event.preventDefault();
              }
            }}
            className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#9f1d1d] hover:bg-[#fde8e8]"
          >
            Delete
          </button>
        </form>
        </ActionDropdown>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {task.labels.map((labelId) => {
          const label = labelById.get(labelId);

          return label ? (
            <span
              key={label.id}
              className="rounded-md px-2 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ) : null;
        })}
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-[#dedbd2] bg-[#f4f1ea] px-2 py-1 text-xs font-medium text-[#58635d]"
          >
            #{tag}
          </span>
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#64706a]">
        <div>
          <dt className="font-semibold text-[#3b463f]">Window</dt>
          <dd>
            {formatShortDate(task.startDate)} to {formatShortDate(task.dueDate)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-[#3b463f]">Todos</dt>
          <dd>
            {completedTodos}/{task.checklist.length} done
          </dd>
        </div>
      </dl>

      {dependencies.length > 0 ? (
        <div className="mt-3 rounded-md bg-[#f4f1ea] p-2 text-xs leading-5 text-[#58635d]">
          <span className="font-semibold text-[#3b463f]">Blocked by: </span>
          {dependencies.join(", ")}
        </div>
      ) : null}

      <div className="mt-3 space-y-2 border-t border-[#ece8dd] pt-3">
        {task.checklist.map((todo) => (
          <label key={todo.id} className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={todo.done}
              onChange={(event) => onToggleTodo(task.id, todo.id, event.currentTarget.checked)}
              className="h-3.5 w-3.5 accent-[#1f7a4d]"
            />
            <span className={todo.done ? "text-[#7a837d] line-through" : "text-[#47534d]"}>
              {todo.title}
            </span>
          </label>
        ))}
      </div>
    </article>
  );
}

function ActionDropdown({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <details className="relative inline-block">
      <summary className="flex h-8 cursor-pointer list-none items-center rounded-md border border-[#d6d2c8] bg-white px-3 text-xs font-semibold text-[#24302a]">
        Actions
      </summary>
      <div
        className={`absolute z-20 mt-2 min-w-32 rounded-md border border-[#dedbd2] bg-white p-1 shadow-lg ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        {children}
      </div>
    </details>
  );
}
