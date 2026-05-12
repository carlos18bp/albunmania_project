/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import ReviewCard from '../ReviewCard';
import type { Review } from '../../../lib/stores/reviewStore';

const baseReview: Review = {
  id: 7,
  trade: 1,
  reviewer: 10,
  reviewer_email: 'lucia@example.com',
  reviewee: 11,
  reviewee_email: 'camilo@example.com',
  stars: 5,
  comment: 'Todo perfecto, llegó puntual.',
  tags: ['puntual', 'cromos_buen_estado'],
  reply: '',
  replied_at: null,
  is_visible: true,
  is_editable: false,
  created_at: '2026-05-01T12:00:00Z',
  updated_at: '2026-05-01T12:00:00Z',
};

describe('ReviewCard', () => {
  it('renders the reviewer email and the comment', () => {
    render(<ReviewCard review={baseReview} />);

    const card = screen.getByTestId('review-card-7');
    expect(card).toHaveTextContent('lucia@example.com');
    expect(screen.getByText('Todo perfecto, llegó puntual.')).toBeInTheDocument();
  });

  it('renders a star rating in read-only mode', () => {
    render(<ReviewCard review={baseReview} />);

    expect(screen.getByRole('img', { name: '5 de 5 estrellas' })).toBeInTheDocument();
  });

  it('renders each tag with its human label', () => {
    render(<ReviewCard review={baseReview} />);

    expect(screen.getByTestId('review-tag-puntual')).toHaveTextContent('Puntual');
    expect(screen.getByTestId('review-tag-cromos_buen_estado')).toHaveTextContent('Cromos en buen estado');
  });

  it('renders the public reply block when a reply exists', () => {
    render(<ReviewCard review={{ ...baseReview, reply: 'Gracias, un placer.' }} />);

    const reply = screen.getByTestId('review-reply-7');
    expect(reply).toHaveTextContent('camilo@example.com respondió:');
    expect(reply).toHaveTextContent('Gracias, un placer.');
  });

  it('omits the reply block when there is no reply', () => {
    render(<ReviewCard review={baseReview} />);

    expect(screen.queryByTestId('review-reply-7')).not.toBeInTheDocument();
  });

  it('omits the comment paragraph when the comment is empty', () => {
    render(<ReviewCard review={{ ...baseReview, comment: '' }} />);

    expect(screen.queryByText('Todo perfecto, llegó puntual.')).not.toBeInTheDocument();
  });
});
