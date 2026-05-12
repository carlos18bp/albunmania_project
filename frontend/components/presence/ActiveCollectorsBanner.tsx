'use client';

import { useEffect } from 'react';

import { usePresenceStore } from '@/lib/stores/presenceStore';

type Props = {
  /** Optionally scope the count to a city. */
  city?: string;
};

/**
 * "Indicador en vivo de usuarios activos" — shows how many collectors are
 * online right now (optionally in a given city). Refreshes every 60s.
 */
export default function ActiveCollectorsBanner({ city }: Props) {
  const activeCount = usePresenceStore((s) => s.activeCount);
  const fetchActiveCount = usePresenceStore((s) => s.fetchActiveCount);

  useEffect(() => {
    void fetchActiveCount(city);
    const timer = setInterval(() => void fetchActiveCount(city), 60_000);
    return () => clearInterval(timer);
  }, [city, fetchActiveCount]);

  return (
    <p data-testid="active-collectors-banner" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
      <span>
        <span className="font-semibold text-foreground tabular-nums" data-testid="active-collectors-count">
          {activeCount}
        </span>{' '}
        {activeCount === 1 ? 'coleccionista en línea' : 'coleccionistas en línea'}
        {city ? ` en ${city}` : ' ahora'}
      </span>
    </p>
  );
}
