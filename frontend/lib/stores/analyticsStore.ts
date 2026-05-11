'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type CommunityKpis = {
  window_since: string;
  active_users: number;
  new_users: number;
  matches_in_window: number;
  trades_completed: number;
  avg_rating_overall: number;
};

export type AdKpis = {
  window_since: string;
  impressions: number;
  clicks: number;
  ctr: number;
  top_cities: Array<{ city: string; impressions: number }>;
};

export type StickerStat = {
  sticker_id: number;
  number: string;
  name: string;
  team: string;
  count: number;
};

export type AnalyticsOverview = {
  community: CommunityKpis;
  ads: AdKpis;
  returning_vs_new: { window_since: string; new: number; returning: number };
  devices: Array<{ device: string; pct: number }>;
  top_stickers: { most_offered: StickerStat[]; most_wanted: StickerStat[] };
  matches_trend: Array<{ day: string; matches: number; trades: number }>;
  heatmap: Array<{ lat: number; lng: number; weight: number }>;
};

const API_BASE = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) || '/api';

type AnalyticsState = {
  overview: AnalyticsOverview | null;
  loading: boolean;
  error: string | null;

  fetchOverview: (albumId?: number) => Promise<void>;
  exportCsvUrl: () => string;
  clear: () => void;
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  overview: null,
  loading: false,
  error: null,

  fetchOverview: async (albumId) => {
    set({ loading: true, error: null });
    try {
      const params: Record<string, number> = {};
      if (albumId) params.album_id = albumId;
      const res = await api.get('admin/analytics/overview/', { params });
      set({ overview: res.data, loading: false });
    } catch (err) {
      set({ loading: false, error: 'fetch_overview_failed' });
      throw err;
    }
  },

  exportCsvUrl: () => `${API_BASE.replace(/\/$/, '')}/admin/analytics/export.csv`,

  clear: () => set({ overview: null, loading: false, error: null }),
}));
