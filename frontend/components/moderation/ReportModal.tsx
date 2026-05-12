'use client';

import { useState } from 'react';

import { useReportStore, REPORT_REASON_LABELS, type ReportReason, type ReportTargetKind } from '@/lib/stores/reportStore';

type Props = {
  targetKind: ReportTargetKind;
  targetId: number;
  targetLabel: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

const REASONS: ReportReason[] = ['no_show', 'harassment', 'fake_profile', 'inappropriate', 'other'];

export default function ReportModal({ targetKind, targetId, targetLabel, onClose, onSubmitted }: Props) {
  const submitReport = useReportStore((s) => s.submitReport);
  const [reason, setReason] = useState<ReportReason>(targetKind === 'trade' ? 'no_show' : 'fake_profile');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitReport(targetKind, targetId, reason, detail.trim() || undefined);
      setDone(true);
      onSubmitted?.();
    } catch {
      setError('No pudimos enviar el reporte. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Reportar"
      data-testid="report-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Reportar {targetLabel}</h2>
        {done ? (
          <div className="mt-3 space-y-3">
            <p data-testid="report-submitted" className="text-sm text-emerald-600">Gracias. El equipo de moderación revisará tu reporte.</p>
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <label className="block text-sm">
              Motivo
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                data-testid="report-reason"
                className="mt-1 block w-full rounded border border-input bg-background px-3 py-2"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>{REPORT_REASON_LABELS[r]}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Detalle (opcional)
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                maxLength={500}
                data-testid="report-detail"
                className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 min-h-[80px]"
              />
            </label>
            {error && <p data-testid="report-error" role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                data-testid="report-submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? 'Enviando…' : 'Enviar reporte'}
              </button>
              <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
