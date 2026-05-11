import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import HomePage from '../page';

describe('HomePage', () => {
  it('renders the Albunmanía landing heading', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', {
        name: /Albunmanía — la comunidad colombiana de intercambio de cromos/i,
      }),
    ).toBeInTheDocument();
  });
});
