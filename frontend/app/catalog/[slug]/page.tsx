'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import CatalogFilters, { type CatalogFilterValue } from '@/components/catalog/CatalogFilters';
import StickerGrid from '@/components/catalog/StickerGrid';
import { useAlbumStore } from '@/lib/stores/albumStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { useInventoryStore } from '@/lib/stores/inventoryStore';

export default function CatalogPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const currentAlbum = useAlbumStore((s) => s.currentAlbum);
  const stickers = useAlbumStore((s) => s.stickers);
  const isLoading = useAlbumStore((s) => s.isLoading);
  const error = useAlbumStore((s) => s.error);
  const fetchAlbum = useAlbumStore((s) => s.fetchAlbum);
  const fetchStickers = useAlbumStore((s) => s.fetchStickers);
  const fetchInventory = useInventoryStore((s) => s.fetch);
  const profile = useAuthStore((s) => s.profile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  useEffect(() => {
    if (isAuthenticated && !profile) void refreshProfile().catch(() => undefined);
  }, [isAuthenticated, profile, refreshProfile]);

  const userLocation = useMemo(() => {
    const lat = profile?.lat_approx != null ? Number(profile.lat_approx) : null;
    const lng = profile?.lng_approx != null ? Number(profile.lng_approx) : null;
    return lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : null;
  }, [profile?.lat_approx, profile?.lng_approx]);

  const [filters, setFilters] = useState<CatalogFilterValue>({});

  useEffect(() => {
    if (!slug) return;
    void fetchAlbum(slug);
    void fetchInventory(slug);
  }, [slug, fetchAlbum, fetchInventory]);

  useEffect(() => {
    if (!slug) return;
    void fetchStickers(slug, filters).catch(() => undefined);
  }, [slug, filters, fetchStickers]);

  const handleFiltersChange = useCallback((next: CatalogFilterValue) => setFilters(next), []);

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
        <CatalogFilters slug={slug} userLocation={userLocation} onChange={handleFiltersChange} />
        {error === 'fetch_stickers_failed' && (
          <p data-testid="catalog-error" className="mt-2 text-sm text-red-600">
            No pudimos aplicar esos filtros. Los filtros «disponibilidad» y «disponibles cerca» requieren iniciar sesión.
          </p>
        )}
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
