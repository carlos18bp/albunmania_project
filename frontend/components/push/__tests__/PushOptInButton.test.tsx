/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import PushOptInButton from '../PushOptInButton';
import { usePushStore } from '../../../lib/stores/pushStore';

jest.mock('../../../lib/services/http', () => ({
  api: { post: jest.fn(), get: jest.fn() },
}));

beforeEach(() => {
  // Provide minimal Notification + PushManager + serviceWorker globals
  // so the component's detectPermission useEffect doesn't immediately
  // flip the store state to 'unsupported' (jsdom has none of these by
  // default).
  (global as any).Notification = { permission: 'default' } as any;
  (global as any).PushManager = function () {} as any;
  (global as any).navigator = (global as any).navigator || {};
  (global as any).navigator.serviceWorker = (global as any).navigator.serviceWorker || {
    getRegistration: jest.fn(),
    register: jest.fn(),
  };

  usePushStore.setState({
    permission: 'default', subscribed: false, loading: false, error: null,
    // Replace detectPermission with a noop so the component's useEffect
    // doesn't overwrite the explicit state each test wants to assert.
    detectPermission: () => undefined,
  } as any);
});

describe('PushOptInButton', () => {
  it('renders the subscribe CTA when permission is default', () => {
    render(<PushOptInButton />);
    expect(screen.getByTestId('push-subscribe')).toBeInTheDocument();
  });

  it('renders the denied message when Notification.permission=denied', () => {
    usePushStore.setState({
      permission: 'denied', subscribed: false, loading: false, error: null,
    });
    render(<PushOptInButton />);
    expect(screen.getByTestId('push-denied')).toBeInTheDocument();
  });

  it('renders the unsubscribe CTA when already subscribed', () => {
    usePushStore.setState({
      permission: 'granted', subscribed: true, loading: false, error: null,
    });
    render(<PushOptInButton />);
    expect(screen.getByTestId('push-unsubscribe')).toBeInTheDocument();
  });

  it('renders nothing when push is unsupported (no dead UI)', () => {
    usePushStore.setState({
      permission: 'unsupported', subscribed: false, loading: false, error: null,
    });
    const { container } = render(<PushOptInButton />);
    expect(container.firstChild).toBeNull();
  });
});
