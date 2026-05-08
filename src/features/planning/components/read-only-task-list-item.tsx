import { formatShortDate } from "@/lib/utils/format";
import type { Task } from "../types/planning";
import { columnLabels, statusStyles } from "./planning-constants";

type ReadOnlyTaskListItemProps = {
  task: Task;
  onSelect: () => void;
};

export function ReadOnlyTaskListItem({ task, onSelect }: ReadOnlyTaskListItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border-l-8 px-3 py-3 text-left transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#1f2623]/30 ${statusStyles[task.status]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold">{task.title}</h4>
          <p className="mt-2 text-xs font-medium opacity-80">
            {formatShortDate(task.startDate)} to {formatShortDate(task.dueDate)}
          </p>
        </div>
        <span className="timetable-status-badge shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold">
          {columnLabels[task.status]}
        </span>
      </div>
    </button>
  );
}
