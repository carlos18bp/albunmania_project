'use client';

import Image from 'next/image';

import ReviewWidget from '@/components/reviews/ReviewWidget';
import LiveBadge from '@/components/presence/LiveBadge';
import type { MatchCandidate } from '@/lib/stores/matchStore';

type Props = {
  candidate: MatchCandidate;
  onLike: () => void;
  onPass: () => void;
};

export default function SwipeCard({ candidate, onLike, onPass }: Props) {
  const { profile_preview: p, distance_km, stickers_offered, stickers_wanted } = candidate;

  return (
    <article
      data-testid={`swipe-card-${candidate.user_id}`}
      className="w-full max-w-md mx-auto rounded-2xl border border-border bg-card p-6 shadow-md flex flex-col gap-4"
    >
      <header className="flex items-center gap-3">
        {p.avatar_url ? (
          <Image src={p.avatar_url} alt={p.email} width={48} height={48} className="h-12 w-12 rounded-full" unoptimized />
        ) : (
          <div className="h-12 w-12 rounded-full bg-muted" aria-hidden />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {p.email} <LiveBadge online={p.is_online} size="sm" />
          </p>
          <p className="text-xs text-muted-foreground">
            {p.city || 'Cerca de ti'} · {distance_km.toFixed(1)} km
          </p>
        </div>
        <ReviewWidget ratingAvg={p.rating_avg} ratingCount={p.rating_count} />
      </header>

      <section className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium text-emerald-600">Te puede dar</p>
          <p className="text-muted-foreground">{stickers_offered.length} cromos</p>
        </div>
        <div>
          <p className="font-medium text-amber-600">Te puede pedir</p>
          <p className="text-muted-foreground">{stickers_wanted.length} cromos</p>
        </div>
      </section>

      <footer className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onPass}
          data-testid="swipe-pass"
          className="flex-1 rounded-lg border border-border px-4 py-3 font-medium hover:bg-muted"
        >
          Pasar
        </button>
        <button
          type="button"
          onClick={onLike}
          data-testid="swipe-like"
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700"
        >
          Like
        </button>
      </footer>
    </article>
  );
}
