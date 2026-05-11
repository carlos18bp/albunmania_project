/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

import { useAdminStore } from '../adminStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  useAdminStore.getState().clear();
  mockApi.get.mockReset();
  mockApi.post.mockReset();
  mockApi.patch.mockReset();
});

describe('adminStore', () => {
  it('fetchUsers forwards filters and stores results', async () => {
    mockApi.get.mockResolvedValue({ data: { results: [{ id: 1, email: 'a@x.com' }], total: 1 } });
    await useAdminStore.getState().fetchUsers({ q: 'a', role: 'merchant' });
    expect(mockApi.get).toHaveBeenCalledWith('admin/users/', { params: { q: 'a', role: 'merchant' } });
    expect(useAdminStore.getState().users).toHaveLength(1);
  });

  it('assignRole POSTs and updates the row in place', async () => {
    useAdminStore.setState({
      users: [{ id: 1, email: 'a@x.com', first_name: '', last_name: '', role: 'collector', is_active: true, is_staff: false, date_joined: null, last_login: null }],
      usersTotal: 1, reviewReports: [], loading: false, error: null,
    });
    mockApi.post.mockResolvedValue({ data: { id: 1, email: 'a@x.com', role: 'merchant', is_active: true, is_staff: false, first_name: '', last_name: '', date_joined: null, last_login: null } });
    await useAdminStore.getState().assignRole(1, 'merchant');
    expect(useAdminStore.getState().users[0].role).toBe('merchant');
  });

  it('setActive POSTs and updates is_active in place', async () => {
    useAdminStore.setState({
      users: [{ id: 1, email: 'a@x.com', first_name: '', last_name: '', role: 'collector', is_active: true, is_staff: false, date_joined: null, last_login: null }],
      usersTotal: 1, reviewReports: [], loading: false, error: null,
    });
    mockApi.post.mockResolvedValue({ data: { id: 1, email: 'a@x.com', role: 'collector', is_active: false, is_staff: false, first_name: '', last_name: '', date_joined: null, last_login: null } });
    await useAdminStore.getState().setActive(1, false);
    expect(useAdminStore.getState().users[0].is_active).toBe(false);
  });

  it('toggleReviewVisibility refreshes the queue', async () => {
    mockApi.patch.mockResolvedValue({ data: {} });
    mockApi.get.mockResolvedValue({ data: { results: [] } });
    await useAdminStore.getState().toggleReviewVisibility(7, false, 'spam');
    expect(mockApi.patch).toHaveBeenCalledWith('admin/reviews/7/visibility/', {
      is_visible: false, resolution_notes: 'spam',
    });
    expect(mockApi.get).toHaveBeenCalled();
  });
});
