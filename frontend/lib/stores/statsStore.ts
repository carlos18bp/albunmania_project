'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type CollectorStats = {
  album_id: number | null;
  total_stickers: number;
  pasted_count: number;
  repeated_count: number;
  completion_pct: number;
  weekly_velocity: number;
  streak_days: number;
  eta_days: number | null;
};

export type RankingEntry = {
  user_id: number;
  email: string;
  city: string;
  pasted_count: number;
  is_online: boolean;
};

type StatsState = {
  me: CollectorStats | null;
  ranking: RankingEntry[];
  loading: boolean;
  error: string | null;

  fetchMe: () => Promise<void>;
  fetchRanking: (albumId: number, city: string) => Promise<void>;
  clear: () => void;
};

export const useStatsStore = create<StatsState>((set) => ({
  me: null,
  ranking: [],
  loading: false,
  error: null,

  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('stats/me/');
      set({ me: res.data, loading: false });
    } catch (err) {
      set({ loading: false, error: 'fetch_me_failed' });
      throw err;
    }
  },

  fetchRanking: async (albumId, city) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('stats/ranking/', { params: { album_id: albumId, city } });
      set({ ranking: res.data?.results ?? [], loading: false });
    } catch (err) {
      set({ loading: false, error: 'fetch_ranking_failed' });
      throw err;
    }
  },

  clear: () => set({ me: null, ranking: [], loading: false, error: null }),
}));
