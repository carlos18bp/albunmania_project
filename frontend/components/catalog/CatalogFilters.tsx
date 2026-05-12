'use client';

import { useEffect, useState } from 'react';

import SearchAutocomplete from './SearchAutocomplete';

export type CatalogFilterValue = {
  q?: string;
  team?: string;
  special?: 'true' | 'false';
  availability?: 'mine' | 'missing' | 'repeated';
  nearby?: boolean;
  lat?: number;
  lng?: number;
  radius_km?: number;
};

type Props = {
  slug: string;
  initialQuery?: string;
  initialTeam?: string;
  initialSpecial?: boolean;
  /** The signed-in user's approximate location, if any — enables the "near me" filter. */
  userLocation?: { lat: number; lng: number } | null;
  onChange: (filters: CatalogFilterValue) => void;
};

const RADIUS_OPTIONS = [10, 25, 50, 100] as const;

export default function CatalogFilters({
  slug,
  initialQuery = '',
  initialTeam = '',
  initialSpecial,
  userLocation,
  onChange,
}: Props) {
  const [q, setQ] = useState(initialQuery);
  const [team, setTeam] = useState(initialTeam);
  const [specialOnly, setSpecialOnly] = useState(initialSpecial ?? false);
  const [availability, setAvailability] = useState<'' | 'mine' | 'missing' | 'repeated'>('');
  const [nearbyOn, setNearbyOn] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(50);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next: CatalogFilterValue = {
        q: q.trim() ? q.trim() : undefined,
        team: team.trim() ? team.trim() : undefined,
        special: specialOnly ? 'true' : undefined,
        availability: availability || undefined,
      };
      if (nearbyOn && userLocation) {
        next.nearby = true;
        next.lat = userLocation.lat;
        next.lng = userLocation.lng;
        next.radius_km = radiusKm;
      }
      onChange(next);
    }, 250);
    return () => clearTimeout(timer);
  }, [q, team, specialOnly, availability, nearbyOn, radiusKm, userLocation, onChange]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
      <SearchAutocomplete slug={slug} value={q} onValueChange={setQ} />
      <input
        type="text"
        placeholder="Equipo"
        value={team}
        onChange={(e) => setTeam(e.target.value)}
        aria-label="Filtrar por equipo"
        data-testid="catalog-filter-team"
        className="w-full md:w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={specialOnly}
          onChange={(e) => setSpecialOnly(e.target.checked)}
          data-testid="catalog-filter-special"
        />
        Solo ediciones especiales
      </label>
      <select
        value={availability}
        onChange={(e) => setAvailability(e.target.value as '' | 'mine' | 'missing' | 'repeated')}
        aria-label="Disponibilidad"
        data-testid="catalog-filter-availability"
        className="w-full md:w-44 rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">Todos los cromos</option>
        <option value="mine">Los que tengo</option>
        <option value="missing">Me faltan</option>
        <option value="repeated">Repetidos</option>
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={nearbyOn}
          onChange={(e) => setNearbyOn(e.target.checked)}
          disabled={!userLocation}
          data-testid="catalog-filter-nearby"
        />
        Disponibles cerca
        {nearbyOn && userLocation && (
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            aria-label="Radio de proximidad"
            data-testid="catalog-filter-radius"
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>{r} km</option>
            ))}
          </select>
        )}
      </label>
      {!userLocation && (
        <span data-testid="catalog-nearby-hint" className="text-xs text-muted-foreground">
          Activa tu ubicación en el onboarding para filtrar por cercanía.
        </span>
      )}
    </div>
  );
}
