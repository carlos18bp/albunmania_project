/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

import { useReviewStore } from '../reviewStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  useReviewStore.getState().clear();
  mockApi.get.mockReset();
  mockApi.post.mockReset();
  mockApi.patch.mockReset();
});

describe('reviewStore', () => {
  it('createReview POSTs to /trades/{id}/reviews/', async () => {
    mockApi.post.mockResolvedValue({ data: { id: 1, stars: 5 } });
    await useReviewStore.getState().createReview(7, { stars: 5, comment: 'X' });
    expect(mockApi.post).toHaveBeenCalledWith('trades/7/reviews/', { stars: 5, comment: 'X' });
  });

  it('records error when createReview fails', async () => {
    mockApi.post.mockRejectedValue(new Error('boom'));
    await expect(useReviewStore.getState().createReview(7, { stars: 5 })).rejects.toThrow('boom');
    expect(useReviewStore.getState().error).toBe('create_failed');
  });

  it('fetchUserReviews persists results keyed by user', async () => {
    mockApi.get.mockResolvedValue({ data: { results: [{ id: 1, stars: 4 }], total: 1 } });
    const out = await useReviewStore.getState().fetchUserReviews(99);
    expect(out.total).toBe(1);
    expect(useReviewStore.getState().byUser[99]).toHaveLength(1);
  });

  it('fetchUserSummary persists summary by user', async () => {
    mockApi.get.mockResolvedValue({ data: { user_id: 99, rating_avg: 4.5, rating_count: 2, positive_pct: 100, distribution: {}, top_tags: [] } });
    const out = await useReviewStore.getState().fetchUserSummary(99);
    expect(out.rating_avg).toBe(4.5);
    expect(useReviewStore.getState().summaryByUser[99]).toBeDefined();
  });

  it('reportReview hits /reviews/{id}/report/', async () => {
    mockApi.post.mockResolvedValue({ data: {} });
    await useReviewStore.getState().reportReview(7, 'spam');
    expect(mockApi.post).toHaveBeenCalledWith('reviews/7/report/', { reason: 'spam' });
  });
});
