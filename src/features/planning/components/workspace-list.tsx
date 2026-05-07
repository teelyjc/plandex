"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { createWorkspace, deleteWorkspace, updateWorkspace } from "../actions/planning-actions";
import type { PlanningSnapshot, Workspace } from "../types/planning";

type WorkspaceListProps = {
  snapshot: PlanningSnapshot;
};

export function WorkspaceList({ snapshot }: WorkspaceListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const workspaceStats = snapshot.workspaces.map((workspace) => {
    const boards = snapshot.boards.filter((board) => board.workspaceId === workspace.id);
    const boardIds = new Set(boards.map((board) => board.id));
    const tasks = snapshot.tasks.filter((task) => boardIds.has(task.boardId));
    const openTasks = tasks.filter((task) => task.status !== "done").length;

    return {
      workspace,
      boardCount: boards.length,
      taskCount: tasks.length,
      openTasks,
    };
  });

  return (
    <main className="bg-[#f7f6f2] text-[#1f2623]">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[#dedbd2] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#66736d]">
              PlanDex
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#17201c] sm:text-4xl">
              Workspaces
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66736d]">
              Choose a workspace to view its boards, schedules, tasks, and todos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-10 rounded-md bg-[#1f2623] px-4 text-sm font-semibold text-white"
          >
            New workspace
          </button>
        </header>

        <section>
          <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workspaceStats.map(({ workspace, boardCount, taskCount, openTasks }) => (
              <article
                key={workspace.id}
                className="flex min-h-56 flex-col rounded-lg border border-[#dedbd2] bg-white p-4 transition hover:border-[#9ba39b]"
              >
                <Link href={`/workspaces/${workspace.id}`} className="flex flex-1 flex-col">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-semibold leading-6 text-[#202924]">
                        {workspace.name}
                      </h2>
                      <p className="mt-1 line-clamp-3 break-words text-sm leading-6 text-[#66736d]">
                        {workspace.description || "No description"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-[#e8f0ea] px-2 py-1 text-xs font-semibold text-[#2e6241]">
                      Open
                    </span>
                  </div>
                  <dl className="mt-auto grid grid-cols-3 gap-2 pt-4 text-xs text-[#66736d]">
                    <div>
                      <dt className="font-semibold text-[#3b463f]">Boards</dt>
                      <dd className="mt-1">{boardCount}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-[#3b463f]">Tasks</dt>
                      <dd className="mt-1">{taskCount}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-[#3b463f]">Open</dt>
                      <dd className="mt-1">{openTasks}</dd>
                    </div>
                  </dl>
                </Link>
                <div className="mt-4 border-t border-[#ece8dd] pt-3">
                  <ActionDropdown>
                    <button
                      type="button"
                      onClick={() => setEditingWorkspace(workspace)}
                      className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingWorkspace(workspace);
                        setDeleteConfirmation("");
                      }}
                      className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#9f1d1d] hover:bg-[#fde8e8]"
                    >
                      Delete
                    </button>
                  </ActionDropdown>
                </div>
              </article>
            ))}

            {workspaceStats.length === 0 ? (
              <section className="rounded-lg border border-dashed border-[#c8c2b6] bg-white px-5 py-8 sm:col-span-2">
                <h2 className="text-lg font-semibold text-[#202924]">No workspaces yet</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66736d]">
                  Create your first workspace to start planning.
                </p>
              </section>
            ) : null}
          </div>
        </section>
      </section>

      {isCreateOpen ? (
        <Modal title="Create workspace" onClose={() => setIsCreateOpen(false)}>
          <WorkspaceForm action={createWorkspace} submitLabel="Create workspace" />
        </Modal>
      ) : null}

      {editingWorkspace ? (
        <Modal title="Edit workspace" onClose={() => setEditingWorkspace(null)}>
          <WorkspaceForm
            action={async (formData) => {
              await updateWorkspace(formData);
              setEditingWorkspace(null);
            }}
            workspace={editingWorkspace}
            submitLabel="Save workspace"
          />
        </Modal>
      ) : null}

      {deletingWorkspace ? (
        <Modal title="Delete workspace" onClose={() => setDeletingWorkspace(null)}>
          <DeleteWorkspaceForm
            workspace={deletingWorkspace}
            confirmation={deleteConfirmation}
            onConfirmationChange={setDeleteConfirmation}
          />
        </Modal>
      ) : null}
    </main>
  );
}

function DeleteWorkspaceForm({
  workspace,
  confirmation,
  onConfirmationChange,
}: {
  workspace: Workspace;
  confirmation: string;
  onConfirmationChange: (value: string) => void;
}) {
  return (
    <form action={deleteWorkspace} className="grid gap-3">
      <input type="hidden" name="workspaceId" value={workspace.id} />
      <p className="text-sm leading-6 text-[#66736d]">
        Type <span className="font-semibold text-[#202924]">{workspace.name}</span> to confirm
        deletion.
      </p>
      <label className="grid gap-1 text-sm font-medium text-[#3d4742]">
        Workspace name confirmation
        <input
          value={confirmation}
          onChange={(event) => onConfirmationChange(event.currentTarget.value)}
          className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm font-normal outline-none focus:border-[#1f2623]"
        />
      </label>
      <button
        type="submit"
        disabled={confirmation !== workspace.name}
        className="h-10 rounded-md bg-[#9f1d1d] px-3 text-sm font-semibold text-white disabled:bg-[#d6a6a6]"
      >
        Delete workspace
      </button>
    </form>
  );
}

function WorkspaceForm({
  action,
  workspace,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  workspace?: Workspace;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-3">
      {workspace ? <input type="hidden" name="workspaceId" value={workspace.id} /> : null}
      <label className="grid gap-1 text-sm font-medium text-[#3d4742]">
        Workspace name
        <input
          name="name"
          required
          minLength={2}
          defaultValue={workspace?.name}
          placeholder="Workspace name"
          className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm font-normal outline-none focus:border-[#1f2623]"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[#3d4742]">
        Description
        <textarea
          name="description"
          defaultValue={workspace?.description}
          placeholder="Description"
          rows={4}
          className="min-h-24 rounded-md border border-[#d6d2c8] px-3 py-2 text-sm font-normal outline-none focus:border-[#1f2623]"
        />
      </label>
      <button
        type="submit"
        className="h-10 rounded-md bg-[#1f2623] px-3 text-sm font-semibold text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function ActionDropdown({ children }: { children: ReactNode }) {
  return (
    <details className="relative inline-block">
      <summary className="flex h-8 cursor-pointer list-none items-center rounded-md border border-[#d6d2c8] px-3 text-xs font-semibold text-[#24302a]">
        Actions
      </summary>
      <div className="absolute right-0 z-20 mt-2 min-w-32 rounded-md border border-[#dedbd2] bg-white p-1 shadow-lg">
        {children}
      </div>
    </details>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
      <section className="w-full max-w-md rounded-lg border border-[#dedbd2] bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#202924]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-md border border-[#d6d2c8] px-3 text-sm font-medium text-[#3d4742]"
          >
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
