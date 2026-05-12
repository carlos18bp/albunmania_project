'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type NotificationKind = 'match_mutual' | 'review_received' | 'review_reply';

export type AppNotification = {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  url: string;
  actor: number | null;
  actor_email: string | null;
  match: number | null;
  review: number | null;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationState = {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  fetchNotifications: (unreadOnly?: boolean) => Promise<AppNotification[]>;
  fetchUnreadCount: () => Promise<number>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  clear: () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async (unreadOnly = false) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('notifications/', { params: unreadOnly ? { unread: 'true' } : {} });
      const items: AppNotification[] = res.data?.results ?? [];
      set({ items, loading: false });
      return items;
    } catch (err) {
      set({ loading: false, error: 'fetch_notifications_failed' });
      throw err;
    }
  },

  fetchUnreadCount: async () => {
    const res = await api.get('notifications/unread-count/');
    const count = res.data?.count ?? 0;
    set({ unreadCount: count });
    return count;
  },

  markRead: async (id) => {
    await api.post(`notifications/${id}/read/`);
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)),
      unreadCount: Math.max(0, state.unreadCount - (state.items.find((n) => n.id === id && !n.is_read) ? 1 : 0)),
    }));
  },

  markAllRead: async () => {
    await api.post('notifications/read-all/');
    const now = new Date().toISOString();
    set((state) => ({
      items: state.items.map((n) => (n.is_read ? n : { ...n, is_read: true, read_at: now })),
      unreadCount: 0,
    }));
  },

  clear: () => set({ items: [], unreadCount: 0, loading: false, error: null }),
}));
