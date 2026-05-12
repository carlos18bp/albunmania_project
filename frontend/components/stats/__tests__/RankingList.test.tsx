/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/stores/statsStore', () => ({
  __esModule: true,
  useStatsStore: jest.fn(),
}));

import { useStatsStore } from '@/lib/stores/statsStore';
import RankingList from '../RankingList';

const mockUseStatsStore = useStatsStore as unknown as jest.Mock;

type StoreShape = {
  ranking: Array<{ user_id: number; email: string; pasted_count: number }>;
  fetchRanking: jest.Mock;
  loading: boolean;
};
let storeState: StoreShape;

beforeEach(() => {
  storeState = { ranking: [], fetchRanking: jest.fn(), loading: false };
  mockUseStatsStore.mockImplementation((selector: (s: StoreShape) => unknown) => selector(storeState));
});

describe('RankingList', () => {
  it('shows the setup hint when there is no active album', () => {
    render(<RankingList albumId={null} city="Bogotá" />);

    expect(screen.getByTestId('ranking-empty-config')).toBeInTheDocument();
  });

  it('shows the setup hint when the city is missing', () => {
    render(<RankingList albumId={1} city="" />);

    expect(screen.getByTestId('ranking-empty-config')).toBeInTheDocument();
  });

  it('fetches the ranking when album and city are set', () => {
    render(<RankingList albumId={1} city="Bogotá" />);

    expect(storeState.fetchRanking).toHaveBeenCalledWith(1, 'Bogotá');
  });

  it('shows the empty state when the ranking has no entries', () => {
    render(<RankingList albumId={1} city="Bogotá" />);

    expect(screen.getByTestId('ranking-empty')).toHaveTextContent('Aún no hay coleccionistas activos en Bogotá.');
  });

  it('renders each ranked collector with its position and pasted count', () => {
    storeState.ranking = [
      { user_id: 10, email: 'lucia@example.com', pasted_count: 48 },
      { user_id: 11, email: 'camilo@example.com', pasted_count: 41 },
    ];
    render(<RankingList albumId={1} city="Bogotá" />);

    const list = screen.getByTestId('ranking-list');
    const items = list.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('#1');
    expect(items[0]).toHaveTextContent('lucia@example.com');
    expect(items[0]).toHaveTextContent('48 pegadas');
    expect(items[1]).toHaveTextContent('#2');
  });

  it('shows the loading text while fetching with no cached entries', () => {
    storeState.loading = true;
    render(<RankingList albumId={1} city="Bogotá" />);

    expect(screen.getByText('Cargando ranking…')).toBeInTheDocument();
  });
});
