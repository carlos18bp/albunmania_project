'use client';

import StarRating from './StarRating';
import type { Review } from '@/lib/stores/reviewStore';

type Props = {
  review: Review;
};

const TAG_LABELS: Record<string, string> = {
  puntual: 'Puntual',
  cromos_buen_estado: 'Cromos en buen estado',
  buena_comunicacion: 'Buena comunicación',
  amable: 'Amable',
  rapido: 'Rápido',
  ubicacion_facil: 'Ubicación fácil',
  no_show: 'No-show',
  cromos_mal_estado: 'Cromos en mal estado',
  mala_comunicacion: 'Mala comunicación',
};

export default function ReviewCard({ review }: Props) {
  const date = new Date(review.created_at).toLocaleDateString();
  return (
    <article
      data-testid={`review-card-${review.id}`}
      className="rounded-lg border border-border p-4 space-y-2"
    >
      <header className="flex items-center justify-between text-sm">
        <span className="font-medium truncate">{review.reviewer_email}</span>
        <span className="text-xs text-muted-foreground">{date}</span>
      </header>

      <StarRating value={review.stars} readOnly size="sm" />

      {review.comment && <p className="text-sm">{review.comment}</p>}

      {review.tags?.length > 0 && (
        <ul className="flex flex-wrap gap-1">
          {review.tags.map((t) => (
            <li
              key={t}
              className="text-xs rounded-full bg-muted px-2 py-0.5"
              data-testid={`review-tag-${t}`}
            >
              {TAG_LABELS[t] ?? t}
            </li>
          ))}
        </ul>
      )}

      {review.reply && (
        <blockquote
          data-testid={`review-reply-${review.id}`}
          className="border-l-2 border-emerald-500 pl-3 text-sm text-muted-foreground"
        >
          <p className="font-medium text-foreground">{review.reviewee_email} respondió:</p>
          <p>{review.reply}</p>
        </blockquote>
      )}
    </article>
  );
}
