'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type ReportTargetKind = 'user' | 'trade';
export type ReportReason = 'no_show' | 'harassment' | 'fake_profile' | 'inappropriate' | 'other';
export type ReportStatus = 'pending' | 'dismissed' | 'actioned';

export type Report = {
  id: number;
  reporter: number;
  reporter_email: string;
  target_kind: ReportTargetKind;
  target_user: number | null;
  target_trade: number | null;
  reason: ReportReason;
  detail: string;
  status: ReportStatus;
  resolved_by: number | null;
  resolved_by_email: string | null;
  resolved_at: string | null;
  resolution_notes: string;
  created_at: string;
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  no_show: 'No-show (no apareció al intercambio)',
  harassment: 'Acoso o trato abusivo',
  fake_profile: 'Perfil falso',
  inappropriate: 'Contenido inapropiado',
  other: 'Otro',
};

type ReportState = {
  // Admin queue.
  reports: Report[];
  loading: boolean;
  error: string | null;

  // User side.
  submitReport: (
    targetKind: ReportTargetKind, targetId: number, reason: ReportReason, detail?: string,
  ) => Promise<Report>;

  // Admin side.
  fetchReports: (params?: { status?: string; kind?: string }) => Promise<Report[]>;
  resolveReport: (reportId: number, status: 'dismissed' | 'actioned', notes?: string) => Promise<Report>;
  clear: () => void;
};

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  loading: false,
  error: null,

  submitReport: async (targetKind, targetId, reason, detail = '') => {
    const res = await api.post('reports/', { target_kind: targetKind, target_id: targetId, reason, detail });
    return res.data as Report;
  },

  fetchReports: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const apiParams: Record<string, string> = {};
      if (params.status) apiParams.status = params.status;
      if (params.kind) apiParams.kind = params.kind;
      const res = await api.get('admin/reports/', { params: apiParams });
      const reports: Report[] = res.data?.results ?? [];
      set({ reports, loading: false });
      return reports;
    } catch (err) {
      set({ loading: false, error: 'fetch_reports_failed' });
      throw err;
    }
  },

  resolveReport: async (reportId, status, notes = '') => {
    const res = await api.patch(`admin/reports/${reportId}/`, { status, resolution_notes: notes });
    set((state) => ({ reports: state.reports.map((r) => (r.id === reportId ? res.data : r)) }));
    return res.data as Report;
  },

  clear: () => set({ reports: [], loading: false, error: null }),
}));
