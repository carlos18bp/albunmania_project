/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

// next/dynamic({ ssr:false }) lazily imports MerchantMapInner (which pulls in
// react-leaflet). For the unit test we replace it with a stub so the wrapper
// can be tested in isolation.
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => function MockedDynamicMap(props: { merchants?: unknown[]; center?: unknown; zoom?: unknown }) {
    return (
      <div
        data-testid="merchant-map-inner-mock"
        data-merchants={String(props.merchants?.length ?? 0)}
        data-zoom={String(props.zoom)}
      />
    );
  },
}));

import MerchantMap from '../MerchantMap';
import type { Merchant } from '../../../lib/stores/merchantStore';

const merchant = (id: number): Merchant => ({
  user_id: id,
  business_name: `Negocio ${id}`,
  business_type: 'papeleria',
  address: 'Cra 7',
  lat: '4.65',
  lng: '-74.07',
  opening_hours: {},
  is_listing_visible: true,
});

describe('MerchantMap', () => {
  it('renders the bordered map wrapper', () => {
    render(<MerchantMap merchants={[]} />);

    expect(screen.getByTestId('merchant-map')).toBeInTheDocument();
  });

  it('forwards the merchants and zoom to the inner map', () => {
    render(<MerchantMap merchants={[merchant(1), merchant(2)]} zoom={13} />);

    const inner = screen.getByTestId('merchant-map-inner-mock');
    expect(inner).toHaveAttribute('data-merchants', '2');
    expect(inner).toHaveAttribute('data-zoom', '13');
  });

  it('defaults the zoom when none is given', () => {
    render(<MerchantMap merchants={[]} />);

    expect(screen.getByTestId('merchant-map-inner-mock')).toHaveAttribute('data-zoom', '11');
  });
});
