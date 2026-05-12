'use client';

import Link from 'next/link';

import type { AppNotification } from '@/lib/stores/notificationStore';

type Props = {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
};

const KIND_LABEL: Record<AppNotification['kind'], string> = {
  match_mutual: 'Match mutuo',
  review_received: 'Reseña recibida',
  review_reply: 'Respuesta a tu reseña',
};

export default function NotificationItem({ notification, onOpen }: Props) {
  const date = new Date(notification.created_at).toLocaleString();
  return (
    <li
      data-testid={`notification-${notification.id}`}
      data-read={notification.is_read ? 'true' : 'false'}
      className={`rounded-xl border p-3 ${notification.is_read ? 'border-border bg-card' : 'border-primary/40 bg-primary/5'}`}
    >
      <Link
        href={notification.url || '/'}
        onClick={() => onOpen(notification)}
        className="block space-y-1"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">{notification.title}</span>
          {!notification.is_read && (
            <span data-testid={`notification-${notification.id}-unread-dot`} aria-label="No leída" className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
          )}
        </div>
        {notification.body && <p className="text-sm text-muted-foreground">{notification.body}</p>}
        <p className="text-xs text-muted-foreground">{KIND_LABEL[notification.kind]} · {date}</p>
      </Link>
    </li>
  );
}
