'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuthStore } from '@/lib/stores/authStore';

export default function HeroCTA() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-12 w-48" data-testid="hero-cta-placeholder" aria-hidden />;
  }

  if (isAuthenticated) {
    return (
      <Link
        data-testid="hero-cta-profile"
        className="bg-primary text-primary-foreground rounded-full px-5 py-3 hover:bg-primary/90 shadow-sm"
        href="/profile/me"
      >
        Ver mi perfil
      </Link>
    );
  }

  return (
    <Link
      data-testid="hero-cta-signup"
      className="bg-primary text-primary-foreground rounded-full px-5 py-3 hover:bg-primary/90 shadow-sm"
      href="/sign-up"
    >
      Registrarme con Google
    </Link>
  );
}
