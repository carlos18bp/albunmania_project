/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/stores/reviewStore', () => ({
  __esModule: true,
  useReviewStore: jest.fn(),
}));

import { useReviewStore } from '@/lib/stores/reviewStore';
import ProfileHeader from '../ProfileHeader';
import type { PublicProfile } from '../../../lib/stores/profileStore';

const mockUseReviewStore = useReviewStore as unknown as jest.Mock;

const profile: PublicProfile = {
  user_id: 11,
  display_name: 'Lucía Rojas',
  city: 'Bogotá',
  avatar_url: '',
  bio_short: 'Coleccionista desde el Mundial 2014',
  rating_avg: '4.50',
  rating_count: 2,
  positive_pct: '100.00',
  album_completion_pct: '30.00',
  trades_completed_count: 5,
};

beforeEach(() => {
  // ReviewSummary (rendered inside ProfileHeader) reads these.
  mockUseReviewStore.mockImplementation((selector: (s: { summaryByUser: Record<number, unknown>; fetchUserSummary: jest.Mock }) => unknown) =>
    selector({ summaryByUser: {}, fetchUserSummary: jest.fn() }),
  );
});

describe('ProfileHeader', () => {
  it('renders the display name as the page heading', () => {
    render(<ProfileHeader profile={profile} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Lucía Rojas' })).toBeInTheDocument();
  });

  it('renders the city and bio', () => {
    render(<ProfileHeader profile={profile} />);
    expect(screen.getByText('Bogotá')).toBeInTheDocument();
    expect(screen.getByText('Coleccionista desde el Mundial 2014')).toBeInTheDocument();
  });

  it('renders the metrics block with album completion, trades and review count', () => {
    render(<ProfileHeader profile={profile} />);
    const metrics = screen.getByTestId('profile-metrics');
    expect(metrics).toHaveTextContent('30.0%');
    expect(metrics).toHaveTextContent('5'); // trades
    expect(metrics).toHaveTextContent('2'); // reviews
  });

  it('shows an initials avatar when there is no avatar_url', () => {
    render(<ProfileHeader profile={profile} />);
    expect(screen.getByText('LR')).toBeInTheDocument();
  });

  it('shows the avatar image when avatar_url is set', () => {
    render(<ProfileHeader profile={{ ...profile, avatar_url: 'https://example.test/a.png' }} />);
    expect(screen.getByRole('img', { name: 'Lucía Rojas' })).toHaveAttribute('src', 'https://example.test/a.png');
  });
});
