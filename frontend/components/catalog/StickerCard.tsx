'use client';

import Image from 'next/image';
import { useRef } from 'react';

import { cn } from '@/lib/utils';
import type { Sticker } from '@/lib/stores/albumStore';
import { useInventoryStore } from '@/lib/stores/inventoryStore';

type Props = {
  sticker: Sticker;
};

const LONG_PRESS_MS = 600;

export default function StickerCard({ sticker }: Props) {
  const count = useInventoryStore((s) => s.entries[sticker.id]?.count ?? 0);
  const tap = useInventoryStore((s) => s.tap);
  const longPressReset = useInventoryStore((s) => s.longPressReset);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const startPress = () => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      longPressReset(sticker.id);
    }, LONG_PRESS_MS);
  };

  const endPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!longPressFired.current) tap(sticker.id);
  };

  const cancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressFired.current = false;
  };

  const stateLabel = count === 0 ? 'missing' : count === 1 ? 'pasted' : 'repeated';

  return (
    <button
      type="button"
      data-testid={`sticker-card-${sticker.id}`}
      data-state={stateLabel}
      data-count={count}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={cancelPress}
      aria-label={`${sticker.number} · ${sticker.name} (${stateLabel})`}
      className={cn(
        'relative flex flex-col items-center justify-between gap-2 rounded-lg border p-3 transition-all select-none',
        count === 0 && 'border-dashed border-border bg-card opacity-60',
        count === 1 && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
        count >= 2 && 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
      )}
    >
      {sticker.is_special_edition && (
        <span
          data-testid="special-badge"
          className="absolute -top-2 -right-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-950 shadow-md ring-2 ring-yellow-200"
          title={sticker.special_tier}
        >
          ★
        </span>
      )}
      <div className="text-xs text-muted-foreground font-mono">#{sticker.number}</div>
      {sticker.image_url ? (
        <Image
          src={sticker.image_url}
          alt={sticker.name}
          width={80}
          height={100}
          className="h-20 w-auto object-contain"
          unoptimized
        />
      ) : (
        <div className="h-20 w-16 rounded bg-muted" aria-hidden />
      )}
      <div className="text-center">
        <div className="text-sm font-medium leading-tight line-clamp-1">{sticker.name}</div>
        <div className="text-xs text-muted-foreground">{sticker.team}</div>
      </div>
      {count > 0 && (
        <span
          data-testid="count-badge"
          className={cn(
            'absolute top-1 left-1 rounded-full px-2 py-0.5 text-xs font-bold',
            count === 1 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white',
          )}
        >
          {count >= 2 ? `${count}×` : '✓'}
        </span>
      )}
    </button>
  );
}
