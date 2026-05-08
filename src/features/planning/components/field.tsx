import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function Field({ label, children, className = "" }: FieldProps) {
  return (
    <label className={`grid gap-1 text-sm font-medium text-[#3d4742] ${className}`}>
      {label}
      {children}
    </label>
  );
}
