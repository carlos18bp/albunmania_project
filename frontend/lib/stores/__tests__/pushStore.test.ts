/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import { usePushStore } from '../pushStore';
import { api } from '../../services/http';

jest.mock('../../services/http', () => ({
  api: { get: jest.fn(), post: jest.fn().mockResolvedValue({ data: {} }) },
}));

const mockApi = api as jest.Mocked<typeof api>;

// Snapshot Notification + PushManager so individual tests can mutate
// them without leaking the change to sibling tests in the same Jest
// process (which would break PushOptInButton.test.tsx that runs in
// parallel/sequence).
const originalNotification = (global as any).Notification;
const originalPushManager = (global as any).PushManager;

beforeEach(() => {
  usePushStore.setState({
    permission: 'default', subscribed: false, loading: false, error: null,
  });
  mockApi.post.mockClear();
});

afterEach(() => {
  if (originalNotification === undefined) {
    delete (global as any).Notification;
  } else {
    (global as any).Notification = originalNotification;
  }
  if (originalPushManager === undefined) {
    delete (global as any).PushManager;
  } else {
    (global as any).PushManager = originalPushManager;
  }
});

describe('pushStore.detectPermission', () => {
  it('flags unsupported when Notification is missing', () => {
    delete (global as any).Notification;
    delete (global as any).PushManager;
    usePushStore.getState().detectPermission();
    expect(usePushStore.getState().permission).toBe('unsupported');
  });
});

describe('pushStore.unsubscribe', () => {
  it('returns false silently when push is unsupported', async () => {
    delete (global as any).Notification;
    const ok = await usePushStore.getState().unsubscribe();
    expect(ok).toBe(false);
  });
});

describe('pushStore.subscribe', () => {
  it('records error and returns false in unsupported envs', async () => {
    delete (global as any).Notification;
    const ok = await usePushStore.getState().subscribe();
    expect(ok).toBe(false);
    expect(usePushStore.getState().error).toBe('unsupported');
  });
});
