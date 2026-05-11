'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type InventoryEntry = {
  id?: number;
  sticker: number;
  count: number;
  is_pasted?: boolean;
  is_repeated?: boolean;
  updated_at?: string;
};

const SYNC_DEBOUNCE_MS = 2000;

type InventoryState = {
  entries: Record<number, InventoryEntry>;
  pending: Record<number, number>;
  loaded: boolean;
  isSyncing: boolean;
  syncError: string | null;
  _timer: ReturnType<typeof setTimeout> | null;

  fetch: (albumSlug?: string) => Promise<void>;
  tap: (stickerId: number) => void;
  longPressReset: (stickerId: number) => void;
  flush: () => Promise<void>;
  clear: () => void;
};

export const useInventoryStore = create<InventoryState>((set, get) => ({
  entries: {},
  pending: {},
  loaded: false,
  isSyncing: false,
  syncError: null,
  _timer: null,

  fetch: async (albumSlug) => {
    const params: Record<string, string> = {};
    if (albumSlug) params.album_slug = albumSlug;
    const res = await api.get('inventory/', { params });
    const list: InventoryEntry[] = res.data?.results ?? res.data ?? [];
    const map: Record<number, InventoryEntry> = {};
    for (const entry of list) map[entry.sticker] = entry;
    set({ entries: map, loaded: true });
  },

  tap: (stickerId) => {
    const state = get();
    const current = state.entries[stickerId]?.count ?? 0;
    const nextCount = current + 1;
    const entries = {
      ...state.entries,
      [stickerId]: { ...(state.entries[stickerId] ?? { sticker: stickerId, count: 0 }), sticker: stickerId, count: nextCount },
    };
    const pending = { ...state.pending, [stickerId]: nextCount };

    if (state._timer) clearTimeout(state._timer);
    const timer = setTimeout(() => {
      void get().flush();
    }, SYNC_DEBOUNCE_MS);

    set({ entries, pending, _timer: timer });
  },

  longPressReset: (stickerId) => {
    const state = get();
    const entries = {
      ...state.entries,
      [stickerId]: { ...(state.entries[stickerId] ?? { sticker: stickerId, count: 0 }), sticker: stickerId, count: 0 },
    };
    const pending = { ...state.pending, [stickerId]: 0 };

    if (state._timer) clearTimeout(state._timer);
    const timer = setTimeout(() => {
      void get().flush();
    }, SYNC_DEBOUNCE_MS);

    set({ entries, pending, _timer: timer });
  },

  flush: async () => {
    const state = get();
    const items = Object.entries(state.pending).map(([sticker, count]) => ({
      sticker: Number(sticker),
      count,
    }));
    if (items.length === 0) return;

    set({ pending: {}, isSyncing: true, syncError: null, _timer: null });
    try {
      await api.post('inventory/bulk/', { items });
      set({ isSyncing: false });
    } catch (err) {
      set({ isSyncing: false, syncError: 'sync_failed' });
      throw err;
    }
  },

  clear: () => {
    const state = get();
    if (state._timer) clearTimeout(state._timer);
    set({ entries: {}, pending: {}, loaded: false, isSyncing: false, syncError: null, _timer: null });
  },
}));
