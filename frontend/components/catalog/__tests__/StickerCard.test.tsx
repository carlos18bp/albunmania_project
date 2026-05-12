/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { useInventoryStore } from '../../../lib/stores/inventoryStore';
import StickerCard from '../StickerCard';
import type { Sticker } from '../../../lib/stores/albumStore';

jest.mock('../../../lib/services/http', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src?: string; alt?: string }) => <img src={src} alt={alt} />,
}));

const baseSticker: Sticker = {
  id: 99,
  album: 1,
  number: '042',
  name: 'James Rodríguez',
  team: 'Colombia',
  image_url: 'https://example.test/cromos/042.png',
  is_special_edition: false,
  special_tier: '',
  market_value_estimate: 0,
};

beforeEach(() => {
  jest.useFakeTimers();
  useInventoryStore.getState().clear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('StickerCard', () => {
  it('renders missing state by default', () => {
    render(<StickerCard sticker={baseSticker} />);
    const card = screen.getByTestId('sticker-card-99');
    expect(card.dataset.state).toBe('missing');
    expect(card.dataset.count).toBe('0');
  });

  it('shows the special-edition badge for premium stickers', () => {
    render(<StickerCard sticker={{ ...baseSticker, is_special_edition: true, special_tier: 'gold' }} />);
    expect(screen.getByTestId('special-badge')).toBeInTheDocument();
  });

  it('increments count from 0 → 1 → 2 on consecutive taps', () => {
    render(<StickerCard sticker={baseSticker} />);
    const card = screen.getByTestId('sticker-card-99');

    fireEvent.mouseDown(card);
    fireEvent.mouseUp(card);
    expect(card.dataset.count).toBe('1');
    expect(card.dataset.state).toBe('pasted');

    fireEvent.mouseDown(card);
    fireEvent.mouseUp(card);
    expect(card.dataset.count).toBe('2');
    expect(card.dataset.state).toBe('repeated');
  });

  it('long-press resets the count to 0', () => {
    render(<StickerCard sticker={baseSticker} />);
    const card = screen.getByTestId('sticker-card-99');

    // first set the count to 2
    fireEvent.mouseDown(card);
    fireEvent.mouseUp(card);
    fireEvent.mouseDown(card);
    fireEvent.mouseUp(card);
    expect(card.dataset.count).toBe('2');

    // now long press
    fireEvent.mouseDown(card);
    act(() => {
      jest.advanceTimersByTime(700);
    });
    fireEvent.mouseUp(card);

    expect(card.dataset.count).toBe('0');
    expect(card.dataset.state).toBe('missing');
  });
});
