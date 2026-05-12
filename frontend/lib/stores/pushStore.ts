'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

type PushState = {
  permission: PushPermission;
  subscribed: boolean;
  loading: boolean;
  error: string | null;

  detectPermission: () => void;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
};

const SW_PATH = '/sw.js';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined'
  );
}

async function ensureRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_PATH, { scope: '/' });
}

export const usePushStore = create<PushState>((set) => ({
  permission: 'default',
  subscribed: false,
  loading: false,
  error: null,

  detectPermission: () => {
    if (!isPushSupported()) {
      set({ permission: 'unsupported' });
      return;
    }
    set({ permission: Notification.permission as PushPermission });
  },

  subscribe: async () => {
    if (!isPushSupported()) {
      set({ permission: 'unsupported', error: 'unsupported' });
      return false;
    }

    set({ loading: true, error: null });
    try {
      const permission = await Notification.requestPermission();
      set({ permission: permission as PushPermission });
      if (permission !== 'granted') {
        set({ loading: false });
        return false;
      }

      const reg = await ensureRegistration();
      if (!reg) {
        set({ loading: false, error: 'no_registration' });
        return false;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
      if (!publicKey) {
        set({ loading: false, error: 'missing_vapid_key' });
        return false;
      }

      // Reuse existing subscription if present, else create a new one.
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        // PushSubscriptionOptionsInit's `applicationServerKey` expects
        // BufferSource. Pass the underlying ArrayBuffer to avoid the
        // SharedArrayBuffer-flavour mismatch that strict TS surfaces.
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
            .buffer as ArrayBuffer,
        });
      }

      const json = sub.toJSON();
      await api.post('push/subscribe/', {
        endpoint: json.endpoint,
        keys: json.keys,
      });

      set({ subscribed: true, loading: false });
      return true;
    } catch (err) {
      set({ loading: false, error: 'subscribe_failed' });
      return false;
    }
  },

  unsubscribe: async () => {
    if (!isPushSupported()) return false;
    set({ loading: true, error: null });
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) {
        set({ subscribed: false, loading: false });
        return true;
      }
      await api.post('push/unsubscribe/', { endpoint: sub.endpoint });
      await sub.unsubscribe();
      set({ subscribed: false, loading: false });
      return true;
    } catch {
      set({ loading: false, error: 'unsubscribe_failed' });
      return false;
    }
  },
}));
