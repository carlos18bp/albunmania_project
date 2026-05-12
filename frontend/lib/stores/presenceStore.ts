'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

type PresenceState = {
  /** Collectors active "right now" (last reported by GET /presence/active-count/). */
  activeCount: number;
  activeCity: string | null;

  /** Heartbeat — ignores errors (a 401 just means we're not signed in). */
  ping: () => Promise<void>;
  fetchActiveCount: (city?: string) => Promise<number>;
};

export const usePresenceStore = create<PresenceState>((set) => ({
  activeCount: 0,
  activeCity: null,

  ping: async () => {
    try {
      await api.post('presence/ping/');
    } catch {
      /* not signed in / offline — ignore */
    }
  },

  fetchActiveCount: async (city) => {
    try {
      const res = await api.get('presence/active-count/', { params: city ? { city } : {} });
      const count = Number(res.data?.count ?? 0);
      set({ activeCount: count, activeCity: city ?? null });
      return count;
    } catch {
      return 0;
    }
  },
}));
