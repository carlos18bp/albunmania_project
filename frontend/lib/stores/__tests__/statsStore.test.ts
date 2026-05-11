/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

import { useStatsStore } from '../statsStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  useStatsStore.getState().clear();
  mockApi.get.mockReset();
});

describe('statsStore', () => {
  it('hydrates me from /stats/me/', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        album_id: 1, total_stickers: 100, pasted_count: 25, repeated_count: 5,
        completion_pct: 25.0, weekly_velocity: 7, streak_days: 3, eta_days: 75,
      },
    });
    await useStatsStore.getState().fetchMe();
    expect(useStatsStore.getState().me?.completion_pct).toBe(25.0);
  });

  it('forwards album_id and city to /stats/ranking/', async () => {
    mockApi.get.mockResolvedValue({ data: { results: [{ user_id: 1, email: 'a@x.com', city: 'Bogotá', pasted_count: 10 }] } });
    await useStatsStore.getState().fetchRanking(2, 'Bogotá');
    expect(mockApi.get).toHaveBeenCalledWith('stats/ranking/', {
      params: { album_id: 2, city: 'Bogotá' },
    });
    expect(useStatsStore.getState().ranking).toHaveLength(1);
  });

  it('records error when fetchMe fails', async () => {
    mockApi.get.mockRejectedValue(new Error('boom'));
    await expect(useStatsStore.getState().fetchMe()).rejects.toThrow('boom');
    expect(useStatsStore.getState().error).toBe('fetch_me_failed');
  });
});
