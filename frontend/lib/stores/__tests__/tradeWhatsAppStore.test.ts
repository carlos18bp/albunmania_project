/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

import { useTradeWhatsAppStore } from '../tradeWhatsAppStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  useTradeWhatsAppStore.getState().clear();
  mockApi.get.mockReset();
  mockApi.post.mockReset();
});

describe('tradeWhatsAppStore', () => {
  it('records the opt-in result keyed by trade id', async () => {
    mockApi.post.mockResolvedValue({ data: { opted_in: true, both_opted_in: false } });
    const result = await useTradeWhatsAppStore.getState().setOptIn(7, true);
    expect(result.opted_in).toBe(true);
    expect(useTradeWhatsAppStore.getState().optInByTrade[7].opted_in).toBe(true);
  });

  it('returns the link when both sides have opted in', async () => {
    mockApi.get.mockResolvedValue({ data: { wa_link: 'https://wa.me/57300?text=hi' } });
    const link = await useTradeWhatsAppStore.getState().fetchLink(7);
    expect(link).toBe('https://wa.me/57300?text=hi');
  });

  it('returns null and records error when the link is blocked', async () => {
    mockApi.get.mockRejectedValue({ response: { status: 403 } });
    const link = await useTradeWhatsAppStore.getState().fetchLink(7);
    expect(link).toBeNull();
    expect(useTradeWhatsAppStore.getState().error).toBe('link_blocked');
  });
});
