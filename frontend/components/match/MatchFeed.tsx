'use client';

import { useEffect, useState } from 'react';

import BannerSlot from '@/components/ads/BannerSlot';
import { useAdStore } from '@/lib/stores/adStore';
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

  const noteSwipe = useAdStore((s) => s.noteSwipe);
  const [bannerKey, setBannerKey] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed]);

  const noteAndMaybeShowBanner = () => {
    if (noteSwipe()) {
      setShowBanner(true);
      setBannerKey((k) => k + 1);
    }
  };

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
    noteAndMaybeShowBanner();
    const offered = candidate.stickers_offered[0];
    const wanted = candidate.stickers_wanted[0] ?? candidate.stickers_offered[0];
    if (!offered) {
      swipePass();
      return;
    }
    void swipeLike(candidate, offered, wanted);
  };

  const handlePass = () => {
    noteAndMaybeShowBanner();
    swipePass();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <SwipeCard candidate={candidate} onLike={handleLike} onPass={handlePass} />
      {showBanner && (
        <div className="w-full max-w-md" data-testid="feed-banner-wrapper">
          <BannerSlot slot="feed" refreshKey={bannerKey} />
        </div>
      )}
      {lastMutual && lastMutual.mutual && (
        <MutualMatchModal
          matchId={lastMutual.match_id}
          onClose={clearLastMutual}
        />
      )}
    </div>
  );
}
