/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/stores/reviewStore', () => ({
  __esModule: true,
  useReviewStore: jest.fn(),
}));

import { useReviewStore } from '@/lib/stores/reviewStore';
import ReviewSummary from '../ReviewSummary';

const mockUseReviewStore = useReviewStore as unknown as jest.Mock;

type StoreShape = {
  summaryByUser: Record<number, unknown>;
  fetchUserSummary: jest.Mock;
};
let storeState: StoreShape;

const summary = {
  user_id: 11,
  rating_avg: '4.5',
  rating_count: 2,
  positive_pct: '100',
  distribution: { '5': 1, '4': 1, '3': 0, '2': 0, '1': 0 },
  top_tags: [{ tag: 'puntual', count: 2 }, { tag: 'amable', count: 1 }],
};

beforeEach(() => {
  storeState = { summaryByUser: {}, fetchUserSummary: jest.fn() };
  mockUseReviewStore.mockImplementation((selector: (s: StoreShape) => unknown) => selector(storeState));
});

describe('ReviewSummary', () => {
  it('shows the loading state when no summary is cached', () => {
    render(<ReviewSummary userId={11} />);

    expect(screen.getByTestId('summary-loading')).toBeInTheDocument();
  });

  it('fetches the summary when none is cached', () => {
    render(<ReviewSummary userId={11} />);

    expect(storeState.fetchUserSummary).toHaveBeenCalledWith(11);
  });

  it('renders the average rating, count and positive percentage once loaded', () => {
    storeState.summaryByUser[11] = summary;
    render(<ReviewSummary userId={11} />);

    const block = screen.getByTestId('review-summary');
    expect(block).toHaveTextContent('4.5');
    expect(block).toHaveTextContent('2 reseñas');
    expect(block).toHaveTextContent('100% positivas');
  });

  it('renders a distribution bar per star level', () => {
    storeState.summaryByUser[11] = summary;
    render(<ReviewSummary userId={11} />);

    for (const s of [5, 4, 3, 2, 1]) {
      expect(screen.getByTestId(`bar-${s}`)).toBeInTheDocument();
    }
  });

  it('renders the top tags with their counts', () => {
    storeState.summaryByUser[11] = summary;
    render(<ReviewSummary userId={11} />);

    expect(screen.getByTestId('top-tag-puntual')).toHaveTextContent('Puntual · 2');
    expect(screen.getByTestId('top-tag-amable')).toHaveTextContent('Amable · 1');
  });

  it('does not re-fetch when the summary is already cached', () => {
    storeState.summaryByUser[11] = summary;
    render(<ReviewSummary userId={11} />);

    expect(storeState.fetchUserSummary).not.toHaveBeenCalled();
  });
});
