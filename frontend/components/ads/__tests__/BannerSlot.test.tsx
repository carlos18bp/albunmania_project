/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';

import BannerSlot from '../BannerSlot';
import { useAdStore } from '../../../lib/stores/adStore';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as never)} />;
  },
}));

jest.mock('../../../lib/services/http', () => ({
  api: { get: jest.fn() },
}));

beforeEach(() => {
  useAdStore.setState({ swipesSinceLastBanner: 0, bannersBySlot: {} });
});

describe('BannerSlot', () => {
  it('renders nothing when no banner is served', async () => {
    const { api } = jest.requireMock('../../../lib/services/http') as { api: { get: jest.Mock } };
    api.get.mockResolvedValue({ status: 204, data: null });
    const { container } = render(<BannerSlot slot="home" />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('renders an anchor pointing at the click endpoint', async () => {
    const { api } = jest.requireMock('../../../lib/services/http') as { api: { get: jest.Mock } };
    api.get.mockResolvedValue({
      status: 200,
      data: {
        creative: {
          id: 1, image_url: 'https://x/i.png', headline: 'Coca-Cola',
          body: 'Mundial 26', campaign_advertiser: 'Coca-Cola',
        },
        impression_id: 7,
      },
    });
    render(<BannerSlot slot="home" />);
    const link = await screen.findByTestId('banner-slot-home');
    expect(link.getAttribute('href')).toMatch(/\/ads\/click\/7\/$/);
    expect(screen.getByText('Coca-Cola')).toBeInTheDocument();
  });
});
