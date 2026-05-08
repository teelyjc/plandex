import type { Task, TaskStatus } from "../types/planning";
import {
  columnLabels,
  dayLabels,
  defaultColumnOrder,
  statusStyles,
} from "./planning-constants";
import {
  getTaskWeekRange,
  shiftMonth,
  taskCoversDate,
  taskIntersectsWeek,
  formatMonthLabel,
  type MonthDay,
} from "./planning-date-utils";
import { ReadOnlyCalendarTask } from "./read-only-calendar-task";
import { ReadOnlyTaskListItem } from "./read-only-task-list-item";

type ReadonlyTimeTableProps = {
  timetableMonth: string;
  monthWeeks: MonthDay[][];
  timetableTasks: Task[];
  selectedTimetableStatuses: TaskStatus[];
  onMonthChange: (month: string) => void;
  onStatusToggle: (status: TaskStatus) => void;
  onTaskSelect: (task: Task) => void;
};

export function ReadonlyTimeTable({
  timetableMonth,
  monthWeeks,
  timetableTasks,
  selectedTimetableStatuses,
  onMonthChange,
  onStatusToggle,
  onTaskSelect,
}: ReadonlyTimeTableProps) {
  return (
    <div className="timetable-shell overflow-hidden rounded-lg">
      <div className="timetable-toolbar flex flex-col gap-3 px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(timetableMonth, -1))}
            className="timetable-nav-button h-9 w-9 rounded-md text-lg font-semibold"
            aria-label="Previous month"
          >
            {"<"}
          </button>
          <p className="timetable-month-label min-w-40 text-center text-base font-semibold">
            {formatMonthLabel(timetableMonth)}
          </p>
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(timetableMonth, 1))}
            className="timetable-nav-button h-9 w-9 rounded-md text-lg font-semibold"
            aria-label="Next month"
          >
            {">"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {defaultColumnOrder.map((status) => {
            const selected = selectedTimetableStatuses.includes(status);

            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusToggle(status)}
                className={`h-9 rounded-md border px-3 text-xs font-semibold transition ${
                  selected
                    ? `${statusStyles[status]}`
                    : "timetable-filter-button"
                }`}
                aria-pressed={selected}
              >
                {columnLabels[status]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="timetable-calendar-surface overflow-x-auto">
          <div className="timetable-weekday-header grid min-w-[900px] grid-cols-7">
            {dayLabels.map((day) => (
              <div key={day} className="px-3 py-3 text-center text-sm font-semibold">
                {day}
              </div>
            ))}
          </div>
          <div className="min-w-[900px]">
            {monthWeeks.map((weekDays) => {
              const weekTasks = timetableTasks.filter((task) =>
                taskIntersectsWeek(task, weekDays),
              );

              return (
                <section key={weekDays[0]?.dateKey} className="timetable-week-row">
                  <div className="grid grid-cols-7">
                    {weekDays.map((day) => {
                      const dayTasks = timetableTasks.filter((task) =>
                        taskCoversDate(task, day.dateKey),
                      );

                      return (
                        <div
                          key={day.dateKey}
                          className={`timetable-date-cell min-h-20 p-2 ${
                            day.isCurrentMonth ? "timetable-date-current" : "timetable-date-adjacent"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-lg font-medium ${
                                day.isCurrentMonth ? "timetable-date-number" : "timetable-date-number-muted"
                              }`}
                            >
                              {day.dayOfMonth}
                            </span>
                            {dayTasks.length > 0 ? (
                              <span className="timetable-count-pill rounded-md px-2 py-1 text-[11px] font-semibold">
                                {dayTasks.length}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="timetable-task-lane grid min-h-16 grid-cols-7 gap-y-1.5 px-2 pb-3">
                    {weekTasks.map((task) => {
                      const taskRange = getTaskWeekRange(task, weekDays);

                      return (
                        <ReadOnlyCalendarTask
                          key={`${weekDays[0]?.dateKey}-${task.id}`}
                          task={task}
                          columnStart={taskRange.columnStart}
                          span={taskRange.span}
                          continuesFromPreviousWeek={taskRange.continuesFromPreviousWeek}
                          continuesToNextWeek={taskRange.continuesToNextWeek}
                          onSelect={() => onTaskSelect(task)}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <aside className="timetable-sidebar max-h-[760px] overflow-y-auto p-4">
          <h3 className="text-lg font-semibold">Tasks list</h3>
          <div className="mt-4 space-y-4">
            {timetableTasks.map((task) => (
              <ReadOnlyTaskListItem
                key={task.id}
                task={task}
                onSelect={() => onTaskSelect(task)}
              />
            ))}
            {timetableTasks.length === 0 ? (
              <p className="timetable-empty-state rounded-md border border-dashed px-3 py-4 text-sm leading-6">
                No tasks match the selected statuses.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
