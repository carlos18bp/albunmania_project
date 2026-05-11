/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import MiniBarChart from '../MiniBarChart';

describe('MiniBarChart', () => {
  it('shows the empty text when there are no series', () => {
    render(<MiniBarChart series={[]} />);
    expect(screen.getByText(/Sin datos/)).toBeInTheDocument();
  });

  it('renders one row per data point', () => {
    render(
      <MiniBarChart
        series={[
          { label: 'A', value: 10 },
          { label: 'B', value: 5 },
        ]}
      />,
    );
    expect(screen.getAllByTestId(/^bar-/)).toHaveLength(2);
  });

  it('scales the largest bar to 100%', () => {
    render(
      <MiniBarChart
        series={[
          { label: 'A', value: 100 },
          { label: 'B', value: 50 },
        ]}
      />,
    );
    const bars = screen.getAllByTestId(/^bar-/);
    expect((bars[0] as HTMLElement).style.width).toBe('100%');
    expect((bars[1] as HTMLElement).style.width).toBe('50%');
  });
});
