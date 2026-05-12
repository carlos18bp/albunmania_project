/// <reference types="jest" />
import { describe, it, expect, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import NotificationItem from '../NotificationItem';
import type { AppNotification } from '../../../lib/stores/notificationStore';

const base: AppNotification = {
  id: 7,
  kind: 'match_mutual',
  title: '¡Match en Albunmanía!',
  body: 'camilo@example.com también quiere intercambiar contigo.',
  url: '/match/3',
  actor: 11,
  actor_email: 'camilo@example.com',
  match: 3,
  review: null,
  read_at: null,
  is_read: false,
  created_at: '2026-05-01T12:00:00Z',
};

describe('NotificationItem', () => {
  it('renders the title, body and kind label', () => {
    render(<NotificationItem notification={base} onOpen={jest.fn()} />);
    const item = screen.getByTestId('notification-7');
    expect(item).toHaveTextContent('¡Match en Albunmanía!');
    expect(item).toHaveTextContent('camilo@example.com también quiere intercambiar contigo.');
    expect(item).toHaveTextContent('Match mutuo');
  });

  it('links to the notification url', () => {
    render(<NotificationItem notification={base} onOpen={jest.fn()} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/match/3');
  });

  it('shows the unread dot and marks data-read=false when unread', () => {
    render(<NotificationItem notification={base} onOpen={jest.fn()} />);
    expect(screen.getByTestId('notification-7')).toHaveAttribute('data-read', 'false');
    expect(screen.getByTestId('notification-7-unread-dot')).toBeInTheDocument();
  });

  it('hides the unread dot and marks data-read=true when read', () => {
    render(<NotificationItem notification={{ ...base, is_read: true, read_at: '2026-05-01T13:00:00Z' }} onOpen={jest.fn()} />);
    expect(screen.getByTestId('notification-7')).toHaveAttribute('data-read', 'true');
    expect(screen.queryByTestId('notification-7-unread-dot')).not.toBeInTheDocument();
  });

  it('calls onOpen with the notification when the link is clicked', () => {
    const onOpen = jest.fn();
    render(<NotificationItem notification={base} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('link'));
    expect(onOpen).toHaveBeenCalledWith(base);
  });
});
