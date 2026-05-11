'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { useSponsorStore } from '@/lib/stores/sponsorStore';

/**
 * SponsorSplash — full-bleed brand splash shown when the PWA opens or
 * after a long absence. Honours the active Presenting Sponsor: logo,
 * "Presentado por <brand>" text, optional message, and the sponsor's
 * primary colour as background.
 *
 * If no sponsor is active the splash falls back to the Albunmanía native
 * palette and a generic tagline.
 *
 * Visibility:
 *   - Auto-shown for `durationMs` ms on mount.
 *   - Tap anywhere or press Enter/Esc to dismiss earlier.
 */
type Props = {
  durationMs?: number;
};

export default function SponsorSplash({ durationMs = 1800 }: Props) {
  const sponsor = useSponsorStore((s) => s.sponsor);
  const loaded = useSponsorStore((s) => s.loaded);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(t);
  }, [durationMs]);

  if (!visible || !loaded) return null;

  const bg = sponsor?.primary_color || '#0b0b10';
  const fg = sponsor?.secondary_color || '#ffffff';

  return (
    <div
      role="dialog"
      aria-label="Albunmanía splash"
      data-testid="sponsor-splash"
      onClick={() => setVisible(false)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && setVisible(false)}
      tabIndex={0}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 px-6 cursor-pointer"
      style={{ backgroundColor: bg, color: fg }}
    >
      <h1 className="text-4xl font-bold tracking-tight">Albunmanía</h1>
      {sponsor ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs uppercase opacity-80">Presentado por</p>
          <Image
            src={sponsor.logo_url}
            alt={sponsor.brand_name}
            width={160}
            height={60}
            className="h-14 w-auto"
            unoptimized
          />
          {sponsor.message_text && (
            <p className="text-sm opacity-90 max-w-md text-center">{sponsor.message_text}</p>
          )}
        </div>
      ) : (
        <p className="text-sm opacity-90 text-center">Mundial 26 · intercambio de cromos</p>
      )}
    </div>
  );
}
