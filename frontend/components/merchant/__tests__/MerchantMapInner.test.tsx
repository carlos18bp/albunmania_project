/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

// react-leaflet renders a real Leaflet map (needs a sized container / canvas);
// stub the primitives so we can assert what MerchantMapInner passes them.
jest.mock('react-leaflet', () => ({
  __esModule: true,
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }: { children: React.ReactNode; position: [number, number] }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)}>{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
}));

import MerchantMapInner from '../MerchantMapInner';
import type { Merchant } from '../../../lib/stores/merchantStore';

const merchants: Merchant[] = [
  { user_id: 1, business_name: 'Papelería El Sol', business_type: 'papeleria', address: 'Cra 7 # 50-15', lat: '4.65', lng: '-74.07' },
  { user_id: 2, business_name: 'Kiosco Norte', business_type: 'kiosco', address: 'Cl 100 # 15-20', lat: 4.69, lng: -74.05 },
];

describe('MerchantMapInner', () => {
  it('renders a map container with a tile layer', () => {
    render(<MerchantMapInner merchants={[]} center={[4.7, -74.0]} zoom={11} />);

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  it('renders one marker per merchant at its coordinates', () => {
    render(<MerchantMapInner merchants={merchants} center={[4.7, -74.0]} zoom={11} />);

    const markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(2);
    expect(markers[0]).toHaveAttribute('data-position', JSON.stringify([4.65, -74.07]));
    expect(markers[1]).toHaveAttribute('data-position', JSON.stringify([4.69, -74.05]));
  });

  it('shows the business details in each marker popup', () => {
    render(<MerchantMapInner merchants={merchants} center={[4.7, -74.0]} zoom={11} />);

    expect(screen.getByText('Papelería El Sol')).toBeInTheDocument();
    expect(screen.getByText('Cra 7 # 50-15')).toBeInTheDocument();
  });
});
