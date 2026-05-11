'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import WhatsAppLinkButton from '@/components/whatsapp/WhatsAppLinkButton';
import WhatsAppOptInToggle from '@/components/whatsapp/WhatsAppOptInToggle';
import { api } from '@/lib/services/http';
import type { MatchSummary } from '@/lib/stores/matchStore';

export default function MatchDetailPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params?.matchId;

  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bothOpted, setBothOpted] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    setLoading(true);
    api
      .get(`match/${matchId}/`)
      .then((res) => {
        if (cancelled) return;
        setMatch(res.data);
      })
      .catch(() => {
        if (cancelled) return;
        setError('load_failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  if (loading) return <main className="px-4 py-8 text-center">Cargando…</main>;
  if (error || !match) return <main className="px-4 py-8 text-center text-red-600">No pudimos cargar el match.</main>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Match #{match.id}</h1>
        <p className="text-sm text-muted-foreground">
          Canal: {match.channel} · Estado: {match.status}
        </p>
      </header>

      <section data-testid="trade-items">
        <h2 className="font-medium mb-2">Cromos a intercambiar</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          {match.trade?.items.map((it, i) => (
            <li key={i}>
              #{it.sticker_id} — de usuario {it.from_user} → {it.to_user}
            </li>
          ))}
        </ul>
      </section>

      {match.trade && (
        <section className="space-y-3">
          <h2 className="font-medium">WhatsApp</h2>
          <WhatsAppOptInToggle
            tradeId={match.trade.id}
            onChange={(s) => setBothOpted(s.both_opted_in)}
          />
          <WhatsAppLinkButton tradeId={match.trade.id} enabled={bothOpted} />
        </section>
      )}
    </main>
  );
}
