type MetricProps = {
  label: string;
  value: string;
};

export function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-lg border border-[#dedbd2] bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68736d]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#202924]">{value}</p>
    </div>
  );
}
