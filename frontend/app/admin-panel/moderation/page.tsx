'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useAdminStore } from '@/lib/stores/adminStore';
import { useReportStore, REPORT_REASON_LABELS } from '@/lib/stores/reportStore';

export default function AdminModerationPage() {
  const { isAuthenticated } = useRequireAuth();

  // ── Review reports ──
  const reviewReports = useAdminStore((s) => s.reviewReports);
  const fetchReviewReports = useAdminStore((s) => s.fetchReviewReports);
  const toggleReviewVisibility = useAdminStore((s) => s.toggleReviewVisibility);
  const [filter, setFilter] = useState('pending');

  // ── General reports (user / trade) ──
  const reports = useReportStore((s) => s.reports);
  const fetchReports = useReportStore((s) => s.fetchReports);
  const resolveReport = useReportStore((s) => s.resolveReport);
  const [reportFilter, setReportFilter] = useState('pending');

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchReviewReports(filter || undefined);
  }, [isAuthenticated, filter, fetchReviewReports]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchReports(reportFilter ? { status: reportFilter } : {}).catch(() => undefined);
  }, [isAuthenticated, reportFilter, fetchReports]);

  if (!isAuthenticated) return null;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
      {/* ── Review reports ── */}
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Moderación de reseñas</h1>
          <p className="text-sm text-muted-foreground">{reviewReports.length} reportes en estado actual.</p>
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

        {reviewReports.length === 0 ? (
          <p data-testid="moderation-empty" className="text-sm text-muted-foreground">No hay reportes en este estado.</p>
        ) : (
          <ul className="space-y-3" data-testid="moderation-list">
            {reviewReports.map((r) => (
              <li key={r.id} className="rounded-lg border border-border p-4 space-y-2">
                <header className="flex items-center justify-between">
                  <span className="text-sm font-medium">Review #{r.review} · {r.review_stars}★</span>
                  <span className="text-xs rounded-full bg-muted px-2 py-1">{r.status}</span>
                </header>
                <p className="text-sm">Razón: {r.reason}</p>
                <p className="text-xs text-muted-foreground">Reportado por {r.reporter_email}</p>
                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void toggleReviewVisibility(r.review, false, 'Reseña ocultada')} data-testid={`hide-${r.review}`} className="rounded bg-red-600 text-white px-3 py-1 text-xs">Ocultar reseña</button>
                    <button type="button" onClick={() => void toggleReviewVisibility(r.review, true, 'Reporte desestimado')} data-testid={`dismiss-${r.review}`} className="rounded border border-border px-3 py-1 text-xs">Mantener visible</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── General reports: users & trades ── */}
      <section className="space-y-6" data-testid="reports-section">
        <header>
          <h2 className="text-xl font-bold">Reportes de usuarios e intercambios</h2>
          <p className="text-sm text-muted-foreground">{reports.length} reportes en estado actual.</p>
        </header>

        <div className="flex gap-2 text-sm">
          {['pending', 'actioned', 'dismissed', ''].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              data-testid={`reports-filter-${s || 'all'}`}
              onClick={() => setReportFilter(s)}
              className={`rounded-full px-3 py-1 ${reportFilter === s ? 'bg-emerald-600 text-white' : 'border border-border'}`}
            >
              {s || 'Todos'}
            </button>
          ))}
        </div>

        {reports.length === 0 ? (
          <p data-testid="reports-empty" className="text-sm text-muted-foreground">No hay reportes en este estado.</p>
        ) : (
          <ul className="space-y-3" data-testid="reports-list">
            {reports.map((r) => (
              <li key={r.id} data-testid={`report-${r.id}`} className="rounded-lg border border-border p-4 space-y-2">
                <header className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {r.target_kind === 'user' ? (
                      <>Usuario <Link href={`/profile/${r.target_user}`} className="underline">#{r.target_user}</Link></>
                    ) : (
                      <>Trade #{r.target_trade}</>
                    )}
                  </span>
                  <span className="text-xs rounded-full bg-muted px-2 py-1">{r.status}</span>
                </header>
                <p className="text-sm">Motivo: {REPORT_REASON_LABELS[r.reason]}</p>
                {r.detail && <p className="text-sm text-muted-foreground">“{r.detail}”</p>}
                <p className="text-xs text-muted-foreground">
                  Reportado por {r.reporter_email}
                  {r.resolved_by_email && ` · resuelto por ${r.resolved_by_email}`}
                  {r.resolution_notes && ` — ${r.resolution_notes}`}
                </p>
                {r.status === 'pending' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" data-testid={`report-action-${r.id}`} onClick={() => void resolveReport(r.id, 'actioned', 'Atendido').catch(() => undefined)} className="rounded bg-red-600 text-white px-3 py-1 text-xs">Marcar como atendido</button>
                    <button type="button" data-testid={`report-dismiss-${r.id}`} onClick={() => void resolveReport(r.id, 'dismissed', 'Desestimado').catch(() => undefined)} className="rounded border border-border px-3 py-1 text-xs">Descartar</button>
                    {r.target_kind === 'user' && (
                      <Link href="/admin-panel/users" className="text-xs underline text-muted-foreground">Gestionar usuario →</Link>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
