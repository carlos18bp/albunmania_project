/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';

jest.mock('@/lib/stores/authStore', () => ({
  __esModule: true,
  useAuthStore: jest.fn(),
}));

import { useAuthStore } from '@/lib/stores/authStore';
import HeroCTA from '../HeroCTA';

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

beforeEach(() => {
  mockUseAuthStore.mockReset();
});

describe('HeroCTA', () => {
  it('renders the signup CTA when the visitor is not authenticated', async () => {
    mockUseAuthStore.mockImplementation((selector: (s: { isAuthenticated: boolean }) => unknown) =>
      selector({ isAuthenticated: false }),
    );

    await act(async () => {
      render(<HeroCTA />);
    });

    const cta = screen.getByTestId('hero-cta-signup');
    expect(cta).toHaveAttribute('href', '/sign-up');
    expect(cta).toHaveTextContent('Registrarme con Google');
  });

  it('renders the profile link when the visitor is authenticated', async () => {
    mockUseAuthStore.mockImplementation((selector: (s: { isAuthenticated: boolean }) => unknown) =>
      selector({ isAuthenticated: true }),
    );

    await act(async () => {
      render(<HeroCTA />);
    });

    const cta = screen.getByTestId('hero-cta-profile');
    expect(cta).toHaveAttribute('href', '/profile/me');
    expect(cta).toHaveTextContent('Ver mi perfil');
  });
});
