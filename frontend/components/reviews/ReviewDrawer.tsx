'use client';

import { useEffect, useState } from 'react';

import ReviewCard from './ReviewCard';
import ReviewSummary from './ReviewSummary';
import { useReviewStore } from '@/lib/stores/reviewStore';

type Props = {
  userId: number;
  open: boolean;
  onClose: () => void;
};

export default function ReviewDrawer({ userId, open, onClose }: Props) {
  const reviews = useReviewStore((s) => s.byUser[userId] ?? []);
  const fetchUserReviews = useReviewStore((s) => s.fetchUserReviews);
  const [filter, setFilter] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    void fetchUserReviews(userId, { stars: filter ?? undefined });
  }, [open, userId, filter, fetchUserReviews]);

  if (!open) return null;

  return (
    <aside
      data-testid="review-drawer"
      role="dialog"
      aria-label="Reseñas"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-card border-l border-border shadow-xl p-4 space-y-4"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Reseñas</h2>
        <button
          type="button"
          onClick={onClose}
          data-testid="review-drawer-close"
          className="rounded-full px-3 py-1 hover:bg-muted"
        >
          ✕
        </button>
      </header>

      <ReviewSummary userId={userId} />

      <div className="flex gap-1 text-xs">
        <button
          type="button"
          data-testid="filter-all"
          onClick={() => setFilter(null)}
          className={`rounded-full px-3 py-1 ${filter === null ? 'bg-emerald-600 text-white' : 'border border-border'}`}
        >
          Todas
        </button>
        {[5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            type="button"
            data-testid={`filter-${s}`}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 ${filter === s ? 'bg-emerald-600 text-white' : 'border border-border'}`}
          >
            {s}★
          </button>
        ))}
      </div>

      {reviews.length === 0 ? (
        <p data-testid="drawer-empty" className="text-sm text-muted-foreground">
          Aún no hay reseñas.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id}>
              <ReviewCard review={r} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
