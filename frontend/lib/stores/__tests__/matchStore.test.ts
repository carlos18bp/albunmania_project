/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

import { useMatchStore } from '../matchStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

const candidate = {
  user_id: 5,
  distance_km: 1.2,
  stickers_offered: [10, 11],
  stickers_wanted: [20],
  profile_preview: {
    user_id: 5, email: 'a@x.com', city: 'Bogotá',
    avatar_url: '', rating_avg: 4.8, rating_count: 12,
  },
};

beforeEach(() => {
  useMatchStore.getState().clear();
  mockApi.get.mockReset();
  mockApi.post.mockReset();
});

describe('matchStore', () => {
  it('starts with empty feed and default radius 10km', () => {
    const s = useMatchStore.getState();
    expect(s.feed).toEqual([]);
    expect(s.radiusKm).toBe(10);
  });

  it('hydrates feed from /match/feed/', async () => {
    mockApi.get.mockResolvedValue({ data: { results: [candidate] } });
    await useMatchStore.getState().fetchFeed(25);
    const s = useMatchStore.getState();
    expect(s.feed).toHaveLength(1);
    expect(s.radiusKm).toBe(25);
    expect(mockApi.get).toHaveBeenCalledWith('match/feed/', { params: { radius_km: 25 } });
  });

  it('records lastMutual when swipeLike returns mutual', async () => {
    mockApi.post.mockResolvedValue({
      data: { mutual: true, match_id: 7, trade_id: 9, created: true },
    });
    const outcome = await useMatchStore.getState().swipeLike(candidate, 10, 20);
    expect(outcome).toEqual({ mutual: true, match_id: 7, trade_id: 9, created: true });
    expect(useMatchStore.getState().lastMutual).toMatchObject({ mutual: true });
  });

  it('does not record lastMutual when swipeLike is not mutual', async () => {
    mockApi.post.mockResolvedValue({ data: { mutual: false, like_id: 3 } });
    await useMatchStore.getState().swipeLike(candidate, 10, 20);
    expect(useMatchStore.getState().lastMutual).toBeNull();
  });

  it('swipePass advances currentIndex without API call', () => {
    useMatchStore.getState().swipePass();
    expect(useMatchStore.getState().currentIndex).toBe(1);
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('records error when fetchFeed fails', async () => {
    mockApi.get.mockRejectedValue(new Error('500'));
    await expect(useMatchStore.getState().fetchFeed()).rejects.toThrow('500');
    expect(useMatchStore.getState().error).toBe('fetch_feed_failed');
  });
});
