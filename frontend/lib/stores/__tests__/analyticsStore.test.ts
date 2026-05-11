/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

import { useAnalyticsStore } from '../analyticsStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  useAnalyticsStore.getState().clear();
  mockApi.get.mockReset();
});

describe('analyticsStore', () => {
  it('hydrates overview from /admin/analytics/overview/', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        community: { window_since: '2026-04-11', active_users: 5, new_users: 2, matches_in_window: 3, trades_completed: 1, avg_rating_overall: 4.2 },
        ads: { window_since: '2026-04-11', impressions: 100, clicks: 8, ctr: 0.08, top_cities: [] },
        returning_vs_new: { window_since: '2026-04-11', new: 2, returning: 3 },
        devices: [{ device: 'mobile', pct: 80 }],
        top_stickers: { most_offered: [], most_wanted: [] },
        matches_trend: [],
        heatmap: [],
      },
    });
    await useAnalyticsStore.getState().fetchOverview();
    expect(useAnalyticsStore.getState().overview?.community.active_users).toBe(5);
  });

  it('forwards album_id when provided', async () => {
    mockApi.get.mockResolvedValue({ data: {} });
    await useAnalyticsStore.getState().fetchOverview(7);
    expect(mockApi.get).toHaveBeenCalledWith('admin/analytics/overview/', { params: { album_id: 7 } });
  });

  it('records error when fetchOverview fails', async () => {
    mockApi.get.mockRejectedValue(new Error('boom'));
    await expect(useAnalyticsStore.getState().fetchOverview()).rejects.toThrow('boom');
    expect(useAnalyticsStore.getState().error).toBe('fetch_overview_failed');
  });

  it('exportCsvUrl points at /api/admin/analytics/export.csv', () => {
    expect(useAnalyticsStore.getState().exportCsvUrl()).toMatch(/admin\/analytics\/export\.csv$/);
  });
});
