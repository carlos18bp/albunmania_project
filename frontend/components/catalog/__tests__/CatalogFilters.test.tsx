/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';

// The autocomplete dropdown has its own test; here we only care about the
// filter logic, so stub it with a plain input keeping the `catalog-search` id.
jest.mock('../SearchAutocomplete', () => ({
  __esModule: true,
  default: ({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) => (
    <input data-testid="catalog-search" value={value} onChange={(e) => onValueChange(e.target.value)} />
  ),
}));

import CatalogFilters from '../CatalogFilters';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function flush() {
  act(() => { jest.advanceTimersByTime(250); });
}

describe('CatalogFilters', () => {
  it('pre-populates the inputs from the initial props', () => {
    render(<CatalogFilters slug="mundial-26" initialQuery="Messi" initialTeam="Argentina" initialSpecial onChange={jest.fn()} />);

    expect(screen.getByTestId('catalog-search')).toHaveValue('Messi');
    expect(screen.getByTestId('catalog-filter-team')).toHaveValue('Argentina');
    expect(screen.getByTestId('catalog-filter-special')).toBeChecked();
  });

  it('emits the typed query after the debounce', () => {
    const onChange = jest.fn();
    render(<CatalogFilters slug="mundial-26" onChange={onChange} />);
    flush();
    onChange.mockClear();

    fireEvent.change(screen.getByTestId('catalog-search'), { target: { value: 'argentina' } });
    flush();

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ q: 'argentina' }));
  });

  it('emits special=true when the checkbox is ticked', () => {
    const onChange = jest.fn();
    render(<CatalogFilters slug="mundial-26" onChange={onChange} />);
    flush();
    onChange.mockClear();

    fireEvent.click(screen.getByTestId('catalog-filter-special'));
    flush();

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ special: 'true' }));
  });

  it('does not emit again before the debounce elapses', () => {
    const onChange = jest.fn();
    render(<CatalogFilters slug="mundial-26" onChange={onChange} />);
    flush();
    onChange.mockClear();

    fireEvent.change(screen.getByTestId('catalog-search'), { target: { value: 'm' } });
    act(() => { jest.advanceTimersByTime(100); });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits the chosen availability value', () => {
    const onChange = jest.fn();
    render(<CatalogFilters slug="mundial-26" onChange={onChange} />);
    flush();
    onChange.mockClear();

    fireEvent.change(screen.getByTestId('catalog-filter-availability'), { target: { value: 'missing' } });
    flush();

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ availability: 'missing' }));
  });

  it('does not emit a nearby filter while no user location is available', () => {
    const onChange = jest.fn();
    render(<CatalogFilters slug="mundial-26" userLocation={null} onChange={onChange} />);
    flush();

    expect(screen.getByTestId('catalog-filter-nearby')).toBeDisabled();
    expect(screen.getByTestId('catalog-nearby-hint')).toBeInTheDocument();
    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last).not.toHaveProperty('nearby');
  });

  it('emits nearby + lat/lng/radius when the location is known and the box is ticked', () => {
    const onChange = jest.fn();
    render(<CatalogFilters slug="mundial-26" userLocation={{ lat: 4.65, lng: -74.07 }} onChange={onChange} />);
    flush();
    onChange.mockClear();

    fireEvent.click(screen.getByTestId('catalog-filter-nearby'));
    flush();

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ nearby: true, lat: 4.65, lng: -74.07, radius_km: 50 }),
    );

    fireEvent.change(screen.getByTestId('catalog-filter-radius'), { target: { value: '25' } });
    flush();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ nearby: true, radius_km: 25 }));
  });
});
