/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('@/lib/services/http', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

import { api } from '@/lib/services/http';
import { useNotificationStore, type AppNotification } from '../notificationStore';

const mockGet = api.get as unknown as jest.Mock;
const mockPost = api.post as unknown as jest.Mock;

const notif = (id: number, isRead = false): AppNotification => ({
  id,
  kind: 'match_mutual',
  title: `Notif ${id}`,
  body: '',
  url: `/match/${id}`,
  actor: null,
  actor_email: null,
  match: id,
  review: null,
  read_at: isRead ? new Date().toISOString() : null,
  is_read: isRead,
  created_at: new Date().toISOString(),
});

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  useNotificationStore.getState().clear();
});

describe('notificationStore', () => {
  it('fetches notifications into items', async () => {
    mockGet.mockResolvedValue({ data: { results: [notif(1), notif(2)] } });

    const items = await useNotificationStore.getState().fetchNotifications();

    expect(mockGet).toHaveBeenCalledWith('notifications/', { params: {} });
    expect(items).toHaveLength(2);
    expect(useNotificationStore.getState().items).toHaveLength(2);
  });

  it('passes unread=true when unreadOnly is set', async () => {
    mockGet.mockResolvedValue({ data: { results: [] } });

    await useNotificationStore.getState().fetchNotifications(true);

    expect(mockGet).toHaveBeenCalledWith('notifications/', { params: { unread: 'true' } });
  });

  it('records an error flag when the fetch fails', async () => {
    mockGet.mockRejectedValue(new Error('boom'));

    await expect(useNotificationStore.getState().fetchNotifications()).rejects.toThrow();
    expect(useNotificationStore.getState().error).toBe('fetch_notifications_failed');
  });

  it('fetches the unread count', async () => {
    mockGet.mockResolvedValue({ data: { count: 5 } });

    const count = await useNotificationStore.getState().fetchUnreadCount();

    expect(mockGet).toHaveBeenCalledWith('notifications/unread-count/');
    expect(count).toBe(5);
    expect(useNotificationStore.getState().unreadCount).toBe(5);
  });

  it('marks one notification as read and decrements the unread count', async () => {
    mockGet.mockResolvedValue({ data: { results: [notif(1), notif(2, true)] } });
    await useNotificationStore.getState().fetchNotifications();
    useNotificationStore.setState({ unreadCount: 1 });
    mockPost.mockResolvedValue({ data: {} });

    await useNotificationStore.getState().markRead(1);

    expect(mockPost).toHaveBeenCalledWith('notifications/1/read/');
    const state = useNotificationStore.getState();
    expect(state.items.find((n) => n.id === 1)!.is_read).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('marks all notifications as read', async () => {
    mockGet.mockResolvedValue({ data: { results: [notif(1), notif(2)] } });
    await useNotificationStore.getState().fetchNotifications();
    useNotificationStore.setState({ unreadCount: 2 });
    mockPost.mockResolvedValue({ data: { marked_read: 2 } });

    await useNotificationStore.getState().markAllRead();

    expect(mockPost).toHaveBeenCalledWith('notifications/read-all/');
    const state = useNotificationStore.getState();
    expect(state.items.every((n) => n.is_read)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });
});
