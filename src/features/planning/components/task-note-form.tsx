import type { Task } from "../types/planning";

type TaskNoteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  workspaceId: string;
  task: Task;
  submitLabel?: string;
};

export function TaskNoteForm({
  action,
  workspaceId,
  task,
  submitLabel = "Add note",
}: TaskNoteFormProps) {
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="taskId" value={task.id} />
      <input type="hidden" name="authorId" value={task.ownerId ?? ""} />
      <textarea
        name="content"
        required
        minLength={2}
        maxLength={1000}
        rows={3}
        placeholder="Add a note from the task owner"
        className="min-h-20 rounded-md border border-[#d6d2c8] px-3 py-2 text-sm outline-none focus:border-[#1f2623]"
      />
      <button
        type="submit"
        className="h-9 rounded-md bg-[#1f2623] px-3 text-sm font-semibold text-white sm:justify-self-start"
      >
        {submitLabel}
      </button>
    </form>
  );
}
