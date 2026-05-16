/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';

const replaceMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
}));

jest.mock('@/lib/hooks/useRequireAuth', () => ({
  useRequireAuth: jest.fn(),
}));

jest.mock('@/lib/stores/authStore', () => ({
  __esModule: true,
  useAuthStore: jest.fn(),
}));

import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useAuthStore } from '@/lib/stores/authStore';
import AdminLandingPage from '../page';

const mockUseRequireAuth = useRequireAuth as unknown as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

function setupUser(user: { role: string; is_staff: boolean; email?: string } | null, isAuthenticated = true) {
  mockUseRequireAuth.mockReturnValue({ isAuthenticated });
  mockUseAuthStore.mockImplementation((selector: (s: { user: typeof user }) => unknown) =>
    selector({ user }),
  );
}

beforeEach(() => {
  replaceMock.mockReset();
  mockUseRequireAuth.mockReset();
  mockUseAuthStore.mockReset();
});

describe('AdminLandingPage (panel Next.js at /admin-panel)', () => {
  it('renders the three management tiles for an admin', async () => {
    setupUser({ email: 'admin@example.com', role: 'admin', is_staff: true });

    await act(async () => {
      render(<AdminLandingPage />);
    });

    const tiles = screen.getByTestId('admin-tiles');
    expect(tiles).toHaveTextContent('Usuarios y roles');
    expect(tiles).toHaveTextContent('Moderación de reseñas');
    expect(tiles).toHaveTextContent('Analítica');
  });

  it('points the tiles at /admin-panel/* routes (not /admin/*)', async () => {
    setupUser({ email: 'admin@example.com', role: 'admin', is_staff: true });

    await act(async () => {
      render(<AdminLandingPage />);
    });

    expect(screen.getByRole('link', { name: /Usuarios y roles/ })).toHaveAttribute('href', '/admin-panel/users');
    expect(screen.getByRole('link', { name: /Moderación/ })).toHaveAttribute('href', '/admin-panel/moderation');
    expect(screen.getByRole('link', { name: /Analítica/ })).toHaveAttribute('href', '/admin-panel/analytics');
  });

  it('shows the "Open Django admin" CTA for staff users', async () => {
    setupUser({ email: 'admin@example.com', role: 'admin', is_staff: true });

    await act(async () => {
      render(<AdminLandingPage />);
    });

    const cta = screen.getByTestId('open-django-admin');
    expect(cta).toHaveAttribute('href', '/admin/');
    expect(cta).toHaveAttribute('target', '_blank');
  });

  it('hides the Django admin CTA for web_manager (no Django access)', async () => {
    setupUser({ email: 'wm@example.com', role: 'web_manager', is_staff: false });

    await act(async () => {
      render(<AdminLandingPage />);
    });

    expect(screen.queryByTestId('open-django-admin')).not.toBeInTheDocument();
  });

  it('redirects a logged-in collector away to /dashboard', async () => {
    setupUser({ email: 'user@example.com', role: 'collector', is_staff: false });

    await act(async () => {
      render(<AdminLandingPage />);
    });

    expect(replaceMock).toHaveBeenCalledWith('/dashboard');
  });
});
