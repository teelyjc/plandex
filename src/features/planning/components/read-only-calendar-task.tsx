import type { Task } from "../types/planning";
import { statusStyles } from "./planning-constants";

type ReadOnlyCalendarTaskProps = {
  task: Task;
  columnStart: number;
  span: number;
  continuesFromPreviousWeek: boolean;
  continuesToNextWeek: boolean;
  onSelect: () => void;
};

export function ReadOnlyCalendarTask({
  task,
  columnStart,
  span,
  continuesFromPreviousWeek,
  continuesToNextWeek,
  onSelect,
}: ReadOnlyCalendarTaskProps) {
  const continuationShape = [
    continuesFromPreviousWeek ? "rounded-l-none border-l-0" : "rounded-l-md border-l-4",
    continuesToNextWeek ? "rounded-r-none" : "rounded-r-md",
  ].join(" ");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`truncate px-2 py-1.5 text-left text-[11px] font-semibold transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#1f2623]/30 ${continuationShape} ${statusStyles[task.status]}`}
      style={{ gridColumn: `${columnStart} / span ${span}` }}
      title={task.title}
    >
      {task.title}
    </button>
  );
}
