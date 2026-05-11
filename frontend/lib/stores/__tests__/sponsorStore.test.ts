/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

import { useSponsorStore } from '../sponsorStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  useSponsorStore.getState().clear();
  mockApi.get.mockReset();
});

describe('sponsorStore', () => {
  it('starts with no sponsor and not loaded', () => {
    const s = useSponsorStore.getState();
    expect(s.sponsor).toBeNull();
    expect(s.loaded).toBe(false);
  });

  it('persists sponsor returned by /sponsor/active/', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        active: {
          id: 1,
          brand_name: 'Coca-Cola',
          logo_url: 'https://example.test/logo.png',
          primary_color: '#ff0000',
          secondary_color: '#ffffff',
          message_text: 'Patrocinador',
          active_from: '2026-01-01',
          active_until: '2026-12-31',
          is_currently_active: true,
        },
      },
    });

    await useSponsorStore.getState().fetchActive();

    const s = useSponsorStore.getState();
    expect(s.sponsor?.brand_name).toBe('Coca-Cola');
    expect(s.loaded).toBe(true);
  });

  it('keeps sponsor null when API returns no active sponsor', async () => {
    mockApi.get.mockResolvedValue({ data: { active: null } });

    await useSponsorStore.getState().fetchActive();

    const s = useSponsorStore.getState();
    expect(s.sponsor).toBeNull();
    expect(s.loaded).toBe(true);
  });

  it('marks loaded even when the API call fails', async () => {
    mockApi.get.mockRejectedValue(new Error('network'));

    await useSponsorStore.getState().fetchActive();

    const s = useSponsorStore.getState();
    expect(s.sponsor).toBeNull();
    expect(s.loaded).toBe(true);
  });
});
