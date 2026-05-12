'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type PublicProfile = {
  user_id: number;
  display_name: string;
  city: string;
  avatar_url: string;
  bio_short: string;
  rating_avg: string | number;
  rating_count: number;
  positive_pct: string | number;
  album_completion_pct: string | number;
  trades_completed_count: number;
};

export type AccountSettings = {
  city: string;
  bio_short: string;
  push_optin: boolean;
  whatsapp_optin: boolean;
  whatsapp_e164: string;
};

type ProfileState = {
  publicByUser: Record<number, PublicProfile>;
  /** The current user's editable settings (from GET /profile/me/). */
  mySettings: AccountSettings | null;
  loading: boolean;
  error: string | null;

  fetchPublicProfile: (userId: number) => Promise<PublicProfile>;
  fetchMySettings: () => Promise<AccountSettings>;
  updateMySettings: (patch: Partial<AccountSettings>) => Promise<AccountSettings>;
  clear: () => void;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  publicByUser: {},
  mySettings: null,
  loading: false,
  error: null,

  fetchPublicProfile: async (userId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`users/${userId}/public-profile/`);
      set((state) => ({ publicByUser: { ...state.publicByUser, [userId]: res.data }, loading: false }));
      return res.data as PublicProfile;
    } catch (err) {
      set({ loading: false, error: 'fetch_public_profile_failed' });
      throw err;
    }
  },

  fetchMySettings: async () => {
    const res = await api.get('profile/me/');
    const p = res.data?.profile ?? {};
    const settings: AccountSettings = {
      city: p.city ?? '',
      bio_short: p.bio_short ?? '',
      push_optin: Boolean(p.push_optin),
      whatsapp_optin: Boolean(p.whatsapp_optin),
      whatsapp_e164: p.whatsapp_e164 ?? '',
    };
    set({ mySettings: settings });
    return settings;
  },

  updateMySettings: async (patch) => {
    const res = await api.patch('profile/me/', patch);
    const p = res.data?.profile ?? {};
    const settings: AccountSettings = {
      city: p.city ?? '',
      bio_short: p.bio_short ?? '',
      push_optin: Boolean(p.push_optin),
      whatsapp_optin: Boolean(p.whatsapp_optin),
      whatsapp_e164: p.whatsapp_e164 ?? '',
    };
    set({ mySettings: settings });
    return settings;
  },

  clear: () => set({ publicByUser: {}, mySettings: null, loading: false, error: null }),
}));
