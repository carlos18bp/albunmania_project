/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

import { useAdStore } from '../adStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  useAdStore.setState({ swipesSinceLastBanner: 0, bannersBySlot: {} });
  mockApi.get.mockReset();
});

describe('adStore', () => {
  it('records banner from /ads/serve/', async () => {
    mockApi.get.mockResolvedValue({
      status: 200,
      data: { creative: { id: 1, image_url: '', headline: '', body: '', campaign_advertiser: '' }, impression_id: 7 },
    });
    const banner = await useAdStore.getState().fetchBanner('home', 'Bogotá');
    expect(banner?.impression_id).toBe(7);
  });

  it('returns null when API responds 204', async () => {
    mockApi.get.mockResolvedValue({ status: 204, data: null });
    const banner = await useAdStore.getState().fetchBanner('home');
    expect(banner).toBeNull();
  });

  it('noteSwipe returns true once every 5 swipes', () => {
    const store = useAdStore.getState();
    expect([store.noteSwipe(), store.noteSwipe(), store.noteSwipe(), store.noteSwipe()]).toEqual([
      false, false, false, false,
    ]);
    expect(store.noteSwipe()).toBe(true);
    expect(store.noteSwipe()).toBe(false);
  });

  it('clickUrl points at /api/ads/click/{id}/', () => {
    expect(useAdStore.getState().clickUrl(42)).toMatch(/\/ads\/click\/42\/$/);
  });
});
