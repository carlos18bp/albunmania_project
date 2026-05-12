/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('../../../lib/services/http', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img {...(props as never)} />,
}));

import { useInventoryStore } from '../../../lib/stores/inventoryStore';
import StickerGrid from '../StickerGrid';
import type { Sticker } from '../../../lib/stores/albumStore';

const sticker = (id: number): Sticker => ({
  id,
  album: 1,
  number: String(id).padStart(3, '0'),
  name: `Jugador ${id}`,
  team: 'Colombia',
  image_url: '',
  is_special_edition: false,
  special_tier: '',
  market_value_estimate: 0,
});

beforeEach(() => {
  useInventoryStore.getState().clear();
});

describe('StickerGrid', () => {
  it('renders the skeleton placeholders while loading', () => {
    render(<StickerGrid stickers={[]} isLoading />);

    const skeleton = screen.getByTestId('sticker-grid-loading');
    expect(skeleton.children).toHaveLength(14);
  });

  it('renders the empty state when there are no stickers', () => {
    render(<StickerGrid stickers={[]} />);

    expect(screen.getByTestId('sticker-grid-empty')).toBeInTheDocument();
  });

  it('renders one StickerCard per sticker', () => {
    render(<StickerGrid stickers={[sticker(1), sticker(2), sticker(3)]} />);

    expect(screen.getByTestId('sticker-grid')).toBeInTheDocument();
    expect(screen.getByTestId('sticker-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('sticker-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('sticker-card-3')).toBeInTheDocument();
  });
});
