'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/services/tokens';

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_staff: boolean;
};

type Profile = {
  city: string;
  avatar_url: string;
  bio_short: string;
  lat_approx: string | null;
  lng_approx: string | null;
  active_album_id: number | null;
  whatsapp_optin: boolean;
  push_optin: boolean;
  browser_geo_optin: boolean;
  whatsapp_e164: string;
  rating_avg: string;
  rating_count: number;
  positive_pct: string;
  is_onboarded: boolean;
};

export type GoogleLoginError =
  | { code: 'account_too_young'; min_days: number; account_age_days: number }
  | { code: 'captcha_failed'; detail: string }
  | { code: 'unknown'; detail: string };

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  googleLogin: (args: {
    credential?: string;
    access_token?: string;
    captcha_token?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  }) => Promise<void>;
  signOut: () => void;
  syncFromCookies: () => void;
  restoreUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  applySession: (tokens: { access: string; refresh: string; user: User }) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken(),
  user: (() => { try { const d = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null; return d ? JSON.parse(d) : null; } catch { return null; } })(),
  profile: null,
  isAuthenticated: Boolean(getAccessToken()),
  
  syncFromCookies: () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    set({ accessToken, refreshToken, isAuthenticated: Boolean(accessToken) });
    if (accessToken && !get().user) {
      void get().restoreUser();
    }
  },
  
  googleLogin: async ({ credential, access_token, captcha_token, email, given_name, family_name, picture }) => {
    let response;
    try {
      response = await api.post('google_login/', {
        credential,
        access_token,
        captcha_token,
        email,
        given_name,
        family_name,
        picture,
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string; min_days?: number; account_age_days?: number; detail?: string } } };
      const status = axiosErr.response?.status;
      const data = axiosErr.response?.data ?? {};

      if (status === 403 && data.error === 'account_too_young') {
        throw {
          code: 'account_too_young' as const,
          min_days: data.min_days ?? 30,
          account_age_days: data.account_age_days ?? -1,
        };
      }
      if (status === 400 && data.error === 'captcha_failed') {
        throw { code: 'captcha_failed' as const, detail: data.detail ?? 'hCaptcha verification failed.' };
      }
      throw { code: 'unknown' as const, detail: data.detail ?? 'Google login failed.' };
    }

    const access = response.data?.access;
    const refresh = response.data?.refresh;
    const user = response.data?.user;

    if (!access || !refresh) {
      throw { code: 'unknown' as const, detail: 'Invalid token response' };
    }

    setTokens({ access, refresh });
    if (user) localStorage.setItem('user_data', JSON.stringify(user));
    set({ user, isAuthenticated: true });
    get().syncFromCookies();
    void get().refreshProfile();
  },

  refreshProfile: async () => {
    try {
      const response = await api.get('profile/me/');
      set({ profile: response.data?.profile ?? null });
    } catch {
      // Silent — profile is optional in the auth slice.
    }
  },

  signOut: () => {
    clearTokens();
    localStorage.removeItem('user_data');
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  applySession: async ({ access, refresh, user }) => {
    setTokens({ access, refresh });
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(user));
    }
    set({
      accessToken: access,
      refreshToken: refresh,
      user,
      isAuthenticated: true,
      profile: null,
    });
    await get().refreshProfile().catch(() => undefined);
  },

  restoreUser: async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const response = await api.get('validate_token/');
      const user = response.data?.user;

      if (user) {
        localStorage.setItem('user_data', JSON.stringify(user));
        set({ user, isAuthenticated: true });
      }
    } catch {
      clearTokens();
      localStorage.removeItem('user_data');
      set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
    }
  },
}));
