import { deleteWorkspace } from "../actions/delete-workspace";

type DeleteWorkspaceFormProps = {
  workspaceId: string;
  workspaceName: string;
  confirmation: string;
  onConfirmationChange: (value: string) => void;
};

export function DeleteWorkspaceForm({
  workspaceId,
  workspaceName,
  confirmation,
  onConfirmationChange,
}: DeleteWorkspaceFormProps) {
  return (
    <form action={deleteWorkspace} className="grid gap-3">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <p className="text-sm leading-6 text-[#66736d]">
        Type <span className="font-semibold text-[#202924]">{workspaceName}</span> to confirm
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
        disabled={confirmation !== workspaceName}
        className="h-10 rounded-md bg-[#9f1d1d] px-3 text-sm font-semibold text-white disabled:bg-[#d6a6a6]"
      >
        Delete workspace
      </button>
    </form>
  );
}
