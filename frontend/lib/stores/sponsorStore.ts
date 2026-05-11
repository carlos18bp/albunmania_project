'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type Sponsor = {
  id: number;
  brand_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  message_text: string;
  active_from: string;
  active_until: string;
  is_currently_active: boolean;
};

type SponsorState = {
  sponsor: Sponsor | null;
  loaded: boolean;
  fetchActive: () => Promise<void>;
  clear: () => void;
};

export const useSponsorStore = create<SponsorState>((set) => ({
  sponsor: null,
  loaded: false,

  fetchActive: async () => {
    try {
      const res = await api.get('sponsor/active/');
      set({ sponsor: res.data?.active ?? null, loaded: true });
    } catch {
      set({ sponsor: null, loaded: true });
    }
  },

  clear: () => set({ sponsor: null, loaded: false }),
}));
