/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/lib/stores/onboardingStore', () => ({ __esModule: true, useOnboardingStore: jest.fn() }));
jest.mock('@/lib/services/http', () => ({ api: { get: jest.fn() } }));

import { api } from '@/lib/services/http';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';
import StepGeolocation from '../StepGeolocation';

const mockUseOnboardingStore = useOnboardingStore as unknown as jest.Mock;
const mockGet = api.get as unknown as jest.Mock;

type StoreShape = {
  setGeo: jest.Mock;
  setGeoFromIp: jest.Mock;
  latApprox: number | null;
  browserGeoOptin: boolean;
  setBrowserGeoOptin: jest.Mock;
};
let storeState: StoreShape;
let originalGeolocation: PropertyDescriptor | undefined;

beforeEach(() => {
  storeState = {
    setGeo: jest.fn(), setGeoFromIp: jest.fn(), latApprox: null,
    browserGeoOptin: false, setBrowserGeoOptin: jest.fn(),
  };
  mockUseOnboardingStore.mockImplementation((sel: (s: StoreShape) => unknown) => sel(storeState));
  mockGet.mockReset();
  mockGet.mockResolvedValue({ data: { available: false } });
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

  it('offers the IP-based location hint when GeoIP resolves', async () => {
    stubGeolocation(jest.fn());
    mockGet.mockResolvedValue({ data: { available: true, located: true, lat: 4.65, lng: -74.07, city: 'Bogotá' } });
    render(<StepGeolocation />);

    await waitFor(() => expect(screen.getByTestId('ip-location-hint')).toBeInTheDocument());
    expect(screen.getByTestId('ip-location-hint')).toHaveTextContent('Bogotá');

    fireEvent.click(screen.getByTestId('use-ip-location'));
    expect(storeState.setGeoFromIp).toHaveBeenCalledWith({ lat: 4.65, lng: -74.07, city: 'Bogotá' });
  });

  it('does not show the IP hint when GeoIP is unavailable', async () => {
    stubGeolocation(jest.fn());
    mockGet.mockResolvedValue({ data: { available: false } });
    render(<StepGeolocation />);

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('geo/ip-locate/'));
    expect(screen.queryByTestId('ip-location-hint')).not.toBeInTheDocument();
  });
});
