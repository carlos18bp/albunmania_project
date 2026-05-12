/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SwipeCard from '../SwipeCard';
import type { MatchCandidate } from '../../../lib/stores/matchStore';

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src?: string; alt?: string }) => <img src={src} alt={alt} />,
}));

const candidate: MatchCandidate = {
  user_id: 99,
  distance_km: 1.23,
  stickers_offered: [10, 11],
  stickers_wanted: [20],
  profile_preview: {
    user_id: 99,
    email: 'maria@x.com',
    city: 'Bogotá',
    avatar_url: '',
    rating_avg: 4.8,
    rating_count: 12,
  },
};

describe('SwipeCard', () => {
  it('renders distance, city and counts', () => {
    render(<SwipeCard candidate={candidate} onLike={jest.fn()} onPass={jest.fn()} />);
    expect(screen.getByText(/Bogotá/)).toBeInTheDocument();
    expect(screen.getByText(/1\.2 km/)).toBeInTheDocument();
    expect(screen.getByText(/2 cromos/)).toBeInTheDocument();
  });

  it('fires onLike when the Like button is clicked', async () => {
    const user = userEvent.setup();
    const onLike = jest.fn();
    render(<SwipeCard candidate={candidate} onLike={onLike} onPass={jest.fn()} />);
    await user.click(screen.getByTestId('swipe-like'));
    expect(onLike).toHaveBeenCalled();
  });

  it('fires onPass when the Pass button is clicked', async () => {
    const user = userEvent.setup();
    const onPass = jest.fn();
    render(<SwipeCard candidate={candidate} onLike={jest.fn()} onPass={onPass} />);
    await user.click(screen.getByTestId('swipe-pass'));
    expect(onPass).toHaveBeenCalled();
  });
});
