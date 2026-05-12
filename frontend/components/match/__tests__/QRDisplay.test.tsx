/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/stores/qrStore', () => ({
  __esModule: true,
  useQRStore: jest.fn(),
}));

import { useQRStore } from '@/lib/stores/qrStore';
import QRDisplay from '../QRDisplay';

const mockUseQRStore = useQRStore as unknown as jest.Mock;

type StoreShape = {
  myToken: { token: string } | null;
  fetchMyToken: jest.Mock;
  loading: boolean;
};
let storeState: StoreShape;

beforeEach(() => {
  storeState = { myToken: null, fetchMyToken: jest.fn(), loading: false };
  mockUseQRStore.mockImplementation((selector: (s: StoreShape) => unknown) => selector(storeState));
});

describe('QRDisplay', () => {
  it('fetches the token when none is cached', () => {
    render(<QRDisplay />);

    expect(storeState.fetchMyToken).toHaveBeenCalledTimes(1);
  });

  it('shows the loading text while fetching with no token yet', () => {
    storeState.loading = true;
    render(<QRDisplay />);

    expect(screen.getByTestId('qr-display-loading')).toBeInTheDocument();
  });

  it('renders nothing when there is no token and it is not loading', () => {
    const { container } = render(<QRDisplay />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the QR code SVG once the token is available', () => {
    storeState.myToken = { token: 'signed-token-abc' };
    render(<QRDisplay />);

    const display = screen.getByTestId('qr-display');
    expect(display.querySelector('svg')).toBeInTheDocument();
  });

  it('does not re-fetch when a token is already cached', () => {
    storeState.myToken = { token: 'signed-token-abc' };
    render(<QRDisplay />);

    expect(storeState.fetchMyToken).not.toHaveBeenCalled();
  });
});
