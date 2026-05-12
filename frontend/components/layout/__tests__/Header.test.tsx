/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Header from '../Header';
import { useAuthStore } from '../../../lib/stores/authStore';
import { useNotificationStore } from '../../../lib/stores/notificationStore';

jest.mock('../../../lib/stores/authStore', () => ({ useAuthStore: jest.fn() }));
jest.mock('../../../lib/stores/notificationStore', () => ({ useNotificationStore: jest.fn() }));
jest.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="mock-theme-toggle" />,
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseNotificationStore = useNotificationStore as unknown as jest.Mock;

const setAuthState = (state: { isAuthenticated: boolean; signOut?: jest.Mock }) => {
  const full = { signOut: jest.fn(), ...state };
  mockUseAuthStore.mockImplementation((selector?: (s: any) => unknown) =>
    selector ? selector(full) : full,
  );
};

const setUnreadCount = (count: number) => {
  const full = { unreadCount: count, fetchUnreadCount: jest.fn().mockResolvedValue(count) };
  mockUseNotificationStore.mockImplementation((selector?: (s: any) => unknown) =>
    selector ? selector(full) : full,
  );
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setUnreadCount(0);
  });

  it('renders the brand link and the manual link in any state', () => {
    setAuthState({ isAuthenticated: false });
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Albunmanía' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Manual' })).toBeInTheDocument();
  });

  it('renders the auth-neutral placeholder before mount (avoids hydration mismatch)', () => {
    setAuthState({ isAuthenticated: true });
    render(<Header />);
    expect(screen.queryByTestId('header-auth-placeholder')).not.toBeInTheDocument();
  });

  it('renders the authenticated nav slot when isAuthenticated is true', () => {
    setAuthState({ isAuthenticated: true });
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Match' })).toHaveAttribute('href', '/match');
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/profile/me');
    expect(screen.getByRole('link', { name: 'Cuenta' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByTestId('header-signout')).toBeInTheDocument();
  });

  it('renders the guest nav slot when isAuthenticated is false', () => {
    setAuthState({ isAuthenticated: false });
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/sign-in');
    expect(screen.getByRole('link', { name: 'Registrarse' })).toHaveAttribute('href', '/sign-up');
  });

  it('shows the notifications bell (no badge) when authenticated with zero unread', () => {
    setAuthState({ isAuthenticated: true });
    setUnreadCount(0);
    render(<Header />);
    expect(screen.getByTestId('header-notifications')).toHaveAttribute('href', '/notificaciones');
    expect(screen.queryByTestId('header-notifications-badge')).not.toBeInTheDocument();
  });

  it('shows the unread count badge on the bell', () => {
    setAuthState({ isAuthenticated: true });
    setUnreadCount(3);
    render(<Header />);
    expect(screen.getByTestId('header-notifications-badge')).toHaveTextContent('3');
  });

  it('caps the unread badge at 9+', () => {
    setAuthState({ isAuthenticated: true });
    setUnreadCount(42);
    render(<Header />);
    expect(screen.getByTestId('header-notifications-badge')).toHaveTextContent('9+');
  });

  it('hides the bell for guests', () => {
    setAuthState({ isAuthenticated: false });
    render(<Header />);
    expect(screen.queryByTestId('header-notifications')).not.toBeInTheDocument();
  });

  it('signOut button calls the store action', async () => {
    const signOut = jest.fn();
    setAuthState({ isAuthenticated: true, signOut });
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByTestId('header-signout'));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });
});
