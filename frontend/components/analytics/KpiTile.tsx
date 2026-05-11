'use client';

type Props = {
  label: string;
  value: string | number;
  hint?: string;
};

export default function KpiTile({ label, value, hint }: Props) {
  return (
    <div data-testid="kpi-tile" className="rounded-lg border border-border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
