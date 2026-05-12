'use client';

import { useEffect } from 'react';

import { usePresenceStore } from '@/lib/stores/presenceStore';
import { useAuthStore } from '@/lib/stores/authStore';

const PING_INTERVAL_MS = 120_000;

/**
 * Mounted once in the root layout. While the user is signed in and the tab is
 * visible, sends a lightweight heartbeat so the "en línea ahora" Live Badge
 * stays warm. Renders nothing.
 */
export default function PresencePinger() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const ping = usePresenceStore((s) => s.ping);

  useEffect(() => {
    if (!isAuthenticated) return;

    const beat = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') void ping();
    };
    beat();
    const timer = setInterval(beat, PING_INTERVAL_MS);
    document.addEventListener('visibilitychange', beat);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', beat);
    };
  }, [isAuthenticated, ping]);

  return null;
}
