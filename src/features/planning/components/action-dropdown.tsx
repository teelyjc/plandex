import type { ReactNode } from "react";

type ActionDropdownProps = {
  children: ReactNode;
  align?: "left" | "right";
  label?: string;
};

export function ActionDropdown({ children, align = "left", label = "Actions" }: ActionDropdownProps) {
  return (
    <details className="relative inline-block">
      <summary className="flex h-8 cursor-pointer list-none items-center rounded-md border border-[#d6d2c8] bg-white px-3 text-xs font-semibold text-[#24302a]">
        {label}
      </summary>
      <div
        className={`absolute z-20 mt-2 min-w-32 rounded-md border border-[#dedbd2] bg-white p-1 shadow-lg ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        {children}
      </div>
    </details>
  );
}
