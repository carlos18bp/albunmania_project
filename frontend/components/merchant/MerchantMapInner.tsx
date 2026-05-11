'use client';

import 'leaflet/dist/leaflet.css';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import type { Merchant } from '@/lib/stores/merchantStore';

type Props = {
  merchants: Merchant[];
  center: [number, number];
  zoom: number;
};

export default function MerchantMapInner({ merchants, center, zoom }: Props) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {merchants.map((m) => (
        <Marker key={m.user_id} position={[Number(m.lat), Number(m.lng)]}>
          <Popup>
            <strong>{m.business_name}</strong>
            <br />
            <span>{m.business_type}</span>
            <br />
            <span className="text-xs">{m.address}</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
