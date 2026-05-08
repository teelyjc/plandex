import { formatShortDate } from "@/lib/utils/format";
import type { Label, Task } from "../types/planning";
import { columnLabels, statusStyles } from "./planning-constants";
import { TaskNoteForm } from "./task-note-form";

type TaskDetailsProps = {
  task: Task;
  tasks: Task[];
  labelById: Map<string, Label>;
  workspaceId: string;
  createNoteAction: (formData: FormData) => void | Promise<void>;
};

export function TaskDetails({
  task,
  tasks,
  labelById,
  workspaceId,
  createNoteAction,
}: TaskDetailsProps) {
  const dependencies = task.dependencies
    .map((dependencyId) => tasks.find((candidate) => candidate.id === dependencyId))
    .filter((dependency): dependency is Task => Boolean(dependency));
  const completedTodos = task.checklist.filter((todo) => todo.done).length;
  const ownerName = task.owner?.name ?? "No owner";
  const assigneeName = task.assigneeUser?.name ?? task.assignee;

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[task.status]}`}>
            {columnLabels[task.status]}
          </span>
          <span className="rounded-md border border-[#dedbd2] bg-white px-2 py-1 text-xs font-semibold text-[#3d4742]">
            {task.priority} priority
          </span>
          <span className="rounded-md border border-[#dedbd2] bg-white px-2 py-1 text-xs font-semibold text-[#3d4742]">
            {task.estimateHours}h
          </span>
        </div>
        <h3 className="text-lg font-semibold text-[#202924]">{task.title}</h3>
        <p className="text-sm leading-6 text-[#66736d]">
          {task.description || "No description provided."}
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-[#dedbd2] bg-white p-3">
          <dt className="text-xs font-semibold uppercase text-[#68736d]">Owner</dt>
          <dd className="mt-1 text-sm font-semibold text-[#202924]">{ownerName}</dd>
        </div>
        <div className="rounded-md border border-[#dedbd2] bg-white p-3">
          <dt className="text-xs font-semibold uppercase text-[#68736d]">Assigned to</dt>
          <dd className="mt-1 text-sm font-semibold text-[#202924]">{assigneeName}</dd>
        </div>
        <div className="rounded-md border border-[#dedbd2] bg-white p-3">
          <dt className="text-xs font-semibold uppercase text-[#68736d]">Schedule</dt>
          <dd className="mt-1 text-sm font-semibold text-[#202924]">
            {formatShortDate(task.startDate)} to {formatShortDate(task.dueDate)}
          </dd>
        </div>
      </dl>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-md border border-[#dedbd2] bg-white p-3">
          <h4 className="text-xs font-semibold uppercase text-[#68736d]">Labels and tags</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
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
            {task.labels.length === 0 && task.tags.length === 0 ? (
              <p className="text-sm text-[#66736d]">No labels or tags.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-md border border-[#dedbd2] bg-white p-3">
          <h4 className="text-xs font-semibold uppercase text-[#68736d]">Dependencies</h4>
          <div className="mt-2 space-y-2">
            {dependencies.map((dependency) => (
              <p key={dependency.id} className="rounded-md bg-[#f4f1ea] px-2 py-1 text-sm text-[#3d4742]">
                {dependency.title}
              </p>
            ))}
            {dependencies.length === 0 ? (
              <p className="text-sm text-[#66736d]">No dependencies.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="rounded-md border border-[#dedbd2] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#ece8dd] px-3 py-2">
          <h4 className="text-sm font-semibold text-[#202924]">Checklist</h4>
          <span className="rounded-md bg-[#e8f0ea] px-2 py-1 text-xs font-semibold text-[#2e6241]">
            {completedTodos}/{task.checklist.length} done
          </span>
        </div>
        <div className="divide-y divide-[#ece8dd]">
          {task.checklist.map((todo) => (
            <div key={todo.id} className="flex items-start gap-2 px-3 py-2 text-sm">
              <span className="mt-1 h-3.5 w-3.5 rounded-sm border border-[#d6d2c8] bg-[#f7f6f2] text-center text-[10px] leading-3">
                {todo.done ? "✓" : ""}
              </span>
              <span className={todo.done ? "text-[#7a837d] line-through" : "text-[#202924]"}>
                {todo.title}
              </span>
            </div>
          ))}
          {task.checklist.length === 0 ? (
            <p className="px-3 py-3 text-sm text-[#66736d]">No checklist items.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-md border border-[#dedbd2] bg-white">
        <div className="border-b border-[#ece8dd] px-3 py-2">
          <h4 className="text-sm font-semibold text-[#202924]">Owner notes</h4>
        </div>
        <div className="border-b border-[#ece8dd] px-3 py-3">
          <TaskNoteForm action={createNoteAction} workspaceId={workspaceId} task={task} />
        </div>
        <div className="divide-y divide-[#ece8dd]">
          {task.notes.map((note) => (
            <article key={note.id} className="px-3 py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#66736d]">
                <span className="font-semibold text-[#3d4742]">
                  {note.author?.name ?? ownerName}
                </span>
                <span>{formatShortDate(note.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#202924]">
                {note.content}
              </p>
            </article>
          ))}
          {task.notes.length === 0 ? (
            <p className="px-3 py-3 text-sm text-[#66736d]">
              No owner notes yet.
            </p>
          ) : null}
        </div>
      </section>
    </section>
  );
}
