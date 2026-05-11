'use client';

import { get as idbGet, set as idbSet } from 'idb-keyval';
import { create } from 'zustand';

import { api } from '@/lib/services/http';
import type { ProfilePreview } from '@/lib/stores/matchStore';

export type InventorySnapshotEntry = { sticker_id: number; count: number };

export type CrossSide = { sticker_id: number };
export type CrossResult = { a_to_b: CrossSide[]; b_to_a: CrossSide[] };

export type QRToken = { token: string; expires_at: number };

const STORAGE_KEYS = {
  myInventory: 'qr:my-inventory',
  lastCross: 'qr:last-cross',
} as const;

const isBrowser = typeof window !== 'undefined';

/** Pure client-side mirror of `qr_cross.compute_offline_cross` (server). */
export function computeOfflineCross(
  a: InventorySnapshotEntry[],
  b: InventorySnapshotEntry[],
): CrossResult {
  const indexA = new Map<number, number>();
  const indexB = new Map<number, number>();
  for (const e of a) {
    if (e.count >= 0) indexA.set(e.sticker_id, Math.max(indexA.get(e.sticker_id) ?? 0, e.count));
  }
  for (const e of b) {
    if (e.count >= 0) indexB.set(e.sticker_id, Math.max(indexB.get(e.sticker_id) ?? 0, e.count));
  }

  const a_to_b: CrossSide[] = [];
  const b_to_a: CrossSide[] = [];
  for (const [sid, count] of indexA) {
    if (count >= 2 && (indexB.get(sid) ?? 0) === 0) a_to_b.push({ sticker_id: sid });
  }
  for (const [sid, count] of indexB) {
    if (count >= 2 && (indexA.get(sid) ?? 0) === 0) b_to_a.push({ sticker_id: sid });
  }
  a_to_b.sort((x, y) => x.sticker_id - y.sticker_id);
  b_to_a.sort((x, y) => x.sticker_id - y.sticker_id);
  return { a_to_b, b_to_a };
}

type QRState = {
  myToken: QRToken | null;
  scannedUserId: number | null;
  scannedProfile: ProfilePreview | null;
  myInventoryCache: InventorySnapshotEntry[];
  lastCross: CrossResult | null;
  loading: boolean;
  error: string | null;

  fetchMyToken: () => Promise<QRToken>;
  scan: (token: string) => Promise<{ user_id: number; profile_preview: ProfilePreview }>;
  cacheMyInventory: (entries: InventorySnapshotEntry[]) => Promise<void>;
  loadMyInventoryFromIDB: () => Promise<InventorySnapshotEntry[]>;
  computeCrossOffline: (
    theirInventory: InventorySnapshotEntry[],
  ) => Promise<CrossResult>;
  confirm: (
    otherUserId: number,
    items: Array<{ from_user: number; to_user: number; sticker_id: number }>,
  ) => Promise<{ match_id: number; trade_id: number }>;
  clear: () => void;
};

export const useQRStore = create<QRState>((set, get) => ({
  myToken: null,
  scannedUserId: null,
  scannedProfile: null,
  myInventoryCache: [],
  lastCross: null,
  loading: false,
  error: null,

  fetchMyToken: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('match/qr/me/');
      const token: QRToken = { token: res.data.token, expires_at: res.data.expires_at };
      set({ myToken: token, loading: false });
      return token;
    } catch (err) {
      set({ loading: false, error: 'qr_token_failed' });
      throw err;
    }
  },

  scan: async (token) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('match/qr/scan/', { token });
      set({
        scannedUserId: res.data.user_id,
        scannedProfile: res.data.profile_preview,
        loading: false,
      });
      return res.data;
    } catch (err) {
      set({ loading: false, error: 'qr_scan_failed' });
      throw err;
    }
  },

  cacheMyInventory: async (entries) => {
    set({ myInventoryCache: entries });
    if (isBrowser) await idbSet(STORAGE_KEYS.myInventory, entries);
  },

  loadMyInventoryFromIDB: async () => {
    if (!isBrowser) return [];
    const entries = (await idbGet<InventorySnapshotEntry[]>(STORAGE_KEYS.myInventory)) ?? [];
    set({ myInventoryCache: entries });
    return entries;
  },

  computeCrossOffline: async (theirInventory) => {
    const mine = get().myInventoryCache.length
      ? get().myInventoryCache
      : await get().loadMyInventoryFromIDB();
    const cross = computeOfflineCross(mine, theirInventory);
    set({ lastCross: cross });
    if (isBrowser) await idbSet(STORAGE_KEYS.lastCross, cross);
    return cross;
  },

  confirm: async (otherUserId, items) => {
    const res = await api.post('match/qr/confirm/', { other_user: otherUserId, items });
    return res.data;
  },

  clear: () =>
    set({
      myToken: null,
      scannedUserId: null,
      scannedProfile: null,
      myInventoryCache: [],
      lastCross: null,
      loading: false,
      error: null,
    }),
}));
