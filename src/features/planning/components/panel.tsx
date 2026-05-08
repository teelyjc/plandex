import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  children: ReactNode;
};

export function Panel({ title, children }: PanelProps) {
  return (
    <section className="rounded-lg border border-[#dedbd2] bg-[#fbfaf7] p-3">
      <h2 className="mb-3 text-sm font-semibold text-[#2d3632]">{title}</h2>
      {children}
    </section>
  );
}
