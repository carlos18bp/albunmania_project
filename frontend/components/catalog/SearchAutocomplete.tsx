'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import { useAlbumStore, type Sticker } from '@/lib/stores/albumStore';
import { useCollectorMapStore, type CollectorSearchResult } from '@/lib/stores/collectorMapStore';

type Props = {
  slug: string;
  value: string;
  onValueChange: (v: string) => void;
};

/**
 * Predictive search bar for the catalogue — while the user types it suggests
 * stickers (name / team / number) and collectors with a small visual preview.
 * Picking a sticker filters the grid to it; picking a collector navigates to
 * their profile. The text input keeps the `catalog-search` test id so existing
 * grid-filter behaviour is unchanged.
 */
export default function SearchAutocomplete({ slug, value, onValueChange }: Props) {
  const router = useRouter();
  const searchStickers = useAlbumStore((s) => s.searchStickers);
  const searchCollectors = useCollectorMapStore((s) => s.searchCollectors);

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [collectors, setCollectors] = useState<CollectorSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setStickers([]);
      setCollectors([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const [st, co] = await Promise.all([
        searchStickers(slug, q).catch(() => [] as Sticker[]),
        searchCollectors(q).catch(() => [] as CollectorSearchResult[]),
      ]);
      if (cancelled) return;
      setStickers(st.slice(0, 6));
      setCollectors(co.slice(0, 5));
      setOpen(true);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, value, searchStickers, searchCollectors]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pickSticker = (s: Sticker) => {
    onValueChange(s.number || s.name);
    setOpen(false);
  };

  const hasSuggestions = stickers.length > 0 || collectors.length > 0;

  return (
    <div ref={wrapRef} className="relative flex-1">
      <input
        type="search"
        placeholder="Buscar cromos, jugadores, equipos o coleccionistas…"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={() => hasSuggestions && setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        role="combobox"
        aria-expanded={open && hasSuggestions}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Buscar cromos"
        data-testid="catalog-search"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />

      {open && hasSuggestions && (
        <ul
          id={listId}
          role="listbox"
          data-testid="catalog-suggestions"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg"
        >
          {stickers.length > 0 && (
            <li className="px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground" aria-hidden="true">
              Cromos
            </li>
          )}
          {stickers.map((s) => (
            <li key={`s-${s.id}`} role="option" aria-selected="false">
              <button
                type="button"
                data-testid={`suggestion-sticker-${s.id}`}
                onClick={() => pickSticker(s)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {s.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-mono">{s.number}</span>
                )}
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">#{s.number} {s.name}</span>
                  {s.team && <span className="text-muted-foreground"> · {s.team}</span>}
                </span>
                {s.is_special_edition && <span aria-label="Edición especial" title="Edición especial">⭐</span>}
              </button>
            </li>
          ))}

          {collectors.length > 0 && (
            <li className="px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground" aria-hidden="true">
              Coleccionistas
            </li>
          )}
          {collectors.map((c) => (
            <li key={`c-${c.user_id}`} role="option" aria-selected="false">
              <button
                type="button"
                data-testid={`suggestion-collector-${c.user_id}`}
                onClick={() => { setOpen(false); router.push(`/profile/${c.user_id}`); }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {c.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="h-8 w-8 rounded-full bg-muted" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{c.display_name}</span>
                  {c.city && <span className="text-muted-foreground"> · {c.city}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
