/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('@/lib/services/http', () => ({
  api: { get: jest.fn(), patch: jest.fn(), post: jest.fn() },
}));

import { api } from '@/lib/services/http';
import { useProfileStore } from '../profileStore';

const mockGet = api.get as unknown as jest.Mock;
const mockPatch = api.patch as unknown as jest.Mock;

const publicProfile = {
  user_id: 11,
  display_name: 'Lucía Rojas',
  city: 'Bogotá',
  avatar_url: '',
  bio_short: 'Coleccionista de toda la vida',
  rating_avg: '4.50',
  rating_count: 2,
  positive_pct: '100.00',
  album_completion_pct: '30.00',
  trades_completed_count: 1,
};

const meResponse = {
  data: {
    id: 11,
    email: 'lucia@example.com',
    first_name: 'Lucía',
    profile: { city: 'Bogotá', bio_short: 'hola', push_optin: true, whatsapp_optin: false, whatsapp_e164: '' },
  },
};

beforeEach(() => {
  mockGet.mockReset();
  mockPatch.mockReset();
  useProfileStore.getState().clear();
});

describe('profileStore', () => {
  it('fetches and caches a public profile by user id', async () => {
    mockGet.mockResolvedValue({ data: publicProfile });

    const result = await useProfileStore.getState().fetchPublicProfile(11);

    expect(mockGet).toHaveBeenCalledWith('users/11/public-profile/');
    expect(result.display_name).toBe('Lucía Rojas');
    expect(useProfileStore.getState().publicByUser[11]).toEqual(publicProfile);
  });

  it('records an error flag when the public profile fetch fails', async () => {
    mockGet.mockRejectedValue(new Error('boom'));

    await expect(useProfileStore.getState().fetchPublicProfile(99)).rejects.toThrow();
    expect(useProfileStore.getState().error).toBe('fetch_public_profile_failed');
  });

  it('maps the profile sub-object to AccountSettings on fetchMySettings', async () => {
    mockGet.mockResolvedValue(meResponse);

    const settings = await useProfileStore.getState().fetchMySettings();

    expect(mockGet).toHaveBeenCalledWith('profile/me/');
    expect(settings).toEqual({ city: 'Bogotá', bio_short: 'hola', push_optin: true, whatsapp_optin: false, whatsapp_e164: '' });
    expect(useProfileStore.getState().mySettings).toEqual(settings);
  });

  it('PATCHes /profile/me/ and updates mySettings on updateMySettings', async () => {
    mockPatch.mockResolvedValue({
      data: { profile: { city: 'Medellín', bio_short: 'hola', push_optin: false, whatsapp_optin: true, whatsapp_e164: '+573001112222' } },
    });

    const settings = await useProfileStore.getState().updateMySettings({ city: 'Medellín' });

    expect(mockPatch).toHaveBeenCalledWith('profile/me/', { city: 'Medellín' });
    expect(settings.city).toBe('Medellín');
    expect(settings.whatsapp_e164).toBe('+573001112222');
    expect(useProfileStore.getState().mySettings).toEqual(settings);
  });
});
