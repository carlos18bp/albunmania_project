/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import LiveBadge from '../LiveBadge';

describe('LiveBadge', () => {
  it('renders the badge when online', () => {
    render(<LiveBadge online />);
    expect(screen.getByTestId('live-badge')).toBeInTheDocument();
  });

  it('renders nothing when offline', () => {
    render(<LiveBadge online={false} />);
    expect(screen.queryByTestId('live-badge')).not.toBeInTheDocument();
  });

  it('renders nothing when online is undefined', () => {
    render(<LiveBadge online={undefined} />);
    expect(screen.queryByTestId('live-badge')).not.toBeInTheDocument();
  });

  it('shows the "En línea" label when withLabel is set', () => {
    render(<LiveBadge online withLabel />);
    expect(screen.getByTestId('live-badge')).toHaveTextContent('En línea');
  });
});
