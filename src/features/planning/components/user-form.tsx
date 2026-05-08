import type { User } from "../types/planning";

type UserFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  user?: User;
  submitLabel?: string;
};

export function UserForm({ action, user, submitLabel = "Save user" }: UserFormProps) {
  return (
    <form action={action} className="grid gap-3">
      {user ? <input type="hidden" name="userId" value={user.id} /> : null}
      <label className="grid gap-1 text-sm font-medium text-[#3d4742]">
        Name
        <input
          name="name"
          required
          minLength={2}
          defaultValue={user?.name}
          placeholder="User name"
          className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm font-normal outline-none focus:border-[#1f2623]"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[#3d4742]">
        Email
        <input
          name="email"
          type="email"
          defaultValue={user?.email ?? ""}
          placeholder="name@example.com"
          className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm font-normal outline-none focus:border-[#1f2623]"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-[#3d4742]">
        Color
        <input
          name="color"
          type="color"
          defaultValue={user?.color ?? "#35624a"}
          className="h-10 rounded-md border border-[#d6d2c8] bg-white px-2 py-1 outline-none focus:border-[#1f2623]"
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
