/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/lib/stores/onboardingStore', () => ({ __esModule: true, useOnboardingStore: jest.fn() }));

import { useOnboardingStore } from '@/lib/stores/onboardingStore';
import StepPermissions from '../StepPermissions';

const mockUseOnboardingStore = useOnboardingStore as unknown as jest.Mock;

type StoreShape = {
  pushOptin: boolean;
  setPushOptin: jest.Mock;
  whatsappOptin: boolean;
  setWhatsAppOptin: jest.Mock;
  whatsappE164: string;
  setWhatsAppE164: jest.Mock;
};
let storeState: StoreShape;

beforeEach(() => {
  storeState = {
    pushOptin: false,
    setPushOptin: jest.fn(),
    whatsappOptin: false,
    setWhatsAppOptin: jest.fn(),
    whatsappE164: '',
    setWhatsAppE164: jest.fn(),
  };
  mockUseOnboardingStore.mockImplementation((sel: (s: StoreShape) => unknown) => sel(storeState));
});

describe('StepPermissions', () => {
  it('renders the step heading and both opt-in toggles', () => {
    render(<StepPermissions />);

    expect(screen.getByRole('heading', { name: 'Notificaciones y contacto' })).toBeInTheDocument();
    expect(screen.getByTestId('push-optin-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('whatsapp-optin-toggle')).toBeInTheDocument();
  });

  it('toggles the push opt-in', () => {
    render(<StepPermissions />);

    fireEvent.click(screen.getByTestId('push-optin-toggle'));

    expect(storeState.setPushOptin).toHaveBeenCalledWith(true);
  });

  it('toggles the WhatsApp opt-in', () => {
    render(<StepPermissions />);

    fireEvent.click(screen.getByTestId('whatsapp-optin-toggle'));

    expect(storeState.setWhatsAppOptin).toHaveBeenCalledWith(true);
  });

  it('hides the phone input until WhatsApp opt-in is on', () => {
    render(<StepPermissions />);

    expect(screen.queryByTestId('whatsapp-e164-input')).not.toBeInTheDocument();
  });

  it('shows the phone input and captures the number when opted in', () => {
    storeState.whatsappOptin = true;
    render(<StepPermissions />);

    fireEvent.change(screen.getByTestId('whatsapp-e164-input'), { target: { value: '+573001112222' } });

    expect(storeState.setWhatsAppE164).toHaveBeenCalledWith('+573001112222');
  });
});
