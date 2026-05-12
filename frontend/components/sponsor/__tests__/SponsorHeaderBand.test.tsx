/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/stores/sponsorStore', () => ({
  __esModule: true,
  useSponsorStore: jest.fn(),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src?: string; alt?: string }) => <img src={src} alt={alt} />,
}));

import { useSponsorStore } from '@/lib/stores/sponsorStore';
import SponsorHeaderBand from '../SponsorHeaderBand';

const mockUseSponsorStore = useSponsorStore as unknown as jest.Mock;

type StoreShape = { sponsor: Record<string, unknown> | null };
let storeState: StoreShape;

const sponsor = {
  id: 1,
  brand_name: 'Coca-Cola',
  logo_url: 'https://example.test/coca-cola.png',
  primary_color: '#F40000',
  secondary_color: '#FFFFFF',
  message_text: 'Patrocinador oficial',
  active_from: '2026-04-01T00:00:00Z',
  active_until: '2026-08-01T00:00:00Z',
  is_currently_active: true,
};

beforeEach(() => {
  storeState = { sponsor: null };
  mockUseSponsorStore.mockImplementation((selector: (s: StoreShape) => unknown) => selector(storeState));
});

describe('SponsorHeaderBand', () => {
  it('renders nothing when no sponsor is active', () => {
    const { container } = render(<SponsorHeaderBand />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the "Presentado por" band when a sponsor is active', () => {
    storeState.sponsor = sponsor;
    render(<SponsorHeaderBand />);

    const band = screen.getByTestId('sponsor-header-band');
    expect(band).toHaveTextContent('Presentado por');
  });

  it('renders the sponsor logo with the brand name as alt text', () => {
    storeState.sponsor = sponsor;
    render(<SponsorHeaderBand />);

    const logo = screen.getByRole('img', { name: 'Coca-Cola' });
    expect(logo).toHaveAttribute('src', 'https://example.test/coca-cola.png');
  });
});
