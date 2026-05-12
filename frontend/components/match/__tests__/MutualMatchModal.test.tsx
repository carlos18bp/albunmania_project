/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import MutualMatchModal from '../MutualMatchModal';

describe('MutualMatchModal', () => {
  it('renders the match dialog with a link to the trade', () => {
    render(<MutualMatchModal matchId={42} onClose={jest.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Match mutuo' })).toBeInTheDocument();
    expect(screen.getByText('¡Match!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver intercambio' })).toHaveAttribute('href', '/match/42');
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = jest.fn();
    render(<MutualMatchModal matchId={42} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('mutual-modal'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when the inner card is clicked', () => {
    const onClose = jest.fn();
    render(<MutualMatchModal matchId={42} onClose={onClose} />);

    fireEvent.click(screen.getByText('¡Match!'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when the "Seguir explorando" button is clicked', () => {
    const onClose = jest.fn();
    render(<MutualMatchModal matchId={42} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('mutual-close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the trade link is followed', () => {
    const onClose = jest.fn();
    render(<MutualMatchModal matchId={42} onClose={onClose} />);

    fireEvent.click(screen.getByRole('link', { name: 'Ver intercambio' }));

    expect(onClose).toHaveBeenCalled();
  });
});
