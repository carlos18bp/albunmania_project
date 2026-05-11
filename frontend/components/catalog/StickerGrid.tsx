'use client';

import type { Sticker } from '@/lib/stores/albumStore';
import StickerCard from './StickerCard';

type Props = {
  stickers: Sticker[];
  isLoading?: boolean;
};

export default function StickerGrid({ stickers, isLoading }: Props) {
  if (isLoading) {
    return (
      <div data-testid="sticker-grid-loading" className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-7">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (stickers.length === 0) {
    return (
      <p data-testid="sticker-grid-empty" className="text-center text-muted-foreground py-12">
        No hay cromos que coincidan con los filtros.
      </p>
    );
  }

  return (
    <div
      data-testid="sticker-grid"
      className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-7"
    >
      {stickers.map((s) => (
        <StickerCard key={s.id} sticker={s} />
      ))}
    </div>
  );
}
