/// <reference types="jest" />
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';

import { useSponsorStore } from '../../../lib/stores/sponsorStore';
import SponsorSplash from '../SponsorSplash';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as never)} />;
  },
}));

beforeEach(() => {
  jest.useFakeTimers();
  useSponsorStore.setState({ sponsor: null, loaded: false });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SponsorSplash', () => {
  it('does not render until the sponsor store has finished loading', () => {
    render(<SponsorSplash />);
    expect(screen.queryByTestId('sponsor-splash')).toBeNull();
  });

  it('renders the Albunmanía fallback when no sponsor is active', () => {
    useSponsorStore.setState({ sponsor: null, loaded: true });
    render(<SponsorSplash />);

    expect(screen.getByTestId('sponsor-splash')).toBeInTheDocument();
    expect(screen.getByText('Albunmanía')).toBeInTheDocument();
    expect(screen.queryByAltText(/.+/)).toBeNull();
  });

  it('renders the sponsor logo and message when a sponsor is active', () => {
    useSponsorStore.setState({
      sponsor: {
        id: 1,
        brand_name: 'Coca-Cola',
        logo_url: 'https://example.test/logo.png',
        primary_color: '#ff0000',
        secondary_color: '#ffffff',
        message_text: 'Patrocinador oficial',
        active_from: '2026-01-01',
        active_until: '2026-12-31',
        is_currently_active: true,
      },
      loaded: true,
    });

    render(<SponsorSplash />);

    expect(screen.getByAltText('Coca-Cola')).toBeInTheDocument();
    expect(screen.getByText('Patrocinador oficial')).toBeInTheDocument();
  });

  it('auto-dismisses after the configured duration', () => {
    useSponsorStore.setState({ sponsor: null, loaded: true });
    render(<SponsorSplash durationMs={500} />);

    expect(screen.getByTestId('sponsor-splash')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.queryByTestId('sponsor-splash')).toBeNull();
  });
});
