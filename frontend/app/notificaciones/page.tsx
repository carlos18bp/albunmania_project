'use client';

import { useEffect, useState } from 'react';

import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useNotificationStore, type AppNotification } from '@/lib/stores/notificationStore';
import NotificationItem from '@/components/notifications/NotificationItem';

export default function NotificacionesPage() {
  const { isAuthenticated } = useRequireAuth();
  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchNotifications(unreadOnly).catch(() => undefined);
    void fetchUnreadCount().catch(() => undefined);
  }, [isAuthenticated, unreadOnly, fetchNotifications, fetchUnreadCount]);

  if (!isAuthenticated) return null;

  const handleOpen = (n: AppNotification) => {
    if (!n.is_read) void markRead(n.id).catch(() => undefined);
  };

  return (
    <main data-testid="notifications-page" className="max-w-2xl mx-auto px-6 py-10 space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Notificaciones{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              data-testid="notifications-unread-only"
            />
            Sólo no leídas
          </label>
          <button
            type="button"
            data-testid="notifications-mark-all"
            onClick={() => void markAllRead().catch(() => undefined)}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Marcar todas como leídas
          </button>
        </div>
      </header>

      {items.length === 0 ? (
        <p data-testid="notifications-empty" className="py-8 text-center text-sm text-muted-foreground">
          {unreadOnly ? 'No tienes notificaciones sin leer.' : 'Aún no tienes notificaciones.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <NotificationItem key={n.id} notification={n} onOpen={handleOpen} />
          ))}
        </ul>
      )}
    </main>
  );
}
