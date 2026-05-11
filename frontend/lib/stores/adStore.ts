'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type AdCreative = {
  id: number;
  image_url: string;
  headline: string;
  body: string;
  campaign_advertiser: string;
};

export type ServedBanner = {
  creative: AdCreative;
  impression_id: number;
};

const FREQUENCY_CAP_SWIPES = 5;
const API_BASE_FOR_CLICK =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  '/api';

type AdState = {
  swipesSinceLastBanner: number;
  bannersBySlot: Record<string, ServedBanner | null>;

  fetchBanner: (slot: 'home' | 'feed', city?: string) => Promise<ServedBanner | null>;
  noteSwipe: () => boolean;
  resetSwipeCounter: () => void;
  clickUrl: (impressionId: number) => string;
};

export const useAdStore = create<AdState>((set, get) => ({
  swipesSinceLastBanner: 0,
  bannersBySlot: {},

  fetchBanner: async (slot, city) => {
    try {
      const res = await api.get('ads/serve/', { params: { slot, ...(city ? { city } : {}) } });
      if (res.status === 204 || !res.data) {
        set((state) => ({ bannersBySlot: { ...state.bannersBySlot, [slot]: null } }));
        return null;
      }
      const banner: ServedBanner = res.data;
      set((state) => ({ bannersBySlot: { ...state.bannersBySlot, [slot]: banner } }));
      return banner;
    } catch {
      return null;
    }
  },

  /**
   * Increment the swipe counter; return true if a banner should be
   * shown after this swipe (1 every FREQUENCY_CAP_SWIPES swipes).
   */
  noteSwipe: () => {
    const next = get().swipesSinceLastBanner + 1;
    if (next >= FREQUENCY_CAP_SWIPES) {
      set({ swipesSinceLastBanner: 0 });
      return true;
    }
    set({ swipesSinceLastBanner: next });
    return false;
  },

  resetSwipeCounter: () => set({ swipesSinceLastBanner: 0 }),

  clickUrl: (impressionId) => `${API_BASE_FOR_CLICK.replace(/\/$/, '')}/ads/click/${impressionId}/`,
}));
