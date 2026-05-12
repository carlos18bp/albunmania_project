/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('@/lib/services/http', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

import { api } from '@/lib/services/http';
import { usePresenceStore } from '../presenceStore';

const mockGet = api.get as unknown as jest.Mock;
const mockPost = api.post as unknown as jest.Mock;

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  usePresenceStore.setState({ activeCount: 0, activeCity: null });
});

describe('presenceStore', () => {
  it('posts a heartbeat on ping', async () => {
    mockPost.mockResolvedValue({ data: { ok: true } });
    await usePresenceStore.getState().ping();
    expect(mockPost).toHaveBeenCalledWith('presence/ping/');
  });

  it('swallows ping errors (not signed in)', async () => {
    mockPost.mockRejectedValue(new Error('401'));
    await expect(usePresenceStore.getState().ping()).resolves.toBeUndefined();
  });

  it('stores the active-collectors count', async () => {
    mockGet.mockResolvedValue({ data: { count: 7, city: null } });
    const count = await usePresenceStore.getState().fetchActiveCount();
    expect(count).toBe(7);
    expect(usePresenceStore.getState().activeCount).toBe(7);
  });

  it('passes the city param when scoped', async () => {
    mockGet.mockResolvedValue({ data: { count: 2, city: 'Bogotá' } });
    await usePresenceStore.getState().fetchActiveCount('Bogotá');
    expect(mockGet).toHaveBeenCalledWith('presence/active-count/', { params: { city: 'Bogotá' } });
    expect(usePresenceStore.getState().activeCity).toBe('Bogotá');
  });

  it('returns 0 on failure', async () => {
    mockGet.mockRejectedValue(new Error('boom'));
    await expect(usePresenceStore.getState().fetchActiveCount()).resolves.toBe(0);
  });
});
