'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import MatchFeed from '@/components/match/MatchFeed';
import { useMatchStore } from '@/lib/stores/matchStore';

type Tab = 'swipe' | 'mine';

export default function MatchPage() {
  const [tab, setTab] = useState<Tab>('swipe');
  const myMatches = useMatchStore((s) => s.myMatches);
  const fetchMine = useMatchStore((s) => s.fetchMine);

  useEffect(() => {
    if (tab === 'mine') void fetchMine();
  }, [tab, fetchMine]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Match</h1>
        <Link
          href="/match/qr"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          QR presencial
        </Link>
      </header>

      <nav className="mb-6 flex gap-1 border-b border-border">
        {(['swipe', 'mine'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            data-testid={`tab-${t}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-muted-foreground'
            }`}
          >
            {t === 'swipe' ? 'Cerca de ti' : 'Mis matches'}
          </button>
        ))}
      </nav>

      {tab === 'swipe' && <MatchFeed />}

      {tab === 'mine' && (
        <ul className="space-y-3" data-testid="my-matches">
          {myMatches.length === 0 ? (
            <li className="text-center text-muted-foreground py-12">Aún no tienes matches.</li>
          ) : (
            myMatches.map((m) => (
              <li key={m.id} className="rounded-lg border border-border p-4">
                <Link href={`/match/${m.id}`} className="font-medium underline">
                  Match #{m.id}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {m.channel} · {m.status}
                </p>
              </li>
            ))
          )}
        </ul>
      )}
    </main>
  );
}
