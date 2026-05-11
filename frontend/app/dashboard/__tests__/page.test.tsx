/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DashboardPage from '../page';
import { useRequireAuth } from '../../../lib/hooks/useRequireAuth';
import { useAuthStore } from '../../../lib/stores/authStore';

jest.mock('../../../lib/hooks/useRequireAuth', () => ({
  useRequireAuth: jest.fn(),
}));

jest.mock('../../../lib/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../../../lib/services/http', () => ({
  api: {
    get: jest.fn().mockResolvedValue({ data: { results: [] } }),
  },
}));

const mockUseRequireAuth = useRequireAuth as unknown as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

const setAuthStoreState = (state: any) => {
  mockUseAuthStore.mockImplementation((selector?: (store: any) => unknown) =>
    selector ? selector(state) : state,
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when unauthenticated', () => {
    mockUseRequireAuth.mockReturnValue({ isAuthenticated: false });
    setAuthStoreState({ signOut: jest.fn(), profile: null });

    const { container } = render(<DashboardPage />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the album title and triggers sign out', async () => {
    const signOut = jest.fn();
    mockUseRequireAuth.mockReturnValue({ isAuthenticated: true });
    setAuthStoreState({ signOut, profile: { city: 'Bogotá', active_album_id: 1 } });

    render(<DashboardPage />);

    expect(screen.getByRole('heading', { name: 'Mi álbum' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Match' })).toHaveAttribute('href', '/match');

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
