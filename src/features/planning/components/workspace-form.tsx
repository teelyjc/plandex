import type { User } from "../types/planning";

type WorkspaceFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  workspaceId?: string;
  ownerId?: string | null;
  users?: User[];
  name?: string;
  description?: string;
  submitLabel?: string;
};

export function WorkspaceForm({
  action,
  workspaceId,
  ownerId,
  users = [],
  name,
  description,
  submitLabel = "Save workspace",
}: WorkspaceFormProps) {
  const defaultOwnerId = ownerId ?? users[0]?.id ?? "";

  return (
    <form action={action} className="grid gap-3">
      {workspaceId ? <input type="hidden" name="workspaceId" value={workspaceId} /> : null}
      {users.length > 0 ? (
        <label className="grid gap-1 text-sm font-medium text-[#3d4742]">
          Owner
          <select
            name="ownerId"
            defaultValue={defaultOwnerId}
            className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm font-normal outline-none focus:border-[#1f2623]"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="ownerId" value="" />
      )}
      <label className="grid gap-1 text-sm font-medium text-[#3d4742]">
        Workspace name
        <input
          name="name"
          required
          minLength={2}
          defaultValue={name}
          placeholder="Workspace name"
          className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm font-normal outline-none focus:border-[#1f2623]"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[#3d4742]">
        Description
        <textarea
          name="description"
          defaultValue={description}
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
