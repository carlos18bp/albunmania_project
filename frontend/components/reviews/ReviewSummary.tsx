'use client';

import { useEffect } from 'react';

import { useReviewStore } from '@/lib/stores/reviewStore';

type Props = {
  userId: number;
};

const TAG_LABELS: Record<string, string> = {
  puntual: 'Puntual', cromos_buen_estado: 'Buen estado', buena_comunicacion: 'Buena comunicación',
  amable: 'Amable', rapido: 'Rápido', ubicacion_facil: 'Ubicación fácil',
  no_show: 'No-show', cromos_mal_estado: 'Mal estado', mala_comunicacion: 'Mala comunicación',
};

export default function ReviewSummary({ userId }: Props) {
  const summary = useReviewStore((s) => s.summaryByUser[userId]);
  const fetchUserSummary = useReviewStore((s) => s.fetchUserSummary);

  useEffect(() => {
    if (!summary) void fetchUserSummary(userId);
  }, [userId, summary, fetchUserSummary]);

  if (!summary) {
    return <p data-testid="summary-loading" className="text-sm text-muted-foreground">Cargando…</p>;
  }

  const max = Math.max(1, ...Object.values(summary.distribution));
  const avg = Number(summary.rating_avg);
  const positive = Number(summary.positive_pct);

  return (
    <section data-testid="review-summary" className="rounded-lg border border-border p-4 space-y-4">
      <header className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{avg.toFixed(1)}</span>
        <span className="text-yellow-500 text-lg">★</span>
        <span className="text-sm text-muted-foreground">
          {summary.rating_count} reseña{summary.rating_count === 1 ? '' : 's'}
        </span>
        <span className="ml-auto text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1">
          {positive.toFixed(0)}% positivas
        </span>
      </header>

      <div className="space-y-1">
        {[5, 4, 3, 2, 1].map((s) => {
          const count = summary.distribution[String(s)] ?? 0;
          const widthPct = (count / max) * 100;
          return (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span className="w-4">{s}★</span>
              <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                <div
                  data-testid={`bar-${s}`}
                  className="h-full bg-yellow-500"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="w-6 text-right text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>

      {summary.top_tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {summary.top_tags.map((t) => (
            <li
              key={t.tag}
              className="text-xs rounded-full bg-muted px-2 py-1"
              data-testid={`top-tag-${t.tag}`}
            >
              {TAG_LABELS[t.tag] ?? t.tag} · {t.count}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
