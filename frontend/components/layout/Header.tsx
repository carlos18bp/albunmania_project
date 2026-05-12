'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/lib/stores/authStore';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Header — top bar with manual link, theme toggle and auth-dependent CTAs.
 *
 * The auth-dependent slot uses the standard "mounted" pattern (same as
 * ThemeToggle) to avoid the hydration mismatch that React 19 + Next.js
 * 16 trigger when `useAuthStore.isAuthenticated` is computed differently
 * on the server (always false — no cookies) than on the client (true when
 * the access_token cookie exists). Rendering an inert placeholder until
 * mount keeps server + first client render byte-identical.
 */
export default function Header() {
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => setMounted(true), []);

  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur"
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link className="font-semibold tracking-tight" href="/">
          Albunmanía
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link
            className="px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={ROUTES.MANUAL}
          >
            Manual
          </Link>

          <ThemeToggle />

          {!mounted ? (
            // Reserve space (≈ width of the worst-case auth slot) so the
            // header layout doesn't shift once the real buttons appear.
            <div
              data-testid="header-auth-placeholder"
              className="h-9 w-44"
              aria-hidden
            />
          ) : isAuthenticated ? (
            <>
              <Link
                className="px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/match"
              >
                Match
              </Link>
              <Link
                className="px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/profile/me"
              >
                Mi perfil
              </Link>
              <Link
                className="px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/dashboard"
              >
                Cuenta
              </Link>
              <button
                data-testid="header-signout"
                className="border border-border rounded-full px-4 py-2 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={signOut}
                type="button"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                className="border border-border rounded-full px-4 py-2 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/sign-in"
              >
                Entrar
              </Link>
              <Link
                className="bg-primary text-primary-foreground rounded-full px-4 py-2 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href="/sign-up"
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
