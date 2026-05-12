/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const decodeFromVideoDevice = jest.fn();
jest.mock('@zxing/browser', () => ({
  __esModule: true,
  BrowserQRCodeReader: jest.fn(() => ({ decodeFromVideoDevice })),
}));

import QRScanner from '../QRScanner';

beforeEach(() => {
  decodeFromVideoDevice.mockReset();
});

describe('QRScanner', () => {
  it('renders the video element while waiting for a scan', () => {
    decodeFromVideoDevice.mockReturnValue(new Promise(() => undefined)); // never resolves
    render(<QRScanner onScan={jest.fn()} />);

    expect(screen.getByTestId('scanner-video')).toBeInTheDocument();
  });

  it('shows the camera-error fallback when the camera is unavailable', async () => {
    decodeFromVideoDevice.mockRejectedValue(new Error('NotAllowedError'));
    render(<QRScanner onScan={jest.fn()} />);

    expect(await screen.findByTestId('scanner-error')).toBeInTheDocument();
  });

  it('calls onScan with the decoded token', () => {
    const onScan = jest.fn();
    decodeFromVideoDevice.mockImplementation(
      (_deviceId: unknown, _video: unknown, callback: (r: { getText: () => string } | null, e: unknown, c: { stop: () => void }) => void) => {
        callback({ getText: () => 'SIGNED-QR-TOKEN' }, undefined, { stop: jest.fn() });
        return Promise.resolve({ stop: jest.fn() });
      },
    );
    render(<QRScanner onScan={onScan} />);

    expect(onScan).toHaveBeenCalledWith('SIGNED-QR-TOKEN');
  });
});
