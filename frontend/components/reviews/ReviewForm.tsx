'use client';

import { useState } from 'react';

import StarRating from './StarRating';
import { REVIEW_TAGS, useReviewStore } from '@/lib/stores/reviewStore';
import type { ReviewTag } from '@/lib/stores/reviewStore';

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

type Props = {
  tradeId: number;
  onSubmitted?: () => void;
};

export default function ReviewForm({ tradeId, onSubmitted }: Props) {
  const createReview = useReviewStore((s) => s.createReview);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<ReviewTag>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: ReviewTag) => {
    const next = new Set(selectedTags);
    next.has(tag) ? next.delete(tag) : next.add(tag);
    setSelectedTags(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars < 1) {
      setError('stars_required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createReview(tradeId, {
        stars,
        comment: comment.trim() || undefined,
        tags: Array.from(selectedTags),
      });
      onSubmitted?.();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(detail || 'submit_failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="review-form" className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">Tu calificación</p>
        <StarRating value={stars} onChange={setStars} size="lg" />
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Tags</p>
        <ul className="flex flex-wrap gap-2">
          {REVIEW_TAGS.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                data-testid={`tag-${tag}`}
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  selectedTags.has(tag)
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {TAG_LABELS[tag] ?? tag}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <label className="block text-sm">
        Comentario (opcional)
        <textarea
          value={comment}
          maxLength={500}
          onChange={(e) => setComment(e.target.value)}
          data-testid="review-comment"
          className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 min-h-[100px]"
        />
        <span className="text-xs text-muted-foreground">{comment.length}/500</span>
      </label>

      {error === 'stars_required' && (
        <p className="text-sm text-red-600" data-testid="review-error">
          Debes seleccionar una calificación.
        </p>
      )}
      {error === 'already_reviewed' && (
        <p className="text-sm text-amber-600" data-testid="review-error">
          Ya calificaste este intercambio.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        data-testid="review-submit"
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Enviando…' : 'Calificar'}
      </button>
    </form>
  );
}
