/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ReviewForm from '../ReviewForm';
import { useReviewStore } from '../../../lib/stores/reviewStore';

jest.mock('../../../lib/services/http', () => ({
  api: {
    post: jest.fn().mockResolvedValue({ data: { id: 1, stars: 5 } }),
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

beforeEach(() => {
  useReviewStore.getState().clear();
});

describe('ReviewForm', () => {
  it('shows an error when submitting without stars', async () => {
    const user = userEvent.setup();
    render(<ReviewForm tradeId={7} />);
    await user.click(screen.getByTestId('review-submit'));
    expect(screen.getByTestId('review-error')).toHaveTextContent(/calificación/i);
  });

  it('submits with stars + tags + comment and notifies parent', async () => {
    const user = userEvent.setup();
    const onSubmitted = jest.fn();
    render(<ReviewForm tradeId={7} onSubmitted={onSubmitted} />);

    await user.click(screen.getByTestId('star-5'));
    await user.click(screen.getByTestId('tag-puntual'));
    await user.type(screen.getByTestId('review-comment'), 'Excelente');
    await user.click(screen.getByTestId('review-submit'));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
  });
});
