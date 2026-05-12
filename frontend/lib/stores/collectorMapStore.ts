'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type CollectorMapEntry = {
  user_id: number;
  display_name: string;
  city: string;
  avatar_url: string;
  lat_approx: string | number;
  lng_approx: string | number;
  rating_avg: string | number;
  rating_count: number;
  is_online: boolean;
};

export type CollectorSearchResult = {
  user_id: number;
  display_name: string;
  city: string;
  avatar_url: string;
};

type FetchArgs = { lat?: number; lng?: number; radiusKm?: number; albumId?: number | null };

type CollectorMapState = {
  entries: CollectorMapEntry[];
  loading: boolean;
  error: string | null;

  fetchCollectors: (args?: FetchArgs) => Promise<CollectorMapEntry[]>;
  searchCollectors: (query: string) => Promise<CollectorSearchResult[]>;
  clear: () => void;
};

export const useCollectorMapStore = create<CollectorMapState>((set) => ({
  entries: [],
  loading: false,
  error: null,

  fetchCollectors: async (args = {}) => {
    set({ loading: true, error: null });
    const params: Record<string, string | number> = {};
    if (args.lat != null && args.lng != null && args.radiusKm != null) {
      params.lat = args.lat;
      params.lng = args.lng;
      params.radius_km = args.radiusKm;
    }
    if (args.albumId != null) params.album_id = args.albumId;
    try {
      const res = await api.get('collectors/map/', { params });
      const entries = (res.data?.results ?? []) as CollectorMapEntry[];
      set({ entries, loading: false });
      return entries;
    } catch (err) {
      set({ loading: false, error: 'fetch_collectors_failed' });
      throw err;
    }
  },

  searchCollectors: async (query) => {
    const q = query.trim();
    if (q.length < 2) return [];
    try {
      const res = await api.get('collectors/search/', { params: { q } });
      return (res.data?.results ?? []) as CollectorSearchResult[];
    } catch {
      return [];
    }
  },

  clear: () => set({ entries: [], loading: false, error: null }),
}));
