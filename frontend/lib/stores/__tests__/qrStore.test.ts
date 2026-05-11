/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

import { computeOfflineCross, useQRStore } from '../qrStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('idb-keyval', () => ({
  get: jest.fn().mockResolvedValue(undefined),
  set: jest.fn().mockResolvedValue(undefined),
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  useQRStore.getState().clear();
  mockApi.get.mockReset();
  mockApi.post.mockReset();
});

describe('computeOfflineCross', () => {
  it('returns empty cross when both inventories are empty', () => {
    expect(computeOfflineCross([], [])).toEqual({ a_to_b: [], b_to_a: [] });
  });

  it('mirrors the server qr_cross output for a symmetric swap', () => {
    const a = [{ sticker_id: 1, count: 2 }, { sticker_id: 2, count: 0 }];
    const b = [{ sticker_id: 1, count: 0 }, { sticker_id: 2, count: 2 }];
    expect(computeOfflineCross(a, b)).toEqual({
      a_to_b: [{ sticker_id: 1 }],
      b_to_a: [{ sticker_id: 2 }],
    });
  });

  it('returns sticker ids sorted ascending', () => {
    const a = [{ sticker_id: 9, count: 2 }, { sticker_id: 3, count: 2 }];
    const b = [{ sticker_id: 9, count: 0 }, { sticker_id: 3, count: 0 }];
    expect(computeOfflineCross(a, b).a_to_b.map((c) => c.sticker_id)).toEqual([3, 9]);
  });

  it('does not offer pasted stickers (count=1)', () => {
    const a = [{ sticker_id: 5, count: 1 }];
    const b = [{ sticker_id: 5, count: 0 }];
    expect(computeOfflineCross(a, b)).toEqual({ a_to_b: [], b_to_a: [] });
  });
});

describe('qrStore actions', () => {
  it('persists the QR token returned by /match/qr/me/', async () => {
    mockApi.get.mockResolvedValue({ data: { token: 'abc.def', expires_at: 9999 } });
    const t = await useQRStore.getState().fetchMyToken();
    expect(t).toEqual({ token: 'abc.def', expires_at: 9999 });
    expect(useQRStore.getState().myToken?.token).toBe('abc.def');
  });

  it('records scanned user and profile on /match/qr/scan/', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        user_id: 42,
        profile_preview: { user_id: 42, email: 'x@x.com', city: '', avatar_url: '', rating_avg: 0, rating_count: 0 },
      },
    });
    await useQRStore.getState().scan('token');
    expect(useQRStore.getState().scannedUserId).toBe(42);
  });

  it('computeCrossOffline uses the cached inventory and stores lastCross', async () => {
    await useQRStore.getState().cacheMyInventory([
      { sticker_id: 1, count: 2 }, { sticker_id: 2, count: 0 },
    ]);
    const cross = await useQRStore.getState().computeCrossOffline([
      { sticker_id: 1, count: 0 }, { sticker_id: 2, count: 2 },
    ]);
    expect(cross.a_to_b).toEqual([{ sticker_id: 1 }]);
    expect(useQRStore.getState().lastCross).toEqual(cross);
  });

  it('confirm forwards items to /match/qr/confirm/', async () => {
    mockApi.post.mockResolvedValue({ data: { match_id: 1, trade_id: 2 } });
    const result = await useQRStore.getState().confirm(7, [
      { from_user: 1, to_user: 7, sticker_id: 9 },
    ]);
    expect(result).toEqual({ match_id: 1, trade_id: 2 });
    expect(mockApi.post).toHaveBeenCalledWith('match/qr/confirm/', expect.objectContaining({
      other_user: 7,
    }));
  });
});
