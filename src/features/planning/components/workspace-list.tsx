"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "../actions/create-user";
import { createWorkspace } from "../actions/create-workspace";
import { updateUser } from "../actions/update-user";
import { updateWorkspace } from "../actions/update-workspace";
import type { PlanningSnapshot, User, Workspace } from "../types/planning";
import { DeleteWorkspaceForm } from "./delete-workspace-form";
import { Modal } from "./modal";
import { UserForm } from "./user-form";
import { WorkspaceCard } from "./workspace-card";
import { WorkspaceForm } from "./workspace-form";

type WorkspaceListProps = {
  snapshot: PlanningSnapshot;
};

const viewingUserStorageKey = "plandex.viewingUserId";
const performingUserStorageKey = "plandex.performingUserId";
const allViewingUsersValue = "all";

function getStoredUserId(storageKey: string, users: User[]) {
  if (typeof window === "undefined") {
    return users[0]?.id ?? "";
  }

  const storedUserId = window.localStorage.getItem(storageKey);
  if (storageKey === viewingUserStorageKey && storedUserId === allViewingUsersValue) {
    return allViewingUsersValue;
  }

  return users.find((user) => user.id === storedUserId)?.id ?? users[0]?.id ?? "";
}

export function WorkspaceList({ snapshot }: WorkspaceListProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [viewingUserId, setViewingUserId] = useState(() =>
    getStoredUserId(viewingUserStorageKey, snapshot.users),
  );
  const [performingUserId, setPerformingUserId] = useState(() =>
    getStoredUserId(performingUserStorageKey, snapshot.users),
  );
  const viewingUser =
    viewingUserId === allViewingUsersValue
      ? null
      : snapshot.users.find((user) => user.id === viewingUserId) ?? snapshot.users[0];
  const performingUser =
    snapshot.users.find((user) => user.id === performingUserId) ?? snapshot.users[0];
  const visibleWorkspaces = viewingUserId === allViewingUsersValue
    ? snapshot.workspaces
    : viewingUser
    ? snapshot.workspaces.filter((workspace) => workspace.ownerId === viewingUser.id)
    : snapshot.workspaces;
  const workspaceStats = visibleWorkspaces.map((workspace) => {
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

  useEffect(() => {
    if (viewingUserId) {
      window.localStorage.setItem(viewingUserStorageKey, viewingUserId);
    }
  }, [viewingUserId]);

  useEffect(() => {
    if (performingUser?.id) {
      window.localStorage.setItem(performingUserStorageKey, performingUser.id);
    }
  }, [performingUser?.id]);

  function changeViewingUser(userId: string) {
    setViewingUserId(userId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(viewingUserStorageKey, userId);
    }
  }

  function changePerformingUser(userId: string) {
    setPerformingUserId(userId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(performingUserStorageKey, userId);
    }
  }

  async function createUserAndSelect(formData: FormData) {
    await createUser(formData);
    setIsCreateUserOpen(false);
    router.refresh();
  }

  async function updateUserAndClose(formData: FormData) {
    await updateUser(formData);
    setEditingUser(null);
    router.refresh();
  }

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

        {snapshot.users.length > 0 ? (
          <section className="grid gap-3 rounded-lg border border-[#dedbd2] bg-white px-4 py-3 md:grid-cols-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68736d]">
                  Viewing as
                </p>
                <p className="mt-1 text-sm text-[#3d4742]">
                  Filters the workspace list by owner.
                </p>
              </div>
              <select
                value={viewingUserId}
                onChange={(event) => changeViewingUser(event.currentTarget.value)}
                className="h-10 min-w-44 rounded-md border border-[#d6d2c8] bg-white px-3 text-sm font-semibold text-[#202924] outline-none focus:border-[#1f2623]"
              >
                <option value={allViewingUsersValue}>All</option>
                {snapshot.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ece8dd] pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68736d]">
                  Performing as
                </p>
                <p className="mt-1 text-sm text-[#3d4742]">
                  Defaults new workspace ownership.
                </p>
              </div>
              <select
                value={performingUser?.id ?? ""}
                onChange={(event) => changePerformingUser(event.currentTarget.value)}
                className="h-10 min-w-44 rounded-md border border-[#d6d2c8] bg-white px-3 text-sm font-semibold text-[#202924] outline-none focus:border-[#1f2623]"
              >
                {snapshot.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-[#dedbd2] bg-white px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#202924]">Users</h2>
              <p className="mt-1 text-sm text-[#66736d]">
                Add virtual users and assign workspace ownership.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateUserOpen(true)}
              className="h-9 rounded-md border border-[#d6d2c8] bg-white px-3 text-sm font-semibold text-[#24302a] hover:border-[#949b93]"
            >
              Add user
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {snapshot.users.map((user) => {
              const ownedCount = snapshot.workspaces.filter(
                (workspace) => workspace.ownerId === user.id,
              ).length;

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setEditingUser(user)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#dedbd2] bg-[#fbfaf7] px-3 text-left text-sm hover:border-[#949b93]"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="font-semibold text-[#202924]">{user.name}</span>
                  <span className="text-xs text-[#66736d]">{ownedCount} workspace</span>
                </button>
              );
            })}
            {snapshot.users.length === 0 ? (
              <p className="text-sm text-[#66736d]">
                Add a user before creating owner-filtered workspaces.
              </p>
            ) : null}
          </div>
        </section>

        <section>
          <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workspaceStats.map(({ workspace, boardCount, taskCount, openTasks }) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                boardCount={boardCount}
                taskCount={taskCount}
                openTasks={openTasks}
                onEdit={() => setEditingWorkspace(workspace)}
                onDelete={() => {
                  setDeletingWorkspace(workspace);
                  setDeleteConfirmation("");
                }}
              />
            ))}

            {workspaceStats.length === 0 ? (
              <section className="rounded-lg border border-dashed border-[#c8c2b6] bg-white px-5 py-8 sm:col-span-2">
                <h2 className="text-lg font-semibold text-[#202924]">No workspaces yet</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66736d]">
                  Create a workspace for {viewingUser?.name ?? "a user"} to start planning.
                </p>
              </section>
            ) : null}
          </div>
        </section>
      </section>

      {isCreateOpen ? (
        <Modal title="Create workspace" onClose={() => setIsCreateOpen(false)} size="sm">
          <WorkspaceForm
            action={createWorkspace}
            ownerId={performingUser?.id}
            users={snapshot.users}
            submitLabel="Create workspace"
          />
        </Modal>
      ) : null}

      {isCreateUserOpen ? (
        <Modal title="Add user" onClose={() => setIsCreateUserOpen(false)} size="sm">
          <UserForm action={createUserAndSelect} submitLabel="Add user" />
        </Modal>
      ) : null}

      {editingUser ? (
        <Modal title="Edit user" onClose={() => setEditingUser(null)} size="sm">
          <UserForm
            action={updateUserAndClose}
            user={editingUser}
            submitLabel="Save user"
          />
        </Modal>
      ) : null}

      {editingWorkspace ? (
        <Modal title="Edit workspace" onClose={() => setEditingWorkspace(null)} size="sm">
          <WorkspaceForm
            action={async (formData) => {
              await updateWorkspace(formData);
              setEditingWorkspace(null);
            }}
            workspaceId={editingWorkspace.id}
            ownerId={editingWorkspace.ownerId ?? performingUser?.id}
            users={snapshot.users}
            name={editingWorkspace.name}
            description={editingWorkspace.description}
            submitLabel="Save workspace"
          />
        </Modal>
      ) : null}

      {deletingWorkspace ? (
        <Modal title="Delete workspace" onClose={() => setDeletingWorkspace(null)} size="sm">
          <DeleteWorkspaceForm
            workspaceId={deletingWorkspace.id}
            workspaceName={deletingWorkspace.name}
            confirmation={deleteConfirmation}
            onConfirmationChange={setDeleteConfirmation}
          />
        </Modal>
      ) : null}
    </main>
  );
}
