/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/lib/stores/onboardingStore', () => ({ __esModule: true, useOnboardingStore: jest.fn() }));

import { useOnboardingStore } from '@/lib/stores/onboardingStore';
import StepGeolocation from '../StepGeolocation';

const mockUseOnboardingStore = useOnboardingStore as unknown as jest.Mock;

type StoreShape = {
  setGeo: jest.Mock;
  browserGeoOptin: boolean;
  setBrowserGeoOptin: jest.Mock;
};
let storeState: StoreShape;
let originalGeolocation: PropertyDescriptor | undefined;

beforeEach(() => {
  storeState = { setGeo: jest.fn(), browserGeoOptin: false, setBrowserGeoOptin: jest.fn() };
  mockUseOnboardingStore.mockImplementation((sel: (s: StoreShape) => unknown) => sel(storeState));
  originalGeolocation = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
});

afterEach(() => {
  if (originalGeolocation) Object.defineProperty(navigator, 'geolocation', originalGeolocation);
  else delete (navigator as { geolocation?: unknown }).geolocation;
});

function stubGeolocation(getCurrentPosition: jest.Mock) {
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  });
}

describe('StepGeolocation', () => {
  it('renders the step heading and the explanation copy', () => {
    stubGeolocation(jest.fn());
    render(<StepGeolocation />);

    expect(screen.getByRole('heading', { name: 'Permitir geolocalización' })).toBeInTheDocument();
    expect(screen.getByText(/Nunca compartimos tu ubicación exacta/)).toBeInTheDocument();
  });

  it('stores the coordinates when the browser grants the location', () => {
    stubGeolocation(jest.fn((success: PositionCallback) => success({ coords: { latitude: 4.7, longitude: -74.05 } } as GeolocationPosition)));
    render(<StepGeolocation />);

    fireEvent.click(screen.getByTestId('geo-request-button'));

    expect(storeState.setGeo).toHaveBeenCalledWith({ lat: 4.7, lng: -74.05 });
  });

  it('shows an error when the location request fails', () => {
    stubGeolocation(jest.fn((_s: PositionCallback, error: PositionErrorCallback) => error({ message: 'User denied' } as GeolocationPositionError)));
    render(<StepGeolocation />);

    fireEvent.click(screen.getByTestId('geo-request-button'));

    expect(screen.getByRole('alert')).toHaveTextContent('User denied');
  });

  it('toggles the "remember consent" checkbox', () => {
    stubGeolocation(jest.fn());
    render(<StepGeolocation />);

    fireEvent.click(screen.getByTestId('geo-optin-toggle'));

    expect(storeState.setBrowserGeoOptin).toHaveBeenCalledWith(true);
  });
});
