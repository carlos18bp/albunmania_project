'use client';

import Image from 'next/image';

import { useSponsorStore } from '@/lib/stores/sponsorStore';

/**
 * SponsorHeaderBand — discreet "Presentado por <brand>" band rendered
 * below the main Header on every page when a Presenting Sponsor is active.
 *
 * Hidden when no sponsor is active (no DOM, no whitespace).
 */
export default function SponsorHeaderBand() {
  const sponsor = useSponsorStore((s) => s.sponsor);
  if (!sponsor) return null;

  return (
    <div
      data-testid="sponsor-header-band"
      className="border-b border-border bg-card/50"
      style={{
        background: `linear-gradient(90deg, ${sponsor.primary_color}10, transparent)`,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-1.5 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Presentado por</span>
        <Image
          src={sponsor.logo_url}
          alt={sponsor.brand_name}
          width={64}
          height={20}
          className="h-4 w-auto"
          unoptimized
        />
      </div>
    </div>
  );
}
