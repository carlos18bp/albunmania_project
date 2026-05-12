'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';
import { useAuthStore } from '@/lib/stores/authStore';

export type OnboardingStep = 'album' | 'geo' | 'permissions' | 'done';

type OnboardingState = {
  step: OnboardingStep;
  activeAlbumId: number | null;
  city: string;
  latApprox: number | null;
  lngApprox: number | null;
  browserGeoOptin: boolean;
  pushOptin: boolean;
  whatsappOptin: boolean;
  whatsappE164: string;
  isSubmitting: boolean;
  errorMessage: string | null;

  setActiveAlbum: (id: number | null) => void;
  setGeo: (args: { lat: number; lng: number; city?: string }) => void;
  /** Pre-fill the approximate location from an IP lookup (does NOT set browser_geo_optin). */
  setGeoFromIp: (args: { lat: number; lng: number; city?: string }) => void;
  setBrowserGeoOptin: (value: boolean) => void;
  setPushOptin: (value: boolean) => void;
  setWhatsAppOptin: (value: boolean) => void;
  setWhatsAppE164: (value: string) => void;

  goToStep: (step: OnboardingStep) => void;
  next: () => void;
  back: () => void;

  submit: () => Promise<void>;
  reset: () => void;
};

const STEP_ORDER: OnboardingStep[] = ['album', 'geo', 'permissions', 'done'];

const INITIAL_STATE = {
  step: 'album' as OnboardingStep,
  activeAlbumId: null as number | null,
  city: '',
  latApprox: null as number | null,
  lngApprox: null as number | null,
  browserGeoOptin: false,
  pushOptin: false,
  whatsappOptin: false,
  whatsappE164: '',
  isSubmitting: false,
  errorMessage: null as string | null,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...INITIAL_STATE,

  setActiveAlbum: (id) => set({ activeAlbumId: id }),
  setGeo: ({ lat, lng, city }) =>
    set({ latApprox: lat, lngApprox: lng, browserGeoOptin: true, city: city ?? get().city }),
  setGeoFromIp: ({ lat, lng, city }) =>
    set({ latApprox: lat, lngApprox: lng, city: city || get().city }),
  setBrowserGeoOptin: (value) => set({ browserGeoOptin: value }),
  setPushOptin: (value) => set({ pushOptin: value }),
  setWhatsAppOptin: (value) => set({ whatsappOptin: value }),
  setWhatsAppE164: (value) => set({ whatsappE164: value }),

  goToStep: (step) => set({ step }),
  next: () => {
    const idx = STEP_ORDER.indexOf(get().step);
    const nextIdx = Math.min(idx + 1, STEP_ORDER.length - 1);
    set({ step: STEP_ORDER[nextIdx] });
  },
  back: () => {
    const idx = STEP_ORDER.indexOf(get().step);
    const prevIdx = Math.max(idx - 1, 0);
    set({ step: STEP_ORDER[prevIdx] });
  },

  submit: async () => {
    const state = get();

    if (state.whatsappOptin && !state.whatsappE164) {
      set({ errorMessage: 'whatsapp_e164_required' });
      throw new Error('whatsapp_e164_required');
    }

    set({ isSubmitting: true, errorMessage: null });
    try {
      await api.patch('profile/me/onboarding/', {
        active_album_id: state.activeAlbumId,
        city: state.city || undefined,
        lat_approx: state.latApprox?.toFixed(6),
        lng_approx: state.lngApprox?.toFixed(6),
        browser_geo_optin: state.browserGeoOptin,
        push_optin: state.pushOptin,
        whatsapp_optin: state.whatsappOptin,
        whatsapp_e164: state.whatsappE164 || undefined,
      });
      set({ step: 'done', isSubmitting: false });
      void useAuthStore.getState().refreshProfile();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, unknown> } };
      const detail = axiosErr.response?.data;
      set({
        isSubmitting: false,
        errorMessage: detail ? JSON.stringify(detail) : 'submit_failed',
      });
      throw err;
    }
  },

  reset: () => set({ ...INITIAL_STATE }),
}));
