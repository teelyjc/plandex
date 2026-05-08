import Link from "next/link";
import type { Workspace } from "../types/planning";
import { ActionDropdown } from "./action-dropdown";

type WorkspaceCardProps = {
  workspace: Workspace;
  boardCount: number;
  taskCount: number;
  openTasks: number;
  onEdit: () => void;
  onDelete: () => void;
};

export function WorkspaceCard({
  workspace,
  boardCount,
  taskCount,
  openTasks,
  onEdit,
  onDelete,
}: WorkspaceCardProps) {
  return (
    <article className="flex min-h-56 flex-col rounded-lg border border-[#dedbd2] bg-white p-4 transition hover:border-[#9ba39b]">
      <Link href={`/workspaces/${workspace.id}`} className="flex flex-1 flex-col">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold leading-6 text-[#202924]">
              {workspace.name}
            </h2>
            <p className="mt-1 line-clamp-3 break-words text-sm leading-6 text-[#66736d]">
              {workspace.description || "No description"}
            </p>
            <p className="mt-2 text-xs font-semibold text-[#52605a]">
              Owner: {workspace.owner?.name ?? "Unassigned"}
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
        <ActionDropdown align="right">
          <button
            type="button"
            onClick={onEdit}
            className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#24302a] hover:bg-[#f4f1ea]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-[#9f1d1d] hover:bg-[#fde8e8]"
          >
            Delete
          </button>
        </ActionDropdown>
      </div>
    </article>
  );
}
