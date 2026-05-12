'use client';

import Link from 'next/link';

import PushOptInButton from '@/components/push/PushOptInButton';
import RankingList from '@/components/stats/RankingList';
import StatCard from '@/components/stats/StatCard';
import ActiveCollectorsBanner from '@/components/presence/ActiveCollectorsBanner';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useAuthStore } from '@/lib/stores/authStore';

export default function DashboardPage() {
  const { isAuthenticated } = useRequireAuth();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  if (!isAuthenticated) return null;

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mi álbum</h1>
        <div className="flex gap-2">
          <Link
            className="border border-border rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            href="/match"
          >
            Match
          </Link>
          <button
            className="border border-border rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            type="button"
            onClick={signOut}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <ActiveCollectorsBanner city={profile?.city || undefined} />

      <section className="space-y-3">
        <h2 className="font-medium">Tu progreso</h2>
        <StatCard />
      </section>

      <section className="space-y-2" data-testid="push-section">
        <h2 className="font-medium">Notificaciones</h2>
        <p className="text-sm text-muted-foreground">
          Recibe un aviso al instante cuando aparece un match mutuo.
        </p>
        <PushOptInButton />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Ranking en {profile?.city || 'tu ciudad'}</h2>
        <RankingList
          albumId={profile?.active_album_id ?? null}
          city={profile?.city ?? ''}
        />
      </section>
    </main>
  );
}
