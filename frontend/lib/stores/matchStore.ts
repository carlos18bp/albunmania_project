'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type ProfilePreview = {
  user_id: number;
  email: string;
  city: string;
  avatar_url: string;
  rating_avg: string | number;
  rating_count: number;
  is_online?: boolean;
};

export type MatchCandidate = {
  user_id: number;
  distance_km: number;
  stickers_offered: number[];
  stickers_wanted: number[];
  profile_preview: ProfilePreview;
};

export type MatchSummary = {
  id: number;
  channel: 'swipe' | 'qr_presencial';
  status: 'mutual' | 'confirmed' | 'cancelled' | 'expired';
  created_at: string;
  last_event_at: string;
  other_user_id: number;
  trade?: {
    id: number;
    items: Array<{ from_user: number; to_user: number; sticker_id: number }>;
    status: 'open' | 'completed' | 'cancelled';
  };
};

export type LikeOutcome =
  | { mutual: false; like_id: number }
  | { mutual: true; match_id: number; trade_id: number; created: boolean };

type MatchState = {
  feed: MatchCandidate[];
  currentIndex: number;
  myMatches: MatchSummary[];
  radiusKm: number;
  loading: boolean;
  error: string | null;
  lastMutual: LikeOutcome | null;

  setRadius: (km: number) => void;
  fetchFeed: (radiusKm?: number) => Promise<void>;
  swipeLike: (
    candidate: MatchCandidate,
    stickerOffered: number,
    stickerWanted: number,
  ) => Promise<LikeOutcome>;
  swipePass: () => void;
  fetchMine: (statusFilter?: MatchSummary['status']) => Promise<void>;
  clearLastMutual: () => void;
  clear: () => void;
};

export const useMatchStore = create<MatchState>((set, get) => ({
  feed: [],
  currentIndex: 0,
  myMatches: [],
  radiusKm: 10,
  loading: false,
  error: null,
  lastMutual: null,

  setRadius: (km) => set({ radiusKm: km }),

  fetchFeed: async (radiusKm) => {
    const r = radiusKm ?? get().radiusKm;
    set({ loading: true, error: null });
    try {
      const res = await api.get('match/feed/', { params: { radius_km: r } });
      set({
        feed: res.data?.results ?? [],
        currentIndex: 0,
        loading: false,
        radiusKm: r,
      });
    } catch (err) {
      set({ loading: false, error: 'fetch_feed_failed' });
      throw err;
    }
  },

  swipeLike: async (candidate, stickerOffered, stickerWanted) => {
    const res = await api.post('match/like/', {
      to_user: candidate.user_id,
      sticker_offered: stickerOffered,
      sticker_wanted: stickerWanted,
    });
    const outcome: LikeOutcome = res.data;
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      lastMutual: outcome.mutual ? outcome : state.lastMutual,
    }));
    return outcome;
  },

  swipePass: () => {
    set((state) => ({ currentIndex: state.currentIndex + 1 }));
  },

  fetchMine: async (statusFilter) => {
    set({ loading: true, error: null });
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('match/mine/', { params });
      set({ myMatches: res.data?.results ?? [], loading: false });
    } catch (err) {
      set({ loading: false, error: 'fetch_mine_failed' });
      throw err;
    }
  },

  clearLastMutual: () => set({ lastMutual: null }),

  clear: () =>
    set({
      feed: [],
      currentIndex: 0,
      myMatches: [],
      loading: false,
      error: null,
      lastMutual: null,
    }),
}));
