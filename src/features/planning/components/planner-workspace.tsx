"use client";

import { formatShortDate } from "@/lib/utils/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createLabel } from "../actions/create-label";
import { createTask } from "../actions/create-task";
import { createTaskNote } from "../actions/create-task-note";
import { createTodo } from "../actions/create-todo";
import { deleteLabel } from "../actions/delete-label";
import { deleteTask } from "../actions/delete-task";
import { deleteTodo } from "../actions/delete-todo";
import { updateLabel } from "../actions/update-label";
import { updateTask } from "../actions/update-task";
import { updateTaskStatus } from "../actions/update-task-status";
import { updateTodo } from "../actions/update-todo";
import { updateTodoDone } from "../actions/update-todo-done";
import { updateWorkspace } from "../actions/update-workspace";
import type { Label, PlanningSnapshot, Task, TaskStatus, TodoItem } from "../types/planning";
import { ActionDropdown } from "./action-dropdown";
import { DeleteWorkspaceForm } from "./delete-workspace-form";
import { LabelForm } from "./label-form";
import { Metric } from "./metric";
import { Modal } from "./modal";
import { Panel } from "./panel";
import {
  columnLabels,
  defaultColumnOrder,
  defaultTimetableStatuses,
  statusRank,
} from "./planning-constants";
import { buildMonthDays, chunkMonthWeeks, toDateKey } from "./planning-date-utils";
import { ReadonlyTimeTable } from "./readonly-time-table";
import { TaskCard } from "./task-card";
import { TaskDetails } from "./task-details";
import { TaskForm } from "./task-form";
import { TaskNoteForm } from "./task-note-form";
import { TodoForm } from "./todo-form";
import { TodoGroup } from "./todo-group";
import { TodoRow } from "./todo-row";
import { WorkspaceForm } from "./workspace-form";

type PlannerWorkspaceProps = {
  initialSnapshot: PlanningSnapshot;
  initialWorkspaceId?: string;
};

function buildCascadedStatuses(tasks: Task[], taskId: string, status: TaskStatus) {
  const cascadedStatuses = new Map<string, TaskStatus>([[taskId, status]]);
  const queue = [taskId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const dependencyId = queue.shift();

    if (!dependencyId || visited.has(dependencyId)) {
      continue;
    }

    visited.add(dependencyId);

    for (const task of tasks) {
      if (!task.dependencies.includes(dependencyId) || statusRank[task.status] <= statusRank[status]) {
        continue;
      }

      cascadedStatuses.set(task.id, status);
      queue.push(task.id);
    }
  }

  return cascadedStatuses;
}

export function PlannerWorkspace({ initialSnapshot, initialWorkspaceId }: PlannerWorkspaceProps) {
  const router = useRouter();
  const [users] = useState(initialSnapshot.users);
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
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [notingTask, setNotingTask] = useState<Task | null>(null);
  const [defaultTodoTaskId, setDefaultTodoTaskId] = useState("");
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [deleteWorkspaceConfirmation, setDeleteWorkspaceConfirmation] = useState("");
  const [timetableMonth, setTimetableMonth] = useState(toDateKey(new Date()));
  const [selectedTimetableStatuses, setSelectedTimetableStatuses] = useState<TaskStatus[]>(
    defaultTimetableStatuses,
  );

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
  const activeBoard =
    workspaceBoards.find((board) => board.id === activeBoardId) ?? workspaceBoards[0];
  const columnOrder = activeBoard?.columnOrder ?? defaultColumnOrder;
  const boardTasks = tasks.filter((task) => task.boardId === activeBoard?.id);
  const labelById = new Map(labels.map((label) => [label.id, label]));
  const tasksWithTodos = boardTasks.filter((task) => task.checklist.length > 0);
  const timetableTasks = boardTasks
    .filter((task) => selectedTimetableStatuses.includes(task.status))
    .slice()
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const monthWeeks = chunkMonthWeeks(buildMonthDays(timetableMonth));

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

  async function createTaskNoteAndRefresh(formData: FormData) {
    await createTaskNote(formData);
    setViewingTask(null);
    setNotingTask(null);
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
    const task = tasks.find((candidate) => candidate.id === taskId);
    const blockingDependency = task?.dependencies
      .map((dependencyId) => tasks.find((candidate) => candidate.id === dependencyId))
      .find((dependency) => dependency && statusRank[status] > statusRank[dependency.status]);

    if (blockingDependency) {
      window.alert(
        `This task cannot move past "${blockingDependency.title}" because it depends on that task.`,
      );
      setDraggedTaskId(null);
      return;
    }

    const cascadedStatuses = buildCascadedStatuses(tasks, taskId, status);

    setTasks((current) =>
      current.map((task) => {
        const cascadedStatus = cascadedStatuses.get(task.id);
        return cascadedStatus ? { ...task, status: cascadedStatus } : task;
      }),
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

  function toggleTimetableStatus(status: TaskStatus) {
    setSelectedTimetableStatuses((current) => {
      if (current.includes(status)) {
        return current.filter((selectedStatus) => selectedStatus !== status);
      }

      return [...current, status];
    });
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
          <ActionDropdown label="New">
            <button
              type="button"
              disabled={!activeBoard}
              onClick={() => setActiveModal("task")}
              className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea] disabled:text-[#9aa39d]"
            >
              Task
            </button>
            <button
              type="button"
              onClick={() => {
                setDefaultTodoTaskId("");
                setActiveModal("todo");
              }}
              className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea]"
            >
              Todo
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("label")}
              className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea]"
            >
              Label
            </button>
          </ActionDropdown>
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
                          onView={() => setViewingTask(task)}
                          onEdit={() => setEditingTask(task)}
                          onAddTodo={() => {
                            setDefaultTodoTaskId(task.id);
                            setActiveModal("todo");
                          }}
                          onAddNote={() => setNotingTask(task)}
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

          <Panel title="Read-only Time Table">
            <ReadonlyTimeTable
              timetableMonth={timetableMonth}
              monthWeeks={monthWeeks}
              timetableTasks={timetableTasks}
              selectedTimetableStatuses={selectedTimetableStatuses}
              onMonthChange={setTimetableMonth}
              onStatusToggle={toggleTimetableStatus}
              onTaskSelect={setViewingTask}
            />
          </Panel>

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
            users={users}
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
            ownerId={activeWorkspace.ownerId}
            users={users}
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
            defaultTaskId={defaultTodoTaskId}
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
            users={users}
            tasks={boardTasks.filter((task) => task.id !== editingTask.id)}
            disabled={!activeWorkspace}
            submitLabel="Save task"
          />
        </Modal>
      ) : null}

      {viewingTask ? (
        <Modal title="Task information" onClose={() => setViewingTask(null)}>
          <TaskDetails
            task={viewingTask}
            tasks={boardTasks}
            labelById={labelById}
            workspaceId={activeWorkspaceId}
            createNoteAction={createTaskNoteAndRefresh}
          />
        </Modal>
      ) : null}

      {notingTask ? (
        <Modal title="Add task note" onClose={() => setNotingTask(null)}>
          <TaskNoteForm
            action={createTaskNoteAndRefresh}
            workspaceId={activeWorkspaceId}
            task={notingTask}
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
