/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import StarRating from '../StarRating';

describe('StarRating', () => {
  it('renders five star buttons', () => {
    render(<StarRating value={3} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('disables buttons when readOnly is true', () => {
    render(<StarRating value={4} readOnly />);
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
  });

  it('calls onChange with the clicked star number', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<StarRating value={0} onChange={onChange} />);
    await user.click(screen.getByTestId('star-4'));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
