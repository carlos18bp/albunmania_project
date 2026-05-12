/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const push = jest.fn();
jest.mock('next/navigation', () => ({ __esModule: true, useRouter: () => ({ push }) }));

jest.mock('@/lib/stores/albumStore', () => ({ __esModule: true, useAlbumStore: jest.fn() }));
jest.mock('@/lib/stores/collectorMapStore', () => ({ __esModule: true, useCollectorMapStore: jest.fn() }));

import { useAlbumStore } from '@/lib/stores/albumStore';
import { useCollectorMapStore } from '@/lib/stores/collectorMapStore';
import SearchAutocomplete from '../SearchAutocomplete';

const mockUseAlbumStore = useAlbumStore as unknown as jest.Mock;
const mockUseCollectorMapStore = useCollectorMapStore as unknown as jest.Mock;

let searchStickers: jest.Mock;
let searchCollectors: jest.Mock;

const sticker = (id: number, number: string, name: string) => ({
  id, album: 1, number, name, team: 'Argentina', image_url: '', is_special_edition: id === 1, special_tier: '', market_value_estimate: 0,
});

beforeEach(() => {
  jest.useFakeTimers();
  push.mockReset();
  searchStickers = jest.fn().mockResolvedValue([sticker(1, '10', 'Messi'), sticker(2, '11', 'Di María')]);
  searchCollectors = jest.fn().mockResolvedValue([{ user_id: 7, display_name: 'Lucía Rojas', city: 'Bogotá', avatar_url: '' }]);
  mockUseAlbumStore.mockImplementation((sel: (s: { searchStickers: jest.Mock }) => unknown) => sel({ searchStickers }));
  mockUseCollectorMapStore.mockImplementation((sel: (s: { searchCollectors: jest.Mock }) => unknown) => sel({ searchCollectors }));
});

afterEach(() => {
  jest.useRealTimers();
});

async function flushDebounce() {
  await act(async () => { jest.advanceTimersByTime(200); });
}

describe('SearchAutocomplete', () => {
  it('does not query for a query shorter than 2 chars', async () => {
    render(<SearchAutocomplete slug="mundial-26" value="a" onValueChange={jest.fn()} />);
    await flushDebounce();
    expect(searchStickers).not.toHaveBeenCalled();
    expect(screen.queryByTestId('catalog-suggestions')).not.toBeInTheDocument();
  });

  it('shows sticker and collector suggestions after the debounce', async () => {
    render(<SearchAutocomplete slug="mundial-26" value="messi" onValueChange={jest.fn()} />);
    await flushDebounce();
    expect(searchStickers).toHaveBeenCalledWith('mundial-26', 'messi');
    expect(searchCollectors).toHaveBeenCalledWith('messi');
    await waitFor(() => expect(screen.getByTestId('catalog-suggestions')).toBeInTheDocument());
    expect(screen.getByTestId('suggestion-sticker-1')).toHaveTextContent('Messi');
    expect(screen.getByTestId('suggestion-collector-7')).toHaveTextContent('Lucía Rojas');
  });

  it('picking a sticker suggestion sets the query to its number', async () => {
    const onValueChange = jest.fn();
    render(<SearchAutocomplete slug="mundial-26" value="messi" onValueChange={onValueChange} />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByTestId('suggestion-sticker-1')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('suggestion-sticker-1'));
    expect(onValueChange).toHaveBeenCalledWith('10');
  });

  it('picking a collector suggestion navigates to their profile', async () => {
    render(<SearchAutocomplete slug="mundial-26" value="lucía" onValueChange={jest.fn()} />);
    await flushDebounce();
    await waitFor(() => expect(screen.getByTestId('suggestion-collector-7')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('suggestion-collector-7'));
    expect(push).toHaveBeenCalledWith('/profile/7');
  });
});
