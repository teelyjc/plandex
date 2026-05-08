import type { TaskStatus } from "../types/planning";

export const columnLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  ready: "Ready",
  active: "Active",
  review: "Review",
  done: "Done",
};

export const defaultColumnOrder: TaskStatus[] = ["backlog", "ready", "active", "review", "done"];

export const statusRank: Record<TaskStatus, number> = {
  backlog: 0,
  ready: 1,
  active: 2,
  review: 3,
  done: 4,
};

export const defaultTimetableStatuses: TaskStatus[] = ["ready", "active"];

export const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const statusStyles: Record<TaskStatus, string> = {
  backlog: "timetable-status-backlog",
  ready: "timetable-status-ready",
  active: "timetable-status-active",
  review: "timetable-status-review",
  done: "timetable-status-done",
};
