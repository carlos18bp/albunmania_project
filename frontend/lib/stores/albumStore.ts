'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type Album = {
  id: number;
  name: string;
  slug: string;
  edition_year: number;
  total_stickers: number;
  cover_image_url: string;
  is_active?: boolean;
  launch_date?: string | null;
  end_date?: string | null;
};

export type Sticker = {
  id: number;
  album: number;
  number: string;
  name: string;
  team: string;
  image_url: string;
  is_special_edition: boolean;
  special_tier: string;
  market_value_estimate: string | number;
};

type StickerFilters = {
  team?: string;
  special?: 'true' | 'false';
  special_tier?: string;
  q?: string;
  page?: number;
};

type AlbumState = {
  albums: Album[];
  albumsLoaded: boolean;
  currentAlbum: Album | null;
  stickers: Sticker[];
  stickersLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  fetchAlbums: () => Promise<void>;
  fetchAlbum: (slug: string) => Promise<void>;
  fetchStickers: (slug: string, filters?: StickerFilters) => Promise<void>;
  searchStickers: (slug: string, query: string) => Promise<Sticker[]>;
  clear: () => void;
};

export const useAlbumStore = create<AlbumState>((set) => ({
  albums: [],
  albumsLoaded: false,
  currentAlbum: null,
  stickers: [],
  stickersLoaded: false,
  isLoading: false,
  error: null,

  fetchAlbums: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('albums/');
      set({ albums: res.data?.results ?? res.data ?? [], albumsLoaded: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'fetch_albums_failed' });
      throw err;
    }
  },

  fetchAlbum: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`albums/${slug}/`);
      set({ currentAlbum: res.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'fetch_album_failed' });
      throw err;
    }
  },

  fetchStickers: async (slug, filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`albums/${slug}/stickers/`, { params: filters });
      set({
        stickers: res.data?.results ?? res.data ?? [],
        stickersLoaded: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: 'fetch_stickers_failed' });
      throw err;
    }
  },

  searchStickers: async (slug, query) => {
    if (query.trim().length < 2) return [];
    const res = await api.get(`albums/${slug}/stickers/search/`, { params: { q: query } });
    return res.data?.results ?? res.data ?? [];
  },

  clear: () =>
    set({
      albums: [],
      albumsLoaded: false,
      currentAlbum: null,
      stickers: [],
      stickersLoaded: false,
      error: null,
    }),
}));
