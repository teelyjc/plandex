import type { TodoItem } from "../types/planning";
import { TodoActions } from "./todo-actions";

type TodoRowProps = {
  todo: TodoItem;
  subtitle: string;
  onToggle: (done: boolean) => void;
  onEdit: () => void;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export function TodoRow({ todo, subtitle, onToggle, onEdit, deleteAction }: TodoRowProps) {
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
