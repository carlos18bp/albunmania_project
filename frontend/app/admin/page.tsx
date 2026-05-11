'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useAuthStore } from '@/lib/stores/authStore';

const ADMIN_ROLES = new Set(['web_manager', 'admin']);

export default function AdminLandingPage() {
  const { isAuthenticated } = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user && !ADMIN_ROLES.has(user.role) && !user.is_staff) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) return null;
  if (!ADMIN_ROLES.has(user.role) && !user.is_staff) return null;

  const tiles = [
    { href: '/admin/users', title: 'Usuarios y roles', body: 'Asignar Coleccionista, Comerciante, Web Manager o Admin. Bloquear cuentas.' },
    { href: '/admin/moderation', title: 'Moderación de reseñas', body: 'Cola de reportes pendientes. Toggle de visibilidad sin borrar.' },
  ];

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Panel administrativo</h1>
        <p className="text-sm text-muted-foreground">
          Sesión como <span className="font-medium">{user.email}</span> · rol {user.role}
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2" data-testid="admin-tiles">
        {tiles.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="block rounded-lg border border-border p-4 hover:bg-muted"
            >
              <p className="font-medium">{t.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
