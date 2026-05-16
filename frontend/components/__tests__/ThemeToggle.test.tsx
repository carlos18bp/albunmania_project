/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';

jest.mock('next-themes', () => ({
  __esModule: true,
  useTheme: jest.fn(),
}));

import { useTheme } from 'next-themes';
import { ThemeToggle } from '../theme-toggle';

const mockUseTheme = useTheme as unknown as jest.Mock;

beforeEach(() => {
  mockUseTheme.mockReset();
});

function setupTheme(resolvedTheme: 'light' | 'dark') {
  const setTheme = jest.fn();
  mockUseTheme.mockReturnValue({ resolvedTheme, setTheme });
  return { setTheme };
}

describe('ThemeToggle', () => {
  it('renders an unchecked switch when the resolved theme is light', async () => {
    setupTheme('light');

    await act(async () => {
      render(<ThemeToggle />);
    });

    const sw = screen.getByTestId('theme-switch');
    expect(sw).toHaveAttribute('role', 'switch');
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('renders a checked switch when the resolved theme is dark', async () => {
    setupTheme('dark');

    await act(async () => {
      render(<ThemeToggle />);
    });

    expect(screen.getByTestId('theme-switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('switches from light to dark on click', async () => {
    const { setTheme } = setupTheme('light');

    await act(async () => {
      render(<ThemeToggle />);
    });

    fireEvent.click(screen.getByTestId('theme-switch'));

    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('switches from dark to light on click', async () => {
    const { setTheme } = setupTheme('dark');

    await act(async () => {
      render(<ThemeToggle />);
    });

    fireEvent.click(screen.getByTestId('theme-switch'));

    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('exposes a localized aria-label for assistive technology', async () => {
    setupTheme('light');

    await act(async () => {
      render(<ThemeToggle />);
    });

    expect(screen.getByRole('switch', { name: 'Cambiar tema' })).toBeInTheDocument();
  });
});
