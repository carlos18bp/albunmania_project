'use client';

import { useOnboardingStore } from '@/lib/stores/onboardingStore';

/**
 * Step 1 of the onboarding wizard — pick an album.
 *
 * Until Epic 2 ships an /api/v1/albums/ catalogue, only the World Cup 26
 * album is available. The component is forward-compatible: as soon as the
 * Album model exists this list will be replaced by a fetch + render of
 * `Album.objects.filter(is_active=True)`.
 */

const PLACEHOLDER_ALBUMS = [
  { id: 1, name: 'Mundial 26', subtitle: 'Edición oficial Panini' },
];

export default function StepAlbumSelect() {
  const activeAlbumId = useOnboardingStore((s) => s.activeAlbumId);
  const setActiveAlbum = useOnboardingStore((s) => s.setActiveAlbum);

  return (
    <section aria-labelledby="onboarding-step1-title" className="space-y-4">
      <h2 id="onboarding-step1-title" className="text-2xl font-semibold tracking-tight">
        Elige tu álbum activo
      </h2>
      <p className="text-sm text-muted-foreground">
        Tu álbum activo es el catálogo que verás por defecto al buscar cromos y al hacer match.
      </p>

      <ul className="space-y-2">
        {PLACEHOLDER_ALBUMS.map((album) => {
          const selected = activeAlbumId === album.id;
          return (
            <li key={album.id}>
              <button
                type="button"
                aria-pressed={selected}
                data-testid={`album-option-${album.id}`}
                onClick={() => setActiveAlbum(album.id)}
                className={`w-full flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <div>
                  <p className="font-semibold">{album.name}</p>
                  <p className="text-xs text-muted-foreground">{album.subtitle}</p>
                </div>
                <span className="text-xs">{selected ? '✓ Seleccionado' : 'Seleccionar'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
