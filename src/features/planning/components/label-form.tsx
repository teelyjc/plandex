import type { Label } from "../types/planning";
import { Field } from "./field";

type LabelFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  activeWorkspaceId: string;
  label?: Label;
  submitLabel?: string;
};

export function LabelForm({
  action,
  activeWorkspaceId,
  label,
  submitLabel = "Create label",
}: LabelFormProps) {
  return (
    <form action={action} className="grid gap-3">
      {label ? <input type="hidden" name="labelId" value={label.id} /> : null}
      <input type="hidden" name="workspaceId" value={activeWorkspaceId} />
      <Field label="Label name">
        <input
          name="name"
          required
          minLength={2}
          maxLength={40}
          defaultValue={label?.name}
          placeholder="Frontend"
          className="h-10 rounded-md border border-[#d6d2c8] px-3 text-sm outline-none focus:border-[#1f2623]"
        />
      </Field>
      <Field label="Color">
        <input
          name="color"
          type="color"
          defaultValue={label?.color ?? "#35624a"}
          className="h-10 w-full rounded-md border border-[#d6d2c8] px-2 py-1 outline-none focus:border-[#1f2623]"
        />
      </Field>
      <button
        type="submit"
        className="h-10 rounded-md bg-[#1f2623] px-3 text-sm font-semibold text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}
