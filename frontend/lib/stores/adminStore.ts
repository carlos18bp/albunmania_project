'use client';

import { create } from 'zustand';

import { api } from '@/lib/services/http';

export type AdminUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string | null;
  last_login: string | null;
};

export type ReviewReport = {
  id: number;
  review: number;
  review_stars: number;
  reporter: number;
  reporter_email: string;
  reason: string;
  status: 'pending' | 'dismissed' | 'actioned';
  resolved_by: number | null;
  resolved_at: string | null;
  resolution_notes: string;
  created_at: string;
};

type AdminState = {
  users: AdminUser[];
  usersTotal: number;
  reviewReports: ReviewReport[];
  loading: boolean;
  error: string | null;

  fetchUsers: (
    params?: { q?: string; role?: string; page?: number; pageSize?: number },
  ) => Promise<void>;
  assignRole: (userId: number, role: string) => Promise<AdminUser>;
  setActive: (userId: number, isActive: boolean) => Promise<AdminUser>;
  loginAsUser: (userId: number) => Promise<{ access: string; refresh: string; user: AdminUser }>;
  fetchReviewReports: (status?: string) => Promise<void>;
  toggleReviewVisibility: (
    reviewId: number, isVisible: boolean, notes?: string,
  ) => Promise<void>;
  clear: () => void;
};

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  usersTotal: 0,
  reviewReports: [],
  loading: false,
  error: null,

  fetchUsers: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const apiParams: Record<string, string | number> = {};
      if (params.q) apiParams.q = params.q;
      if (params.role) apiParams.role = params.role;
      if (params.page) apiParams.page = params.page;
      if (params.pageSize) apiParams.page_size = params.pageSize;
      const res = await api.get('admin/users/', { params: apiParams });
      set({
        users: res.data?.results ?? [],
        usersTotal: res.data?.total ?? 0,
        loading: false,
      });
    } catch (err) {
      set({ loading: false, error: 'fetch_users_failed' });
      throw err;
    }
  },

  assignRole: async (userId, role) => {
    const res = await api.post(`admin/users/${userId}/role/`, { role });
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? res.data : u)),
    }));
    return res.data;
  },

  setActive: async (userId, isActive) => {
    const res = await api.post(`admin/users/${userId}/active/`, { is_active: isActive });
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? res.data : u)),
    }));
    return res.data;
  },

  loginAsUser: async (userId) => {
    const res = await api.post(`admin/users/${userId}/login_as/`);
    return res.data;
  },

  fetchReviewReports: async (statusFilter) => {
    set({ loading: true, error: null });
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('admin/reviews/reports/', { params });
      set({ reviewReports: res.data?.results ?? [], loading: false });
    } catch (err) {
      set({ loading: false, error: 'fetch_reports_failed' });
      throw err;
    }
  },

  toggleReviewVisibility: async (reviewId, isVisible, notes = '') => {
    await api.patch(`admin/reviews/${reviewId}/visibility/`, {
      is_visible: isVisible,
      resolution_notes: notes,
    });
    // Refresh the moderation queue after the action.
    await get().fetchReviewReports();
  },

  clear: () => set({
    users: [], usersTotal: 0, reviewReports: [], loading: false, error: null,
  }),
}));
