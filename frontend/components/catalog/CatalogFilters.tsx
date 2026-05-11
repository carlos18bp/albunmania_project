'use client';

import { useEffect, useState } from 'react';

type Props = {
  initialQuery?: string;
  initialTeam?: string;
  initialSpecial?: boolean;
  onChange: (filters: { q?: string; team?: string; special?: 'true' | 'false' }) => void;
};

export default function CatalogFilters({
  initialQuery = '',
  initialTeam = '',
  initialSpecial,
  onChange,
}: Props) {
  const [q, setQ] = useState(initialQuery);
  const [team, setTeam] = useState(initialTeam);
  const [specialOnly, setSpecialOnly] = useState(initialSpecial ?? false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({
        q: q.trim() ? q.trim() : undefined,
        team: team.trim() ? team.trim() : undefined,
        special: specialOnly ? 'true' : undefined,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [q, team, specialOnly, onChange]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <input
        type="search"
        placeholder="Buscar por nombre o número…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Buscar cromos"
        data-testid="catalog-search"
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
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
    </div>
  );
}
