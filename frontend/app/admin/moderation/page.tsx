'use client';

import { useEffect, useState } from 'react';

import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useAdminStore } from '@/lib/stores/adminStore';

export default function AdminModerationPage() {
  const { isAuthenticated } = useRequireAuth();
  const reports = useAdminStore((s) => s.reviewReports);
  const fetchReviewReports = useAdminStore((s) => s.fetchReviewReports);
  const toggleReviewVisibility = useAdminStore((s) => s.toggleReviewVisibility);

  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchReviewReports(filter || undefined);
  }, [isAuthenticated, filter, fetchReviewReports]);

  if (!isAuthenticated) return null;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Moderación de reseñas</h1>
        <p className="text-sm text-muted-foreground">
          {reports.length} reportes en estado actual.
        </p>
      </header>

      <div className="flex gap-2 text-sm">
        {['pending', 'actioned', 'dismissed', ''].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            data-testid={`filter-${s || 'all'}`}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 ${filter === s ? 'bg-emerald-600 text-white' : 'border border-border'}`}
          >
            {s || 'Todos'}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <p data-testid="moderation-empty" className="text-sm text-muted-foreground">
          No hay reportes en este estado.
        </p>
      ) : (
        <ul className="space-y-3" data-testid="moderation-list">
          {reports.map((r) => (
            <li key={r.id} className="rounded-lg border border-border p-4 space-y-2">
              <header className="flex items-center justify-between">
                <span className="text-sm font-medium">Review #{r.review} · {r.review_stars}★</span>
                <span className="text-xs rounded-full bg-muted px-2 py-1">{r.status}</span>
              </header>
              <p className="text-sm">Razón: {r.reason}</p>
              <p className="text-xs text-muted-foreground">Reportado por {r.reporter_email}</p>
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleReviewVisibility(r.review, false, 'Reseña ocultada')}
                    data-testid={`hide-${r.review}`}
                    className="rounded bg-red-600 text-white px-3 py-1 text-xs"
                  >
                    Ocultar reseña
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleReviewVisibility(r.review, true, 'Reporte desestimado')}
                    data-testid={`dismiss-${r.review}`}
                    className="rounded border border-border px-3 py-1 text-xs"
                  >
                    Mantener visible
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
