'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type Merchant = {
  user_id: number;
  business_name: string;
  business_type: string;
  address: string;
  lat: string | number;
  lng: string | number;
  opening_hours: Record<string, string>;
  is_listing_visible: boolean;
};

export type MerchantDashboard = {
  business_name: string;
  business_type: string;
  address: string;
  lat: string | number | null;
  lng: string | number | null;
  opening_hours: Record<string, string>;
  declared_stock: string;
  subscription_status: string;
  subscription_expires_at: string | null;
};

type Filters = {
  city?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
};

type MerchantState = {
  list: Merchant[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  dashboard: MerchantDashboard | null;

  fetchList: (filters?: Filters) => Promise<void>;
  fetchDashboard: () => Promise<void>;
  updateDashboard: (patch: Partial<MerchantDashboard>) => Promise<void>;
  clear: () => void;
};

export const useMerchantStore = create<MerchantState>((set) => ({
  list: [],
  loaded: false,
  loading: false,
  error: null,
  dashboard: null,

  fetchList: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('merchants/', { params: filters });
      set({ list: res.data?.results ?? [], loaded: true, loading: false });
    } catch (err) {
      set({ loading: false, error: 'fetch_list_failed' });
      throw err;
    }
  },

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('merchants/me/');
      set({ dashboard: res.data, loading: false });
    } catch (err) {
      set({ loading: false, error: 'fetch_dashboard_failed' });
      throw err;
    }
  },

  updateDashboard: async (patch) => {
    set({ loading: true, error: null });
    try {
      const res = await api.patch('merchants/me/', patch);
      set({ dashboard: res.data, loading: false });
    } catch (err) {
      set({ loading: false, error: 'update_dashboard_failed' });
      throw err;
    }
  },

  clear: () => set({ list: [], loaded: false, loading: false, error: null, dashboard: null }),
}));
