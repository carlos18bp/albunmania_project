'use client';

/**
 * "En línea ahora" Live Badge — a small green dot shown next to a collector's
 * name on profiles, swipe/match cards and city leaderboards. Renders nothing
 * when the collector is offline.
 */
type Props = {
  online: boolean | undefined;
  /** Show the "En línea" label next to the dot. */
  withLabel?: boolean;
  size?: 'sm' | 'md';
};

export default function LiveBadge({ online, withLabel = false, size = 'md' }: Props) {
  if (!online) return null;
  const dot = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  return (
    <span
      data-testid="live-badge"
      className="inline-flex items-center gap-1 align-middle text-xs font-medium text-emerald-600"
      title="En línea ahora"
    >
      <span className={`${dot} rounded-full bg-emerald-500 ring-2 ring-emerald-500/30`} aria-hidden="true" />
      <span className="sr-only">En línea ahora</span>
      {withLabel && <span aria-hidden="true">En línea</span>}
    </span>
  );
}
