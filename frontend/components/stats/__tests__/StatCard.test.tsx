/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';

import StatCard from '../StatCard';
import { useStatsStore } from '../../../lib/stores/statsStore';

jest.mock('../../../lib/services/http', () => ({
  api: { get: jest.fn() },
}));

beforeEach(() => {
  useStatsStore.getState().clear();
});

describe('StatCard', () => {
  it('shows empty state when there is no active album', async () => {
    const { api } = jest.requireMock('../../../lib/services/http') as { api: { get: jest.Mock } };
    api.get.mockResolvedValue({ data: { album_id: null, total_stickers: 0, pasted_count: 0, repeated_count: 0, completion_pct: 0, weekly_velocity: 0, streak_days: 0, eta_days: null } });
    render(<StatCard />);
    await waitFor(() => expect(screen.getByTestId('stat-card-empty')).toBeInTheDocument());
  });

  it('renders all stat blocks when an album is active', async () => {
    const { api } = jest.requireMock('../../../lib/services/http') as { api: { get: jest.Mock } };
    api.get.mockResolvedValue({
      data: {
        album_id: 1, total_stickers: 100, pasted_count: 25, repeated_count: 7,
        completion_pct: 25.5, weekly_velocity: 4, streak_days: 6, eta_days: 75,
      },
    });
    render(<StatCard />);
    await waitFor(() => expect(screen.getByTestId('stat-card')).toBeInTheDocument());
    expect(screen.getByText('25.5%')).toBeInTheDocument();
    expect(screen.getByText('25/100')).toBeInTheDocument();
    expect(screen.getByText('75d')).toBeInTheDocument();
  });

  it('shows ¡Completo! when ETA is zero', async () => {
    const { api } = jest.requireMock('../../../lib/services/http') as { api: { get: jest.Mock } };
    api.get.mockResolvedValue({
      data: {
        album_id: 1, total_stickers: 100, pasted_count: 100, repeated_count: 0,
        completion_pct: 100, weekly_velocity: 0, streak_days: 0, eta_days: 0,
      },
    });
    render(<StatCard />);
    await waitFor(() => expect(screen.getByText('¡Completo!')).toBeInTheDocument());
  });
});
