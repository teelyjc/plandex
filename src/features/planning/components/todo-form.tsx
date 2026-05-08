import type { Task, TodoItem } from "../types/planning";
import { Field } from "./field";

type TodoFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  todo?: TodoItem;
  activeWorkspaceId: string;
  defaultTaskId?: string;
  tasks: Task[];
  disabled: boolean;
  submitLabel?: string;
};

export function TodoForm({
  action,
  todo,
  activeWorkspaceId,
  defaultTaskId = "",
  tasks,
  disabled,
  submitLabel = "Create todo",
}: TodoFormProps) {
  return (
    <form action={action}>
      {todo ? <input type="hidden" name="todoId" value={todo.id} /> : null}
      <input type="hidden" name="workspaceId" value={activeWorkspaceId} />
      <div className="grid gap-2">
        <Field label="Linked task">
          <select name="taskId" defaultValue={todo?.taskId ?? defaultTaskId} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]">
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
