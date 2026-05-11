'use client';

type Props = {
  ratingAvg: number | string;
  ratingCount: number;
  onClick?: () => void;
};

/**
 * Compact reputation badge: ★ 4.8 (23). Reusable on Match SwipeCard,
 * Trade detail and Profile header. Click handler is optional — when
 * provided, the widget is interactive (e.g. opens the Reviews drawer).
 */
export default function ReviewWidget({ ratingAvg, ratingCount, onClick }: Props) {
  const avg = Number(ratingAvg) || 0;
  const interactive = !!onClick;

  const content = (
    <span data-testid="review-widget" className="inline-flex items-center gap-1 text-sm">
      <span className="text-yellow-500">★</span>
      <span className="font-medium">{avg.toFixed(1)}</span>
      <span className="text-muted-foreground">({ratingCount})</span>
    </span>
  );

  if (!interactive) return content;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="review-widget-button"
      className="rounded-full px-2 py-1 hover:bg-muted"
    >
      {content}
    </button>
  );
}
