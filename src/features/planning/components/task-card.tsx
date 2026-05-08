import { formatShortDate } from "@/lib/utils/format";
import type { Task } from "../types/planning";
import { ActionDropdown } from "./action-dropdown";

type TaskCardProps = {
  task: Task;
  tasks: Task[];
  labelById: Map<string, { id: string; name: string; color: string }>;
  onDragStart: () => void;
  onToggleTodo: (taskId: string, todoId: string, done: boolean) => void;
  onView: () => void;
  onEdit: () => void;
  onAddTodo: () => void;
  onAddNote: () => void;
  deleteAction: (formData: FormData) => void | Promise<void>;
  workspaceId: string;
};

export function TaskCard({
  task,
  tasks,
  labelById,
  onDragStart,
  onToggleTodo,
  onView,
  onEdit,
  onAddTodo,
  onAddNote,
  deleteAction,
  workspaceId,
}: TaskCardProps) {
  const dependencies = task.dependencies
    .map((dependencyId) => tasks.find((candidate) => candidate.id === dependencyId)?.title)
    .filter(Boolean);
  const completedTodos = task.checklist.filter((todo) => todo.done).length;
  const ownerName = task.owner?.name ?? "No owner";
  const assigneeName = task.assigneeUser?.name ?? task.assignee;

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
            onClick={onView}
            className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea]"
          >
            View
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onAddTodo}
            className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea]"
          >
            Add todo
          </button>
          <button
            type="button"
            onClick={onAddNote}
            className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea]"
          >
            Add note
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
          <dt className="font-semibold text-[#3b463f]">Owner</dt>
          <dd>{ownerName}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#3b463f]">Assigned</dt>
          <dd>{assigneeName}</dd>
        </div>
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
