/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('@/lib/services/http', () => ({
  api: { get: jest.fn() },
}));

import { api } from '@/lib/services/http';
import { useCollectorMapStore, type CollectorMapEntry } from '../collectorMapStore';

const mockGet = api.get as unknown as jest.Mock;

const entry = (id: number, online = false): CollectorMapEntry => ({
  user_id: id,
  display_name: `Coleccionista ${id}`,
  city: 'Bogotá',
  avatar_url: '',
  lat_approx: 4.65,
  lng_approx: -74.07,
  rating_avg: 4.5,
  rating_count: 3,
  is_online: online,
});

beforeEach(() => {
  mockGet.mockReset();
  useCollectorMapStore.getState().clear();
});

describe('collectorMapStore', () => {
  it('fetches collectors into entries', async () => {
    mockGet.mockResolvedValue({ data: { results: [entry(1), entry(2, true)] } });
    const entries = await useCollectorMapStore.getState().fetchCollectors();
    expect(entries).toHaveLength(2);
    expect(useCollectorMapStore.getState().entries[1].is_online).toBe(true);
  });

  it('sends geo params when lat/lng/radius are given', async () => {
    mockGet.mockResolvedValue({ data: { results: [] } });
    await useCollectorMapStore.getState().fetchCollectors({ lat: 4.6, lng: -74.0, radiusKm: 50 });
    expect(mockGet).toHaveBeenCalledWith('collectors/map/', { params: { lat: 4.6, lng: -74.0, radius_km: 50 } });
  });

  it('sends the album_id param when given', async () => {
    mockGet.mockResolvedValue({ data: { results: [] } });
    await useCollectorMapStore.getState().fetchCollectors({ albumId: 42 });
    expect(mockGet).toHaveBeenCalledWith('collectors/map/', { params: { album_id: 42 } });
  });

  it('sets an error flag on failure', async () => {
    mockGet.mockRejectedValue(new Error('boom'));
    await expect(useCollectorMapStore.getState().fetchCollectors()).rejects.toThrow();
    expect(useCollectorMapStore.getState().error).toBe('fetch_collectors_failed');
  });
});
