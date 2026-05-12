'use client';

import { useEffect } from 'react';

import { useStatsStore } from '@/lib/stores/statsStore';
import LiveBadge from '@/components/presence/LiveBadge';

type Props = {
  albumId: number | null;
  city: string;
};

export default function RankingList({ albumId, city }: Props) {
  const ranking = useStatsStore((s) => s.ranking);
  const fetchRanking = useStatsStore((s) => s.fetchRanking);
  const loading = useStatsStore((s) => s.loading);

  useEffect(() => {
    if (albumId && city) void fetchRanking(albumId, city);
  }, [albumId, city, fetchRanking]);

  if (!albumId || !city) {
    return (
      <p data-testid="ranking-empty-config" className="text-sm text-muted-foreground">
        Selecciona un álbum activo y completa tu ciudad para ver el ranking.
      </p>
    );
  }

  if (loading && ranking.length === 0) {
    return <p className="text-sm text-muted-foreground">Cargando ranking…</p>;
  }

  if (ranking.length === 0) {
    return (
      <p data-testid="ranking-empty" className="text-sm text-muted-foreground">
        Aún no hay coleccionistas activos en {city}.
      </p>
    );
  }

  return (
    <ol data-testid="ranking-list" className="space-y-2">
      {ranking.map((entry, idx) => (
        <li
          key={entry.user_id}
          className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm"
        >
          <span className="inline-flex items-center gap-1">
            <span className="font-mono text-muted-foreground mr-1">#{idx + 1}</span>
            {entry.email}
            <LiveBadge online={entry.is_online} size="sm" />
          </span>
          <span className="font-medium">{entry.pasted_count} pegadas</span>
        </li>
      ))}
    </ol>
  );
}
