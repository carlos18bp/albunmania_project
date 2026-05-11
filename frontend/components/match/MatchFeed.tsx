'use client';

import { useEffect } from 'react';

import { useMatchStore } from '@/lib/stores/matchStore';
import MutualMatchModal from './MutualMatchModal';
import SwipeCard from './SwipeCard';

export default function MatchFeed() {
  const feed = useMatchStore((s) => s.feed);
  const currentIndex = useMatchStore((s) => s.currentIndex);
  const loading = useMatchStore((s) => s.loading);
  const fetchFeed = useMatchStore((s) => s.fetchFeed);
  const swipeLike = useMatchStore((s) => s.swipeLike);
  const swipePass = useMatchStore((s) => s.swipePass);
  const lastMutual = useMatchStore((s) => s.lastMutual);
  const clearLastMutual = useMatchStore((s) => s.clearLastMutual);

  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed]);

  const candidate = feed[currentIndex];

  if (loading && !candidate) {
    return (
      <p data-testid="feed-loading" className="text-center text-muted-foreground py-12">
        Buscando coleccionistas cerca…
      </p>
    );
  }

  if (!candidate) {
    return (
      <div data-testid="feed-empty" className="text-center text-muted-foreground py-12">
        <p>No hay más candidatos por ahora.</p>
        <button
          type="button"
          onClick={() => void fetchFeed()}
          className="mt-3 text-sm underline"
        >
          Recargar
        </button>
      </div>
    );
  }

  const handleLike = () => {
    const offered = candidate.stickers_offered[0];
    const wanted = candidate.stickers_wanted[0] ?? candidate.stickers_offered[0];
    if (!offered) {
      swipePass();
      return;
    }
    void swipeLike(candidate, offered, wanted);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <SwipeCard candidate={candidate} onLike={handleLike} onPass={swipePass} />
      {lastMutual && lastMutual.mutual && (
        <MutualMatchModal
          matchId={lastMutual.match_id}
          onClose={clearLastMutual}
        />
      )}
    </div>
  );
}
