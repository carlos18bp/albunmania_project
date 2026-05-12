/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/stores/presenceStore', () => ({
  __esModule: true,
  usePresenceStore: jest.fn(),
}));

import { usePresenceStore } from '@/lib/stores/presenceStore';
import ActiveCollectorsBanner from '../ActiveCollectorsBanner';

const mockUsePresenceStore = usePresenceStore as unknown as jest.Mock;
let fetchActiveCount: jest.Mock;
let activeCount = 0;

beforeEach(() => {
  jest.useFakeTimers();
  fetchActiveCount = jest.fn().mockResolvedValue(activeCount);
  mockUsePresenceStore.mockImplementation(
    (selector: (s: { activeCount: number; fetchActiveCount: jest.Mock }) => unknown) =>
      selector({ activeCount, fetchActiveCount }),
  );
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('ActiveCollectorsBanner', () => {
  it('renders the active-collectors count', () => {
    activeCount = 12;
    render(<ActiveCollectorsBanner />);
    expect(screen.getByTestId('active-collectors-count')).toHaveTextContent('12');
    expect(screen.getByTestId('active-collectors-banner')).toHaveTextContent('coleccionistas en línea');
  });

  it('fetches the count on mount, scoped to the city when given', () => {
    activeCount = 3;
    render(<ActiveCollectorsBanner city="Bogotá" />);
    expect(fetchActiveCount).toHaveBeenCalledWith('Bogotá');
    expect(screen.getByTestId('active-collectors-banner')).toHaveTextContent('en Bogotá');
  });

  it('uses the singular form for a single collector', () => {
    activeCount = 1;
    render(<ActiveCollectorsBanner />);
    expect(screen.getByTestId('active-collectors-banner')).toHaveTextContent('1 coleccionista en línea');
  });
});
