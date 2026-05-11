'use client';

import { useEffect } from 'react';

import { useStatsStore } from '@/lib/stores/statsStore';

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function StatCard() {
  const me = useStatsStore((s) => s.me);
  const fetchMe = useStatsStore((s) => s.fetchMe);
  const loading = useStatsStore((s) => s.loading);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  if (loading && !me) {
    return (
      <p data-testid="stat-card-loading" className="text-sm text-muted-foreground">
        Cargando estadísticas…
      </p>
    );
  }

  if (!me || !me.album_id) {
    return (
      <p data-testid="stat-card-empty" className="text-sm text-muted-foreground">
        Selecciona un álbum activo para ver tus estadísticas.
      </p>
    );
  }

  const eta = me.eta_days === null
    ? '—'
    : me.eta_days === 0
      ? '¡Completo!'
      : `${me.eta_days}d`;

  return (
    <section data-testid="stat-card" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatBlock label="% completo" value={`${me.completion_pct.toFixed(1)}%`} />
      <StatBlock label="Pegadas" value={`${me.pasted_count}/${me.total_stickers}`} />
      <StatBlock label="Repetidas" value={me.repeated_count} />
      <StatBlock label="Última semana" value={`+${me.weekly_velocity}`} />
      <StatBlock label="Racha" value={`${me.streak_days}d`} />
      <StatBlock label="ETA finalización" value={eta} />
    </section>
  );
}
