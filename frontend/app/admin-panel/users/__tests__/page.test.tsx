/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: jest.fn() }),
}));

jest.mock('@/lib/hooks/useRequireAuth', () => ({
  useRequireAuth: () => ({ isAuthenticated: true }),
}));

jest.mock('@/lib/stores/adminStore', () => ({
  __esModule: true,
  useAdminStore: jest.fn(),
}));

jest.mock('@/lib/stores/authStore', () => ({
  __esModule: true,
  useAuthStore: jest.fn(),
}));

import { useAdminStore } from '@/lib/stores/adminStore';
import { useAuthStore } from '@/lib/stores/authStore';
import AdminUsersPage from '../page';

const mockUseAdminStore = useAdminStore as unknown as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

const adminUser = {
  id: 1, email: 'admin@example.com', first_name: 'A', last_name: 'D',
  role: 'admin', is_active: true, is_staff: true,
  date_joined: null, last_login: null,
};
const collectorUser = {
  id: 2, email: 'collector@example.com', first_name: 'C', last_name: 'R',
  role: 'collector', is_active: true, is_staff: false,
  date_joined: null, last_login: null,
};
const blockedUser = {
  id: 3, email: 'blocked@example.com', first_name: 'B', last_name: 'L',
  role: 'collector', is_active: false, is_staff: false,
  date_joined: null, last_login: null,
};
const staffUser = {
  id: 4, email: 'staff@example.com', first_name: 'S', last_name: 'T',
  role: 'admin', is_active: true, is_staff: true,
  date_joined: null, last_login: null,
};

const fetchUsers = jest.fn();
const assignRole = jest.fn();
const setActive = jest.fn();
const loginAsUser = jest.fn();
const applySession = jest.fn();

beforeEach(() => {
  pushMock.mockReset();
  fetchUsers.mockReset();
  assignRole.mockReset();
  setActive.mockReset();
  loginAsUser.mockReset();
  applySession.mockReset();

  const adminStoreState = {
    users: [adminUser, collectorUser, blockedUser, staffUser],
    usersTotal: 4,
    fetchUsers, assignRole, setActive, loginAsUser,
  };
  mockUseAdminStore.mockImplementation((selector: (s: typeof adminStoreState) => unknown) => selector(adminStoreState));

  const authStoreState = { user: adminUser, applySession };
  mockUseAuthStore.mockImplementation((selector: (s: typeof authStoreState) => unknown) => selector(authStoreState));

  // jsdom window.confirm always-true by default.
  window.confirm = jest.fn(() => true);
});

describe('AdminUsersPage — login_as button', () => {
  it('shows the login_as button only for eligible users (active, non-staff, not self)', async () => {
    await act(async () => {
      render(<AdminUsersPage />);
    });

    // Eligible: collector
    expect(screen.getByTestId('admin-user-login-as-2')).toBeInTheDocument();
    // Self (admin id=1) → hidden
    expect(screen.queryByTestId('admin-user-login-as-1')).not.toBeInTheDocument();
    // Blocked → hidden
    expect(screen.queryByTestId('admin-user-login-as-3')).not.toBeInTheDocument();
    // Staff → hidden
    expect(screen.queryByTestId('admin-user-login-as-4')).not.toBeInTheDocument();
  });

  it('triggers loginAsUser + applySession + push to /profile/me on click', async () => {
    loginAsUser.mockResolvedValue({ access: 'a', refresh: 'r', user: collectorUser });
    applySession.mockResolvedValue(undefined);

    await act(async () => {
      render(<AdminUsersPage />);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('admin-user-login-as-2'));
    });

    await waitFor(() => expect(loginAsUser).toHaveBeenCalledWith(2));
    expect(applySession).toHaveBeenCalledWith({ access: 'a', refresh: 'r', user: collectorUser });
    expect(pushMock).toHaveBeenCalledWith('/profile/me');
  });

  it('renders the error message if loginAsUser rejects', async () => {
    loginAsUser.mockRejectedValue({ response: { data: { error: 'target_inactive' } } });

    await act(async () => {
      render(<AdminUsersPage />);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('admin-user-login-as-2'));
    });

    await waitFor(() =>
      expect(screen.getByTestId('admin-users-login-error')).toHaveTextContent('target_inactive'),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('aborts if the admin cancels the confirm dialog', async () => {
    window.confirm = jest.fn(() => false);

    await act(async () => {
      render(<AdminUsersPage />);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('admin-user-login-as-2'));
    });

    expect(loginAsUser).not.toHaveBeenCalled();
  });
});
