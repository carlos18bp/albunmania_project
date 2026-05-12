'use client';

import 'leaflet/dist/leaflet.css';

import Link from 'next/link';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import LiveBadge from '@/components/presence/LiveBadge';
import type { CollectorMapEntry } from '@/lib/stores/collectorMapStore';

type Props = {
  collectors: CollectorMapEntry[];
  center: [number, number];
  zoom: number;
};

export default function CollectorMapInner({ collectors, center, zoom }: Props) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {collectors.map((c) => (
        <Marker key={c.user_id} position={[Number(c.lat_approx), Number(c.lng_approx)]}>
          <Popup>
            <strong>{c.display_name}</strong> <LiveBadge online={c.is_online} size="sm" />
            <br />
            <span className="text-xs">{c.city || 'Ubicación aproximada'}</span>
            <br />
            <span className="text-xs">★ {Number(c.rating_avg).toFixed(1)} ({c.rating_count})</span>
            <br />
            <Link href={`/profile/${c.user_id}`} className="text-xs underline">Ver perfil</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
