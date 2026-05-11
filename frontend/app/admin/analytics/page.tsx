'use client';

import { useEffect } from 'react';

import KpiTile from '@/components/analytics/KpiTile';
import MiniBarChart from '@/components/analytics/MiniBarChart';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useAnalyticsStore } from '@/lib/stores/analyticsStore';

export default function AdminAnalyticsPage() {
  const { isAuthenticated } = useRequireAuth();
  const overview = useAnalyticsStore((s) => s.overview);
  const fetchOverview = useAnalyticsStore((s) => s.fetchOverview);
  const exportCsvUrl = useAnalyticsStore((s) => s.exportCsvUrl);
  const loading = useAnalyticsStore((s) => s.loading);

  useEffect(() => {
    if (isAuthenticated) void fetchOverview();
  }, [isAuthenticated, fetchOverview]);

  if (!isAuthenticated) return null;

  if (loading && !overview) {
    return <main className="px-6 py-10 text-center">Cargando KPIs…</main>;
  }
  if (!overview) {
    return <main className="px-6 py-10 text-center text-red-600">No pudimos cargar los KPIs.</main>;
  }

  const { community, ads, returning_vs_new, devices, top_stickers, matches_trend, heatmap } = overview;

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analítica + KPIs</h1>
          <p className="text-sm text-muted-foreground">
            Ventana desde {community.window_since}
          </p>
        </div>
        <a
          href={exportCsvUrl()}
          data-testid="export-csv"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Descargar CSV
        </a>
      </header>

      <section data-testid="community-kpis" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Usuarios activos" value={community.active_users} />
        <KpiTile label="Nuevos" value={community.new_users} />
        <KpiTile label="Matches" value={community.matches_in_window} />
        <KpiTile label="Trades completados" value={community.trades_completed} />
      </section>

      <section data-testid="ad-kpis" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Impresiones" value={ads.impressions} />
        <KpiTile label="Clics" value={ads.clicks} />
        <KpiTile label="CTR" value={`${(ads.ctr * 100).toFixed(2)}%`} />
        <KpiTile
          label="Nuevos vs recurrentes"
          value={`${returning_vs_new.new} / ${returning_vs_new.returning}`}
          hint="nuevos / recurrentes"
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Matches y trades por día</h2>
        <MiniBarChart
          series={matches_trend.map((row) => ({ label: row.day, value: row.matches }))}
          emptyText="Sin matches en la ventana."
        />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-medium">Cromos más ofertados</h2>
          <MiniBarChart
            series={top_stickers.most_offered.map((s) => ({
              label: `#${s.number} ${s.name}`, value: s.count,
            }))}
          />
        </div>
        <div className="space-y-2">
          <h2 className="font-medium">Cromos más buscados</h2>
          <MiniBarChart
            series={top_stickers.most_wanted.map((s) => ({
              label: `#${s.number} ${s.name}`, value: s.count,
            }))}
          />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-medium">Dispositivos</h2>
          <MiniBarChart
            series={devices.map((d) => ({ label: d.device, value: d.pct }))}
          />
          <p className="text-xs text-muted-foreground">
            * Estimación V1, instrumentación de UA llega en V2.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="font-medium">Top ciudades por impresiones</h2>
          <MiniBarChart
            series={ads.top_cities.map((c) => ({ label: c.city || '(sin ciudad)', value: c.impressions }))}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Mapa de calor de actividad</h2>
        <p className="text-sm text-muted-foreground">
          {heatmap.length} puntos de actividad en la ventana. Visualización Leaflet
          completa llega en V2 — por ahora se exponen las coordenadas en el JSON
          del overview.
        </p>
      </section>
    </main>
  );
}
