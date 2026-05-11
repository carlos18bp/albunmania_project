'use client';

import dynamic from 'next/dynamic';

import type { Merchant } from '@/lib/stores/merchantStore';

const MapWithNoSSR = dynamic(() => import('./MerchantMapInner'), { ssr: false });

type Props = {
  merchants: Merchant[];
  center?: [number, number];
  zoom?: number;
};

export default function MerchantMap({ merchants, center = [4.7, -74.0], zoom = 11 }: Props) {
  return (
    <div data-testid="merchant-map" className="h-80 w-full rounded-lg overflow-hidden border border-border">
      <MapWithNoSSR merchants={merchants} center={center} zoom={zoom} />
    </div>
  );
}
