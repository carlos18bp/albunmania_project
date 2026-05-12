/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('react-leaflet', () => ({
  __esModule: true,
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }: { children: React.ReactNode; position: [number, number] }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)}>{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import CollectorMapInner from '../CollectorMapInner';
import type { CollectorMapEntry } from '../../../lib/stores/collectorMapStore';

const collectors: CollectorMapEntry[] = [
  { user_id: 1, display_name: 'Lucía Rojas', city: 'Bogotá', avatar_url: '', lat_approx: 4.65, lng_approx: -74.07, rating_avg: 4.8, rating_count: 12, is_online: true },
  { user_id: 2, display_name: 'Camilo Pérez', city: 'Medellín', avatar_url: '', lat_approx: 6.24, lng_approx: -75.58, rating_avg: 4.2, rating_count: 5, is_online: false },
];

describe('CollectorMapInner', () => {
  it('renders a map container with a tile layer', () => {
    render(<CollectorMapInner collectors={[]} center={[4.7, -74.0]} zoom={11} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  it('renders one marker per collector at its approximate coordinates', () => {
    render(<CollectorMapInner collectors={collectors} center={[4.7, -74.0]} zoom={11} />);
    const markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(2);
    expect(markers[0]).toHaveAttribute('data-position', JSON.stringify([4.65, -74.07]));
  });

  it('shows the collector name and a profile link in the popup', () => {
    render(<CollectorMapInner collectors={collectors} center={[4.7, -74.0]} zoom={11} />);
    expect(screen.getByText('Lucía Rojas')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Ver perfil' })[0]).toHaveAttribute('href', '/profile/1');
  });

  it('shows the Live Badge only for online collectors', () => {
    render(<CollectorMapInner collectors={collectors} center={[4.7, -74.0]} zoom={11} />);
    expect(screen.getAllByTestId('live-badge')).toHaveLength(1);
  });
});
