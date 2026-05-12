'use client';

import { useEffect } from 'react';

import { usePushStore } from '@/lib/stores/pushStore';

/**
 * PushOptInButton — UX surface for Web Push subscription.
 *
 * - Renders nothing if Push is unsupported (older browsers, in-app
 *   webviews) so it never adds dead UI.
 * - Calls Notification.requestPermission() + PushManager.subscribe() on
 *   click; persists the resulting subscription to /api/push/subscribe/.
 * - Reflects the current permission/subscription state in the label.
 */
export default function PushOptInButton() {
  const permission = usePushStore((s) => s.permission);
  const subscribed = usePushStore((s) => s.subscribed);
  const loading = usePushStore((s) => s.loading);
  const detectPermission = usePushStore((s) => s.detectPermission);
  const subscribe = usePushStore((s) => s.subscribe);
  const unsubscribe = usePushStore((s) => s.unsubscribe);

  useEffect(() => {
    detectPermission();
  }, [detectPermission]);

  if (permission === 'unsupported') return null;

  if (permission === 'denied') {
    return (
      <p data-testid="push-denied" className="text-xs text-muted-foreground">
        Las notificaciones están bloqueadas. Habilítalas en los ajustes del navegador.
      </p>
    );
  }

  if (subscribed) {
    return (
      <button
        type="button"
        onClick={() => void unsubscribe()}
        disabled={loading}
        data-testid="push-unsubscribe"
        className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
      >
        {loading ? 'Desactivando…' : 'Desactivar notificaciones'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void subscribe()}
      disabled={loading}
      data-testid="push-subscribe"
      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      {loading ? 'Activando…' : 'Activar notificaciones de match'}
    </button>
  );
}
