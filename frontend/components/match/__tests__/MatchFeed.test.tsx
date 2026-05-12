/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/lib/stores/matchStore', () => ({ __esModule: true, useMatchStore: jest.fn() }));
jest.mock('@/lib/stores/adStore', () => ({ __esModule: true, useAdStore: jest.fn() }));
jest.mock('@/components/ads/BannerSlot', () => ({
  __esModule: true,
  default: () => <div data-testid="banner-slot-mock" />,
}));
jest.mock('../SwipeCard', () => ({
  __esModule: true,
  default: ({ onLike, onPass }: { onLike: () => void; onPass: () => void }) => (
    <div data-testid="swipe-card-mock">
      <button onClick={onLike} data-testid="swipe-card-like">like</button>
      <button onClick={onPass} data-testid="swipe-card-pass">pass</button>
    </div>
  ),
}));
jest.mock('../MutualMatchModal', () => ({
  __esModule: true,
  default: ({ matchId }: { matchId: number }) => <div data-testid="mutual-modal-mock">{matchId}</div>,
}));

import { useMatchStore } from '@/lib/stores/matchStore';
import { useAdStore } from '@/lib/stores/adStore';
import MatchFeed from '../MatchFeed';

const mockUseMatchStore = useMatchStore as unknown as jest.Mock;
const mockUseAdStore = useAdStore as unknown as jest.Mock;

const candidate = {
  user_id: 11,
  email: 'camilo@example.com',
  stickers_offered: [{ id: 2, number: '002' }],
  stickers_wanted: [{ id: 34, number: '034' }],
};

type MatchStoreShape = {
  feed: typeof candidate[];
  currentIndex: number;
  loading: boolean;
  fetchFeed: jest.Mock;
  swipeLike: jest.Mock;
  swipePass: jest.Mock;
  lastMutual: { mutual: boolean; match_id: number } | null;
  clearLastMutual: jest.Mock;
};
type AdStoreShape = { noteSwipe: jest.Mock };

let matchState: MatchStoreShape;
let adState: AdStoreShape;

beforeEach(() => {
  matchState = {
    feed: [candidate],
    currentIndex: 0,
    loading: false,
    fetchFeed: jest.fn(),
    swipeLike: jest.fn(),
    swipePass: jest.fn(),
    lastMutual: null,
    clearLastMutual: jest.fn(),
  };
  adState = { noteSwipe: jest.fn().mockReturnValue(false) };
  mockUseMatchStore.mockImplementation((sel: (s: MatchStoreShape) => unknown) => sel(matchState));
  mockUseAdStore.mockImplementation((sel: (s: AdStoreShape) => unknown) => sel(adState));
});

describe('MatchFeed', () => {
  it('fetches the feed on mount', () => {
    render(<MatchFeed />);
    expect(matchState.fetchFeed).toHaveBeenCalledTimes(1);
  });

  it('shows the loading state when the feed is loading with no candidate', () => {
    matchState.feed = [];
    matchState.loading = true;
    render(<MatchFeed />);
    expect(screen.getByTestId('feed-loading')).toBeInTheDocument();
  });

  it('shows the empty state and lets the user reload', () => {
    matchState.feed = [];
    render(<MatchFeed />);
    matchState.fetchFeed.mockClear();

    expect(screen.getByTestId('feed-empty')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Recargar' }));
    expect(matchState.fetchFeed).toHaveBeenCalledTimes(1);
  });

  it('renders the swipe card for the current candidate', () => {
    render(<MatchFeed />);
    expect(screen.getByTestId('swipe-card-mock')).toBeInTheDocument();
  });

  it('likes the candidate with the offered/wanted stickers', () => {
    render(<MatchFeed />);
    fireEvent.click(screen.getByTestId('swipe-card-like'));

    expect(adState.noteSwipe).toHaveBeenCalled();
    expect(matchState.swipeLike).toHaveBeenCalledWith(candidate, candidate.stickers_offered[0], candidate.stickers_wanted[0]);
  });

  it('shows the feed banner once noteSwipe signals the cap', () => {
    adState.noteSwipe = jest.fn().mockReturnValue(true);
    render(<MatchFeed />);
    fireEvent.click(screen.getByTestId('swipe-card-pass'));

    expect(screen.getByTestId('feed-banner-wrapper')).toBeInTheDocument();
  });

  it('renders the mutual match modal when the last like was mutual', () => {
    matchState.lastMutual = { mutual: true, match_id: 5 };
    render(<MatchFeed />);

    expect(screen.getByTestId('mutual-modal-mock')).toHaveTextContent('5');
  });
});
