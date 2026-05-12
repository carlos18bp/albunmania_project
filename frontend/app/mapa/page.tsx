'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import CollectorMap from '@/components/collectors/CollectorMap';
import LiveBadge from '@/components/presence/LiveBadge';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useCollectorMapStore } from '@/lib/stores/collectorMapStore';

const DEFAULT_CENTER: [number, number] = [4.65, -74.1]; // Bogotá
const NEARBY_RADIUS_KM = 50;

export default function CollectorsMapPage() {
  const { isAuthenticated } = useRequireAuth();

  const collectors = useCollectorMapStore((s) => s.entries);
  const loading = useCollectorMapStore((s) => s.loading);
  const fetchCollectors = useCollectorMapStore((s) => s.fetchCollectors);

  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchCollectors().catch(() => undefined);
  }, [isAuthenticated, fetchCollectors]);

  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoError('Tu navegador no soporta geolocalización.');
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(here);
        void fetchCollectors({ lat: here[0], lng: here[1], radiusKm: NEARBY_RADIUS_KM }).catch(() => undefined);
      },
      (err) => setGeoError(err.message || 'No pudimos leer tu ubicación.'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  if (!isAuthenticated) return null;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Mapa de Coleccionistas</h1>
        <p className="text-sm text-muted-foreground">
          Coleccionistas cerca de ti (ubicación aproximada por privacidad). Útil para encontrar parches de intercambio.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={useMyLocation}
          data-testid="use-my-location"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Usar mi ubicación (radio {NEARBY_RADIUS_KM} km)
        </button>
        <button
          type="button"
          onClick={() => { setCenter(DEFAULT_CENTER); void fetchCollectors().catch(() => undefined); }}
          data-testid="show-all-collectors"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Ver todos
        </button>
        {geoError && <span className="text-sm text-red-600" data-testid="geo-error">{geoError}</span>}
      </div>

      <CollectorMap collectors={collectors} center={center} />

      <section className="space-y-2">
        <h2 className="font-medium">
          {loading ? 'Buscando coleccionistas…' : `${collectors.length} coleccionistas`}
        </h2>
        {!loading && collectors.length === 0 && (
          <p data-testid="collectors-empty" className="text-sm text-muted-foreground">
            No encontramos coleccionistas con ubicación en esta zona.
          </p>
        )}
        <ul data-testid="collectors-list" className="divide-y divide-border rounded-lg border border-border">
          {collectors.map((c) => (
            <li key={c.user_id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <Link href={`/profile/${c.user_id}`} className="font-medium hover:underline">
                  {c.display_name}
                </Link>
                <LiveBadge online={c.is_online} size="sm" />
                {c.city && <span className="text-muted-foreground">· {c.city}</span>}
              </span>
              <span className="text-muted-foreground">★ {Number(c.rating_avg).toFixed(1)} ({c.rating_count})</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
