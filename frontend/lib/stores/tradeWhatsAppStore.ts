'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

type OptInState = {
  opted_in: boolean;
  both_opted_in: boolean;
};

type TradeWhatsAppState = {
  optInByTrade: Record<number, OptInState>;
  linkByTrade: Record<number, string>;
  loading: boolean;
  error: string | null;

  setOptIn: (tradeId: number, optedIn: boolean) => Promise<OptInState>;
  fetchLink: (tradeId: number) => Promise<string | null>;
  clear: () => void;
};

export const useTradeWhatsAppStore = create<TradeWhatsAppState>((set) => ({
  optInByTrade: {},
  linkByTrade: {},
  loading: false,
  error: null,

  setOptIn: async (tradeId, optedIn) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`trade/${tradeId}/whatsapp-optin/`, { opted_in: optedIn });
      const value: OptInState = res.data;
      set((state) => ({
        loading: false,
        optInByTrade: { ...state.optInByTrade, [tradeId]: value },
      }));
      return value;
    } catch (err) {
      set({ loading: false, error: 'optin_failed' });
      throw err;
    }
  },

  fetchLink: async (tradeId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`trade/${tradeId}/whatsapp-link/`);
      const link: string = res.data.wa_link;
      set((state) => ({
        loading: false,
        linkByTrade: { ...state.linkByTrade, [tradeId]: link },
      }));
      return link;
    } catch (err) {
      set({ loading: false, error: 'link_blocked' });
      return null;
    }
  },

  clear: () => set({ optInByTrade: {}, linkByTrade: {}, loading: false, error: null }),
}));
