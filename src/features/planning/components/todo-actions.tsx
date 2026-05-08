import type { TodoItem } from "../types/planning";
import { ActionDropdown } from "./action-dropdown";

type TodoActionsProps = {
  todo: TodoItem;
  onEdit: () => void;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export function TodoActions({ todo, onEdit, deleteAction }: TodoActionsProps) {
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
