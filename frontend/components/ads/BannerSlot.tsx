'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { useAdStore } from '@/lib/stores/adStore';

type Props = {
  slot: 'home' | 'feed';
  city?: string;
  refreshKey?: number;
};

export default function BannerSlot({ slot, city, refreshKey = 0 }: Props) {
  const fetchBanner = useAdStore((s) => s.fetchBanner);
  const clickUrl = useAdStore((s) => s.clickUrl);
  const [banner, setBanner] = useState<Awaited<ReturnType<typeof fetchBanner>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchBanner(slot, city).then((b) => {
      if (!cancelled) setBanner(b);
    });
    return () => {
      cancelled = true;
    };
  }, [slot, city, refreshKey, fetchBanner]);

  if (!banner) return null;

  return (
    <a
      href={clickUrl(banner.impression_id)}
      target="_blank"
      rel="noopener noreferrer sponsored"
      data-testid={`banner-slot-${slot}`}
      className="block rounded-lg overflow-hidden border border-border bg-card"
    >
      <Image
        src={banner.creative.image_url}
        alt={banner.creative.headline || banner.creative.campaign_advertiser}
        width={1200}
        height={300}
        className="h-auto w-full"
        unoptimized
      />
      {(banner.creative.headline || banner.creative.body) && (
        <div className="px-3 py-2 text-sm">
          {banner.creative.headline && <p className="font-medium">{banner.creative.headline}</p>}
          {banner.creative.body && <p className="text-muted-foreground">{banner.creative.body}</p>}
        </div>
      )}
      <p className="px-3 pb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        Publicidad · {banner.creative.campaign_advertiser}
      </p>
    </a>
  );
}
