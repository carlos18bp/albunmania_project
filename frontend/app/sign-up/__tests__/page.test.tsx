/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SignUpPage from '../page';
import { useAuthStore } from '../../../lib/stores/authStore';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

let mockGoogleCredential: string | null = 'token';
let mockGoogleError = false;

jest.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess, onError }: any) => (
    <button
      type="button"
      onClick={() => {
        if (mockGoogleError) {
          onError?.();
          return;
        }
        onSuccess?.({ credential: mockGoogleCredential ?? undefined });
      }}
    >
      Google Sign-up
    </button>
  ),
}));

jest.mock('@/components/auth/HCaptchaWidget', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-hcaptcha" />,
}));

jest.mock('../../../lib/services/http', () => ({
  api: { get: jest.fn().mockRejectedValue(new Error('no key')), post: jest.fn() },
}));

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('jwt-decode', () => ({ jwtDecode: jest.fn() }));
jest.mock('../../../lib/stores/authStore', () => ({ useAuthStore: jest.fn() }));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseRouter = useRouter as unknown as jest.Mock;
const mockJwtDecode = jwtDecode as unknown as jest.Mock;
let user: ReturnType<typeof userEvent.setup>;

const setAuthStoreState = (state: any) => {
  mockUseAuthStore.mockImplementation((selector?: (store: any) => unknown) =>
    selector ? selector(state) : state,
  );
};

describe('SignUpPage', () => {
  const originalGoogleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGoogleCredential = 'token';
    mockGoogleError = false;
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client';
    user = userEvent.setup();
  });

  afterEach(() => {
    if (originalGoogleClientId === undefined) {
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    } else {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = originalGoogleClientId;
    }
  });

  it('renders heading + already-have-account CTA', () => {
    setAuthStoreState({ googleLogin: jest.fn() });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignUpPage />);

    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/sign-in');
  });

  it('renders missing Google Client ID message when env var not set', () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    setAuthStoreState({ googleLogin: jest.fn() });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignUpPage />);

    expect(screen.getByTestId('missing-google-client-id')).toBeInTheDocument();
  });

  it('signs up with Google and redirects to /onboarding', async () => {
    const googleLogin = jest.fn().mockResolvedValue(undefined);
    setAuthStoreState({ googleLogin });
    const replace = jest.fn();
    mockUseRouter.mockReturnValue({ replace });
    mockJwtDecode.mockReturnValue({
      email: 'google@example.com',
      given_name: 'Google',
      family_name: 'User',
      picture: 'pic.png',
    });

    render(<SignUpPage />);
    await user.click(screen.getByRole('button', { name: 'Google Sign-up' }));

    await waitFor(() => {
      expect(googleLogin).toHaveBeenCalledWith({
        credential: 'token',
        email: 'google@example.com',
        given_name: 'Google',
        family_name: 'User',
        picture: 'pic.png',
        captcha_token: undefined,
      });
    });
    expect(replace).toHaveBeenCalledWith('/onboarding');
  });

  it('shows error when Google credential is missing', async () => {
    mockGoogleCredential = null;
    setAuthStoreState({ googleLogin: jest.fn() });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignUpPage />);
    await user.click(screen.getByRole('button', { name: 'Google Sign-up' }));

    expect(await screen.findByTestId('signup-error')).toHaveTextContent(/cuenta de Google/i);
  });

  it('surfaces account-too-young error from the store', async () => {
    const googleLogin = jest.fn().mockRejectedValue({ code: 'account_too_young' });
    setAuthStoreState({ googleLogin });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });
    mockJwtDecode.mockReturnValue({ email: 'g@x.com' });

    render(<SignUpPage />);
    await user.click(screen.getByRole('button', { name: 'Google Sign-up' }));

    expect(await screen.findByTestId('signup-error')).toHaveTextContent(/30 d.+as/i);
  });

  it('shows the fallback error when the store rejects without a code', async () => {
    const googleLogin = jest.fn().mockRejectedValue(new Error('boom'));
    setAuthStoreState({ googleLogin });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });
    mockJwtDecode.mockReturnValue({ email: 'g@x.com' });

    render(<SignUpPage />);
    await user.click(screen.getByRole('button', { name: 'Google Sign-up' }));

    expect(await screen.findByTestId('signup-error')).toHaveTextContent(/No pudimos crear/i);
  });

  it('shows the Google-failed error when the OAuth widget calls onError', async () => {
    mockGoogleError = true;
    setAuthStoreState({ googleLogin: jest.fn() });
    mockUseRouter.mockReturnValue({ replace: jest.fn() });

    render(<SignUpPage />);
    await user.click(screen.getByRole('button', { name: 'Google Sign-up' }));

    expect(await screen.findByTestId('signup-error')).toHaveTextContent(/cuenta de Google/i);
  });

  it('keeps going when jwtDecode throws (uses undefined email/name)', async () => {
    const googleLogin = jest.fn().mockResolvedValue(undefined);
    setAuthStoreState({ googleLogin });
    const replace = jest.fn();
    mockUseRouter.mockReturnValue({ replace });
    mockJwtDecode.mockImplementation(() => {
      throw new Error('bad token');
    });

    render(<SignUpPage />);
    await user.click(screen.getByRole('button', { name: 'Google Sign-up' }));

    await waitFor(() => {
      expect(googleLogin).toHaveBeenCalledWith({
        credential: 'token',
        email: undefined,
        given_name: undefined,
        family_name: undefined,
        picture: undefined,
        captcha_token: undefined,
      });
    });
    expect(replace).toHaveBeenCalledWith('/onboarding');
  });
});
