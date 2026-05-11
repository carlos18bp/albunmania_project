/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

// Mock the heavy hCaptcha SDK with a tiny test double that fires onVerify
// on mount, so we can assert wiring without hitting hCaptcha servers.
jest.mock('@hcaptcha/react-hcaptcha', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line react/display-name
  return {
    __esModule: true,
    default: React.forwardRef(({ onVerify }: { onVerify?: (t: string) => void }, _ref: unknown) => {
      React.useEffect(() => {
        onVerify?.('mock-token');
      }, [onVerify]);
      return <div data-testid="mock-hcaptcha" />;
    }),
  };
});

import HCaptchaWidget from '../HCaptchaWidget';

describe('HCaptchaWidget', () => {
  it('renders the inner widget after sitekey resolution', async () => {
    render(<HCaptchaWidget sitekey="test-key" onVerify={() => {}} />);

    expect(await screen.findByTestId('hcaptcha-widget')).toBeInTheDocument();
    expect(await screen.findByTestId('mock-hcaptcha')).toBeInTheDocument();
  });

  it('forwards the verify token to the parent', async () => {
    const onVerify = jest.fn();
    render(<HCaptchaWidget sitekey="test-key" onVerify={onVerify} />);

    await screen.findByTestId('mock-hcaptcha');
    expect(onVerify).toHaveBeenCalledWith('mock-token');
  });
});
