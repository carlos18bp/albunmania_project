'use client';

type Series = { label: string; value: number };

type Props = {
  series: Series[];
  emptyText?: string;
};

/**
 * Minimal bar chart — no chart lib. Each bar's width is `value / max * 100%`.
 * Used for matches/trades trend, devices and top sticker lists.
 */
export default function MiniBarChart({ series, emptyText = 'Sin datos' }: Props) {
  if (series.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  const max = Math.max(1, ...series.map((s) => s.value));
  return (
    <ul data-testid="mini-bar-chart" className="space-y-1">
      {series.map((s, i) => (
        <li key={i} className="grid grid-cols-[120px_1fr_60px] items-center gap-3 text-xs">
          <span className="truncate">{s.label}</span>
          <div className="h-2 rounded bg-muted overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${(s.value / max) * 100}%` }}
              data-testid={`bar-${i}`}
            />
          </div>
          <span className="text-right tabular-nums text-muted-foreground">{s.value}</span>
        </li>
      ))}
    </ul>
  );
}
