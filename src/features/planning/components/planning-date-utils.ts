import type { Task } from "../types/planning";

export type MonthDay = {
  dateKey: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
};

export function calculateEstimateHours(startDate: string, dueDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const due = new Date(`${dueDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(due.getTime()) || due < start) {
    return 1;
  }

  const days = Math.floor((due.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.min(Math.max(days * 8, 1), 200);
}

export function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getMonthDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function buildMonthDays(anchorDate: string) {
  const anchor = getMonthDate(anchorDate);
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = addDays(monthStart, -monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);

    return {
      dateKey: toDateKey(date),
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === anchor.getMonth(),
    };
  });
}

export function chunkMonthWeeks(monthDays: MonthDay[]) {
  return Array.from({ length: 6 }, (_, index) => monthDays.slice(index * 7, index * 7 + 7));
}

export function formatMonthLabel(anchorDate: string) {
  return getMonthDate(anchorDate).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function shiftMonth(anchorDate: string, monthOffset: number) {
  const anchor = getMonthDate(anchorDate);
  const nextDate = new Date(anchor.getFullYear(), anchor.getMonth() + monthOffset, 1);

  return toDateKey(nextDate);
}

export function taskCoversDate(task: Task, dateKey: string) {
  return task.startDate <= dateKey && dateKey <= task.dueDate;
}

export function taskIntersectsWeek(task: Task, weekDays: Array<{ dateKey: string }>) {
  const weekStart = weekDays[0]?.dateKey;
  const weekEnd = weekDays[6]?.dateKey;

  return Boolean(weekStart && weekEnd && task.startDate <= weekEnd && task.dueDate >= weekStart);
}

export function getTaskWeekRange(task: Task, weekDays: Array<{ dateKey: string }>) {
  const startIndex = weekDays.findIndex((day) => taskCoversDate(task, day.dateKey));
  const endIndex = weekDays.findLastIndex((day) => taskCoversDate(task, day.dateKey));
  const weekStart = weekDays[0]?.dateKey ?? task.startDate;
  const weekEnd = weekDays[6]?.dateKey ?? task.dueDate;

  return {
    columnStart: Math.max(startIndex, 0) + 1,
    span: Math.max(endIndex - startIndex + 1, 1),
    continuesFromPreviousWeek: task.startDate < weekStart,
    continuesToNextWeek: task.dueDate > weekEnd,
  };
}
