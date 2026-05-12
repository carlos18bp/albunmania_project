/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import KpiTile from '../KpiTile';

describe('KpiTile', () => {
  it('renders the label and value', () => {
    render(<KpiTile label="Usuarios activos" value={1234} />);

    const tile = screen.getByTestId('kpi-tile');
    expect(tile).toHaveTextContent('Usuarios activos');
    expect(tile).toHaveTextContent('1234');
  });

  it('renders a string value verbatim', () => {
    render(<KpiTile label="CTR" value="4.2%" />);

    expect(screen.getByText('4.2%')).toBeInTheDocument();
  });

  it('renders the hint when provided', () => {
    render(<KpiTile label="Impresiones" value={500} hint="últimos 30 días" />);

    expect(screen.getByText('últimos 30 días')).toBeInTheDocument();
  });

  it('omits the hint when not provided', () => {
    render(<KpiTile label="Impresiones" value={500} />);

    expect(screen.queryByText('últimos 30 días')).not.toBeInTheDocument();
  });
});
