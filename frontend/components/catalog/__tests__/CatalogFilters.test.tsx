/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';

import CatalogFilters from '../CatalogFilters';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CatalogFilters', () => {
  it('pre-populates the inputs from the initial props', () => {
    render(<CatalogFilters initialQuery="Messi" initialTeam="Argentina" initialSpecial onChange={jest.fn()} />);

    expect(screen.getByTestId('catalog-search')).toHaveValue('Messi');
    expect(screen.getByTestId('catalog-filter-team')).toHaveValue('Argentina');
    expect(screen.getByTestId('catalog-filter-special')).toBeChecked();
  });

  it('emits the typed query after the debounce', () => {
    const onChange = jest.fn();
    render(<CatalogFilters onChange={onChange} />);
    act(() => { jest.advanceTimersByTime(250); }); // flush the initial (empty) debounce
    onChange.mockClear();

    fireEvent.change(screen.getByTestId('catalog-search'), { target: { value: 'argentina' } });
    act(() => { jest.advanceTimersByTime(250); });

    expect(onChange).toHaveBeenCalledWith({ q: 'argentina', team: undefined, special: undefined });
  });

  it('emits special=true when the checkbox is ticked', () => {
    const onChange = jest.fn();
    render(<CatalogFilters onChange={onChange} />);
    act(() => { jest.advanceTimersByTime(250); });
    onChange.mockClear();

    fireEvent.click(screen.getByTestId('catalog-filter-special'));
    act(() => { jest.advanceTimersByTime(250); });

    expect(onChange).toHaveBeenCalledWith({ q: undefined, team: undefined, special: 'true' });
  });

  it('does not emit again before the debounce elapses', () => {
    const onChange = jest.fn();
    render(<CatalogFilters onChange={onChange} />);
    act(() => { jest.advanceTimersByTime(250); });
    onChange.mockClear();

    fireEvent.change(screen.getByTestId('catalog-search'), { target: { value: 'm' } });
    act(() => { jest.advanceTimersByTime(100); });

    expect(onChange).not.toHaveBeenCalled();
  });
});
