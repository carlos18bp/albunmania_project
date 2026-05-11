'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export const REVIEW_TAGS = [
  'puntual', 'cromos_buen_estado', 'buena_comunicacion',
  'amable', 'rapido', 'ubicacion_facil',
  'no_show', 'cromos_mal_estado', 'mala_comunicacion',
] as const;

export type ReviewTag = (typeof REVIEW_TAGS)[number];

export type Review = {
  id: number;
  trade: number;
  reviewer: number;
  reviewer_email: string;
  reviewee: number;
  reviewee_email: string;
  stars: number;
  comment: string;
  tags: string[];
  reply: string;
  replied_at: string | null;
  is_visible: boolean;
  is_editable: boolean;
  created_at: string;
  updated_at: string;
};

export type RatingSummary = {
  user_id: number;
  rating_avg: string | number;
  rating_count: number;
  positive_pct: string | number;
  distribution: Record<string, number>;
  top_tags: Array<{ tag: string; count: number }>;
};

type ReviewState = {
  byUser: Record<number, Review[]>;
  summaryByUser: Record<number, RatingSummary>;
  loading: boolean;
  error: string | null;

  createReview: (
    tradeId: number,
    payload: { stars: number; comment?: string; tags?: ReviewTag[] },
  ) => Promise<Review>;
  editReview: (
    reviewId: number,
    payload: Partial<{ stars: number; comment: string; tags: ReviewTag[] }>,
  ) => Promise<Review>;
  replyReview: (reviewId: number, reply: string) => Promise<Review>;
  fetchUserReviews: (
    userId: number,
    options?: { stars?: number; page?: number; pageSize?: number },
  ) => Promise<{ results: Review[]; total: number }>;
  fetchUserSummary: (userId: number) => Promise<RatingSummary>;
  reportReview: (reviewId: number, reason: string) => Promise<void>;
  clear: () => void;
};

export const useReviewStore = create<ReviewState>((set) => ({
  byUser: {},
  summaryByUser: {},
  loading: false,
  error: null,

  createReview: async (tradeId, payload) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`trades/${tradeId}/reviews/`, payload);
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({ loading: false, error: 'create_failed' });
      throw err;
    }
  },

  editReview: async (reviewId, payload) => {
    const res = await api.patch(`reviews/${reviewId}/`, payload);
    return res.data;
  },

  replyReview: async (reviewId, reply) => {
    const res = await api.post(`reviews/${reviewId}/reply/`, { reply });
    return res.data;
  },

  fetchUserReviews: async (userId, options = {}) => {
    const params: Record<string, string | number> = {};
    if (options.stars) params.stars = options.stars;
    if (options.page) params.page = options.page;
    if (options.pageSize) params.page_size = options.pageSize;
    const res = await api.get(`users/${userId}/reviews/`, { params });
    set((state) => ({
      byUser: { ...state.byUser, [userId]: res.data?.results ?? [] },
    }));
    return { results: res.data?.results ?? [], total: res.data?.total ?? 0 };
  },

  fetchUserSummary: async (userId) => {
    const res = await api.get(`users/${userId}/rating-summary/`);
    set((state) => ({
      summaryByUser: { ...state.summaryByUser, [userId]: res.data },
    }));
    return res.data;
  },

  reportReview: async (reviewId, reason) => {
    await api.post(`reviews/${reviewId}/report/`, { reason });
  },

  clear: () => set({ byUser: {}, summaryByUser: {}, loading: false, error: null }),
}));
