/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/navigation', () => {
  const push = jest.fn();
  return {
    __esModule: true,
    useRouter: () => ({ push, replace: push, back: push, forward: push, refresh: push, prefetch: push }),
    __push: push,
  };
});

jest.mock('../../../lib/services/http', () => ({
  api: {
    patch: jest.fn().mockResolvedValue({ data: {} }),
    get: jest.fn().mockResolvedValue({ data: { available: false } }),
  },
}));

jest.mock('../../../lib/stores/authStore', () => ({
  useAuthStore: { getState: () => ({ refreshProfile: jest.fn() }) },
}));

import OnboardingWizard from '../OnboardingWizard';
import { useOnboardingStore } from '../../../lib/stores/onboardingStore';
const { __push: pushMock } = jest.requireMock('next/navigation') as { __push: jest.Mock };

beforeEach(() => {
  useOnboardingStore.getState().reset();
  pushMock.mockReset();
});

describe('OnboardingWizard', () => {
  it('disables Next on step 1 until an album is selected', () => {
    render(<OnboardingWizard />);

    const next = screen.getByTestId('onboarding-next');
    expect(next).toBeDisabled();
  });

  it('enables Next once an album is picked, then advances to geo', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    await user.click(screen.getByTestId('album-option-1'));
    expect(screen.getByTestId('onboarding-next')).toBeEnabled();

    await user.click(screen.getByTestId('onboarding-next'));
    expect(useOnboardingStore.getState().step).toBe('geo');
  });

  it('Back is disabled on step 1 and enabled afterwards', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    expect(screen.getByTestId('onboarding-back')).toBeDisabled();

    await user.click(screen.getByTestId('album-option-1'));
    await user.click(screen.getByTestId('onboarding-next'));

    expect(screen.getByTestId('onboarding-back')).toBeEnabled();
  });

  it('shows the validation error when WhatsApp opt-in lacks a number on submit', async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().setActiveAlbum(1);
    useOnboardingStore.getState().goToStep('permissions');

    render(<OnboardingWizard />);

    await user.click(screen.getByTestId('whatsapp-optin-toggle'));
    await user.click(screen.getByTestId('onboarding-next'));

    expect(screen.getByTestId('onboarding-error')).toHaveTextContent(/WhatsApp/i);
  });

  it('navigates to /profile/me after a successful submit', async () => {
    const user = userEvent.setup();
    useOnboardingStore.getState().setActiveAlbum(1);
    useOnboardingStore.getState().goToStep('permissions');

    render(<OnboardingWizard />);

    await user.click(screen.getByTestId('onboarding-next'));

    expect(pushMock).toHaveBeenCalledWith('/profile/me');
  });
});
