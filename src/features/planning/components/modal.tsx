import type { ReactNode } from "react";

type ModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: "sm" | "md";
};

export function Modal({ title, children, onClose, size = "md" }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
      <section
        className={`max-h-[90vh] w-full overflow-y-auto rounded-lg border border-[#dedbd2] bg-white p-4 shadow-xl ${
          size === "sm" ? "max-w-md" : "max-w-2xl"
        }`}
      >
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
