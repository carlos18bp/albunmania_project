/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ReviewWidget from '../ReviewWidget';

describe('ReviewWidget', () => {
  it('renders rating with one decimal and count', () => {
    render(<ReviewWidget ratingAvg={4.83} ratingCount={12} />);
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(12)')).toBeInTheDocument();
  });

  it('is interactive when onClick is provided', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<ReviewWidget ratingAvg={4.5} ratingCount={3} onClick={onClick} />);
    await user.click(screen.getByTestId('review-widget-button'));
    expect(onClick).toHaveBeenCalled();
  });
});
