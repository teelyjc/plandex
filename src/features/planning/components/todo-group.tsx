import type { ReactNode } from "react";

type TodoGroupProps = {
  title: string;
  completeCount: number;
  totalCount: number;
  children: ReactNode;
};

export function TodoGroup({ title, completeCount, totalCount, children }: TodoGroupProps) {
  return (
    <section className="rounded-md border border-[#dedbd2] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#ece8dd] px-3 py-2">
        <h3 className="text-sm font-semibold text-[#202924]">{title}</h3>
        <span className="shrink-0 rounded-md bg-[#e8f0ea] px-2 py-1 text-xs font-semibold text-[#2e6241]">
          {completeCount}/{totalCount} done
        </span>
      </div>
      <div className="divide-y divide-[#ece8dd]">{children}</div>
    </section>
  );
}
