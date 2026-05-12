'use client';

import { useEffect, useState } from 'react';

import SearchAutocomplete from './SearchAutocomplete';

type Props = {
  slug: string;
  initialQuery?: string;
  initialTeam?: string;
  initialSpecial?: boolean;
  onChange: (filters: { q?: string; team?: string; special?: 'true' | 'false' }) => void;
};

export default function CatalogFilters({
  slug,
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
    </div>
  );
}
