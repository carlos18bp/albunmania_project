'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import CatalogFilters from '@/components/catalog/CatalogFilters';
import StickerGrid from '@/components/catalog/StickerGrid';
import { useAlbumStore } from '@/lib/stores/albumStore';
import { useInventoryStore } from '@/lib/stores/inventoryStore';

export default function CatalogPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const currentAlbum = useAlbumStore((s) => s.currentAlbum);
  const stickers = useAlbumStore((s) => s.stickers);
  const isLoading = useAlbumStore((s) => s.isLoading);
  const fetchAlbum = useAlbumStore((s) => s.fetchAlbum);
  const fetchStickers = useAlbumStore((s) => s.fetchStickers);
  const fetchInventory = useInventoryStore((s) => s.fetch);

  const [filters, setFilters] = useState<{ q?: string; team?: string; special?: 'true' | 'false' }>({});

  useEffect(() => {
    if (!slug) return;
    void fetchAlbum(slug);
    void fetchInventory(slug);
  }, [slug, fetchAlbum, fetchInventory]);

  useEffect(() => {
    if (!slug) return;
    void fetchStickers(slug, filters);
  }, [slug, filters, fetchStickers]);

  const handleFiltersChange = useCallback(
    (next: { q?: string; team?: string; special?: 'true' | 'false' }) => setFilters(next),
    [],
  );

  if (!slug) return null;

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {currentAlbum?.name ?? 'Catálogo'}
        </h1>
        {currentAlbum && (
          <p className="text-sm text-muted-foreground mt-1">
            Edición {currentAlbum.edition_year} · {currentAlbum.total_stickers} cromos
          </p>
        )}
      </header>

      <section className="mb-6">
        <CatalogFilters slug={slug} onChange={handleFiltersChange} />
      </section>

      <section>
        <StickerGrid stickers={stickers} isLoading={isLoading} />
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        Toca un cromo para marcarlo (1 ✓), tócalo otra vez para repetidos (2×, 3×…). Mantén
        presionado para borrar.
      </p>
    </main>
  );
}
