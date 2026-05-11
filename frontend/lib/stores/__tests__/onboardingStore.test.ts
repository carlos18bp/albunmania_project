/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

import { useOnboardingStore } from '../onboardingStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { patch: jest.fn() },
}));

jest.mock('../authStore', () => ({
  useAuthStore: { getState: () => ({ refreshProfile: jest.fn() }) },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  useOnboardingStore.getState().reset();
  mockApi.patch.mockReset();
});

describe('onboardingStore', () => {
  it('starts at the album step with empty selections', () => {
    const s = useOnboardingStore.getState();
    expect(s.step).toBe('album');
    expect(s.activeAlbumId).toBeNull();
    expect(s.browserGeoOptin).toBe(false);
  });

  it('advances steps in order album -> geo -> permissions -> done', () => {
    useOnboardingStore.getState().next();
    expect(useOnboardingStore.getState().step).toBe('geo');
    useOnboardingStore.getState().next();
    expect(useOnboardingStore.getState().step).toBe('permissions');
    useOnboardingStore.getState().next();
    expect(useOnboardingStore.getState().step).toBe('done');
    useOnboardingStore.getState().next();
    expect(useOnboardingStore.getState().step).toBe('done');
  });

  it('back never goes below album', () => {
    useOnboardingStore.getState().back();
    expect(useOnboardingStore.getState().step).toBe('album');
  });

  it('setActiveAlbum stores id and back/next preserves it', () => {
    useOnboardingStore.getState().setActiveAlbum(7);
    useOnboardingStore.getState().next();
    expect(useOnboardingStore.getState().activeAlbumId).toBe(7);
  });

  it('setGeo records lat/lng and flips browserGeoOptin', () => {
    useOnboardingStore.getState().setGeo({ lat: 4.711, lng: -74.072, city: 'Bogotá' });
    const s = useOnboardingStore.getState();
    expect(s.latApprox).toBeCloseTo(4.711);
    expect(s.lngApprox).toBeCloseTo(-74.072);
    expect(s.browserGeoOptin).toBe(true);
    expect(s.city).toBe('Bogotá');
  });

  it('submit posts the patched payload to the onboarding endpoint', async () => {
    mockApi.patch.mockResolvedValueOnce({ data: { ok: true } });

    useOnboardingStore.getState().setActiveAlbum(1);
    useOnboardingStore.getState().setGeo({ lat: 4.6, lng: -74.1 });
    useOnboardingStore.getState().setPushOptin(true);

    await useOnboardingStore.getState().submit();

    expect(mockApi.patch).toHaveBeenCalledWith('profile/me/onboarding/', expect.objectContaining({
      active_album_id: 1,
      lat_approx: '4.600000',
      lng_approx: '-74.100000',
      browser_geo_optin: true,
      push_optin: true,
    }));
    expect(useOnboardingStore.getState().step).toBe('done');
  });

  it('submit refuses when WhatsApp opt-in is true but number is empty', async () => {
    useOnboardingStore.getState().setWhatsAppOptin(true);

    await expect(useOnboardingStore.getState().submit()).rejects.toThrow();
    expect(useOnboardingStore.getState().errorMessage).toBe('whatsapp_e164_required');
    expect(mockApi.patch).not.toHaveBeenCalled();
  });

  it('submit propagates a generic error message on backend failure', async () => {
    mockApi.patch.mockRejectedValueOnce({ response: { data: { detail: 'oops' } } });

    useOnboardingStore.getState().setActiveAlbum(1);

    await expect(useOnboardingStore.getState().submit()).rejects.toBeDefined();
    expect(useOnboardingStore.getState().errorMessage).toContain('detail');
  });
});
