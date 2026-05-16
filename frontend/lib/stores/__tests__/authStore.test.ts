import { describe, it, expect, beforeEach } from '@jest/globals';
import { act } from '@testing-library/react';

import { useAuthStore } from '../authStore';
import { api } from '../../services/http';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../../services/tokens';

jest.mock('../../services/http', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('../../services/tokens', () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;
const mockGetAccessToken = getAccessToken as jest.Mock;
const mockGetRefreshToken = getRefreshToken as jest.Mock;
const mockSetTokens = setTokens as jest.Mock;
const mockClearTokens = clearTokens as jest.Mock;

const resetAuthState = () => {
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
  });
};

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
    mockGetAccessToken.mockReturnValue(null);
    mockGetRefreshToken.mockReturnValue(null);
  });

  it('syncs tokens from cookies', () => {
    mockGetAccessToken.mockReturnValue('access');
    mockGetRefreshToken.mockReturnValue('refresh');

    act(() => {
      useAuthStore.getState().syncFromCookies();
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access');
    expect(state.refreshToken).toBe('refresh');
    expect(state.isAuthenticated).toBe(true);
  });

  it('logs in with google credentials', async () => {
    mockGetAccessToken.mockReturnValue('access');
    mockGetRefreshToken.mockReturnValue('refresh');
    mockApi.post.mockResolvedValueOnce({
      data: {
        access: 'access',
        refresh: 'refresh',
        user: {
          id: 3,
          email: 'google@example.com',
          first_name: 'Google',
          last_name: 'User',
          role: 'customer',
          is_staff: false,
        },
      },
    });

    await act(async () => {
      await useAuthStore.getState().googleLogin({ credential: 'token', email: 'google@example.com' });
    });

    expect(mockSetTokens).toHaveBeenCalledWith({ access: 'access', refresh: 'refresh' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('throws GoogleLoginError(unknown) when google login response is missing tokens', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { access: null, refresh: null } });

    await expect(
      useAuthStore.getState().googleLogin({ credential: 'token' }),
    ).rejects.toMatchObject({ code: 'unknown' });
  });

  it('throws GoogleLoginError(account_too_young) when backend returns 403', async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { status: 403, data: { error: 'account_too_young', min_days: 30, account_age_days: 7 } },
    });

    await expect(
      useAuthStore.getState().googleLogin({ credential: 'tok', access_token: 'at' }),
    ).rejects.toMatchObject({ code: 'account_too_young', min_days: 30, account_age_days: 7 });
  });

  it('throws GoogleLoginError(captcha_failed) when backend returns 400 captcha_failed', async () => {
    mockApi.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'captcha_failed', detail: 'hCaptcha verification failed.' } },
    });

    await expect(
      useAuthStore.getState().googleLogin({ credential: 'tok', captcha_token: '' }),
    ).rejects.toMatchObject({ code: 'captcha_failed' });
  });

  it('signs out and clears tokens', () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: 'access', refreshToken: 'refresh' });

    act(() => {
      useAuthStore.getState().signOut();
    });

    expect(mockClearTokens).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('restores the current user from validate_token', async () => {
    mockGetAccessToken.mockReturnValue('access');
    mockApi.get.mockResolvedValueOnce({
      data: {
        user: {
          id: 7,
          email: 'restore@example.com',
          first_name: 'Restore',
          last_name: 'User',
          role: 'customer',
          is_staff: false,
        },
      },
    });

    await act(async () => {
      await useAuthStore.getState().restoreUser();
    });

    expect(mockApi.get).toHaveBeenCalledWith('validate_token/');
    expect(useAuthStore.getState().user?.email).toBe('restore@example.com');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('clears auth state when restoreUser fails', async () => {
    mockGetAccessToken.mockReturnValue('access');
    mockApi.get.mockRejectedValueOnce(new Error('boom'));
    useAuthStore.setState({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 1, email: 'user@example.com', first_name: 'T', last_name: 'U', role: 'customer', is_staff: false },
      isAuthenticated: true,
    });

    await act(async () => {
      await useAuthStore.getState().restoreUser();
    });

    expect(mockClearTokens).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('applySession swaps the session to the impersonated user and refreshes profile', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { profile: { city: 'Bogotá' } } });
    const target = { id: 42, email: 'target@x.com', first_name: 'T', last_name: 'U', role: 'collector', is_staff: false };

    await act(async () => {
      await useAuthStore.getState().applySession({ access: 'a-tok', refresh: 'r-tok', user: target });
    });

    expect(mockSetTokens).toHaveBeenCalledWith({ access: 'a-tok', refresh: 'r-tok' });
    expect(useAuthStore.getState().user).toEqual(target);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockApi.get).toHaveBeenCalledWith('profile/me/');
  });
});
