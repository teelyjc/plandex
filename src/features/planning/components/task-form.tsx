"use client";

import { useState } from "react";
import type { PlanningSnapshot, Task } from "../types/planning";
import { Field } from "./field";
import { calculateEstimateHours } from "./planning-date-utils";
import { columnLabels, defaultColumnOrder } from "./planning-constants";

type TaskFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  task?: Task;
  activeBoardId: string;
  activeWorkspaceId: string;
  labels: PlanningSnapshot["labels"];
  users: PlanningSnapshot["users"];
  tasks: Task[];
  disabled: boolean;
  submitLabel?: string;
};

export function TaskForm({
  action,
  task,
  activeBoardId,
  activeWorkspaceId,
  labels,
  users,
  tasks,
  disabled,
  submitLabel = "Create task",
}: TaskFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [status, setStatus] = useState(task?.status ?? "backlog");
  const [automaticTime, setAutomaticTime] = useState(false);
  const [startDate, setStartDate] = useState(task?.startDate ?? today);
  const [dueDate, setDueDate] = useState(task?.dueDate ?? today);
  const [estimateHours, setEstimateHours] = useState(
    String(task?.estimateHours ?? calculateEstimateHours(task?.startDate ?? today, task?.dueDate ?? today)),
  );
  const [estimateEdited, setEstimateEdited] = useState(false);
  const defaultOwnerId = task?.ownerId ?? users[0]?.id ?? "";
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? defaultOwnerId);
  const assigneeName =
    users.find((user) => user.id === assigneeId)?.name ?? task?.assignee ?? "You";
  const automaticStartDate = automaticTime && status === "backlog";
  const automaticDueDate = automaticTime && status === "done";

  function changeStatus(value: Task["status"]) {
    setStatus(value);

    if (!automaticTime) {
      return;
    }

    if (value === "backlog") {
      changeStartDate(today);
    }

    if (value === "done") {
      changeDueDate(today);
    }
  }

  function changeStartDate(value: string) {
    setStartDate(value);
    const nextDueDate = value > dueDate ? value : dueDate;
    setDueDate(nextDueDate);
    if (!estimateEdited) {
      setEstimateHours(String(calculateEstimateHours(value, nextDueDate)));
    }
  }

  function changeDueDate(value: string) {
    const nextStartDate = value < startDate ? value : startDate;
    setStartDate(nextStartDate);
    setDueDate(value);
    if (!estimateEdited) {
      setEstimateHours(String(calculateEstimateHours(nextStartDate, value)));
    }
  }

  return (
    <form action={action}>
      {task ? <input type="hidden" name="taskId" value={task.id} /> : null}
      <input type="hidden" name="workspaceId" value={activeWorkspaceId} />
      <input type="hidden" name="boardId" value={activeBoardId} />
      <input type="hidden" name="assignee" value={assigneeName} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Task title" className="sm:col-span-2">
          <input name="title" required minLength={2} defaultValue={task?.title} placeholder="Task title" disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Owner" className="sm:col-span-1">
          <select name="ownerId" defaultValue={defaultOwnerId} disabled={disabled || users.length === 0} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]">
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </Field>
        <Field label="Assign to" className="sm:col-span-1">
          <select name="assigneeId" value={assigneeId} onChange={(event) => setAssigneeId(event.currentTarget.value)} disabled={disabled || users.length === 0} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]">
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea name="description" defaultValue={task?.description} placeholder="Description" disabled={disabled} rows={4} className="min-h-24 rounded-md border border-[#d6d2c8] px-3 py-2 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Status">
          <select name="status" value={status} onChange={(event) => changeStatus(event.currentTarget.value as Task["status"])} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]">
            {defaultColumnOrder.map((status) => (
              <option key={status} value={status}>{columnLabels[status]}</option>
            ))}
          </select>
        </Field>
        <Field label="Automatic time">
          <label className="flex min-h-10 items-center gap-2 rounded-md border border-[#d6d2c8] px-3 text-sm text-[#3d4742]">
            <input
              name="automaticTime"
              type="checkbox"
              checked={automaticTime}
              onChange={(event) => {
                const checked = event.currentTarget.checked;
                setAutomaticTime(checked);

                if (!checked) {
                  return;
                }

                if (status === "backlog") {
                  changeStartDate(today);
                }

                if (status === "done") {
                  changeDueDate(today);
                }
              }}
              disabled={disabled}
              className="h-4 w-4 accent-[#1f7a4d]"
            />
            Use today for backlog start and done due date
          </label>
        </Field>
        <Field label="Priority">
          <select name="priority" defaultValue={task?.priority ?? "Medium"} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]">
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
        </Field>
        <Field label="Start date">
          <input name="startDate" type="date" required value={automaticStartDate ? today : startDate} max={automaticDueDate ? today : dueDate} onChange={(event) => changeStartDate(event.currentTarget.value)} readOnly={automaticStartDate} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] read-only:bg-[#f4f1ea] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Due date">
          <input name="dueDate" type="date" required value={automaticDueDate ? today : dueDate} min={automaticStartDate ? today : startDate} onChange={(event) => changeDueDate(event.currentTarget.value)} readOnly={automaticDueDate} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] read-only:bg-[#f4f1ea] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Estimate hours">
          <input name="estimateHours" type="number" min={1} max={200} value={estimateHours} onChange={(event) => {
            setEstimateEdited(true);
            setEstimateHours(event.currentTarget.value);
          }} disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Tags">
          <input name="tags" defaultValue={task?.tags.join(", ")} placeholder="tags, comma separated" disabled={disabled} className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]" />
        </Field>
        <Field label="Labels" className="sm:col-span-1">
          <select name="labels" multiple defaultValue={task?.labels} disabled={disabled || labels.length === 0} className="min-h-20 rounded-md border border-[#d6d2c8] px-3 py-2 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]">
            {labels.map((label) => <option key={label.id} value={label.id}>{label.name}</option>)}
          </select>
        </Field>
        <Field label="Dependencies" className="sm:col-span-1">
          <select name="dependencies" multiple defaultValue={task?.dependencies} disabled={disabled || tasks.length === 0} className="min-h-20 rounded-md border border-[#d6d2c8] px-3 py-2 text-sm outline-none focus:border-[#1f2623] disabled:bg-[#f4f1ea]">
            {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
          </select>
        </Field>
        <button
          type="submit"
          disabled={disabled}
          className="h-10 rounded-md bg-[#1f2623] px-3 text-sm font-semibold text-white disabled:bg-[#9aa39d] sm:col-span-2"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
