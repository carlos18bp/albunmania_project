'use client';

import dynamic from 'next/dynamic';

import type { CollectorMapEntry } from '@/lib/stores/collectorMapStore';

const MapWithNoSSR = dynamic(() => import('./CollectorMapInner'), { ssr: false });

type Props = {
  collectors: CollectorMapEntry[];
  center?: [number, number];
  zoom?: number;
};

export default function CollectorMap({ collectors, center = [4.65, -74.1], zoom = 11 }: Props) {
  return (
    <div data-testid="collector-map" className="h-80 w-full rounded-lg overflow-hidden border border-border">
      <MapWithNoSSR collectors={collectors} center={center} zoom={zoom} />
    </div>
  );
}
