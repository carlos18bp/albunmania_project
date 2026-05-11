/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { act, render } from '@testing-library/react';

import { useSponsorStore } from '../../../lib/stores/sponsorStore';
import SponsorThemeProvider from '../SponsorThemeProvider';

beforeEach(() => {
  useSponsorStore.setState({ sponsor: null, loaded: false, fetchActive: jest.fn().mockResolvedValue(undefined) });
  document.documentElement.style.removeProperty('--sponsor-primary');
  document.documentElement.style.removeProperty('--sponsor-secondary');
});

describe('SponsorThemeProvider', () => {
  it('triggers fetchActive on mount', () => {
    const fetchActive = jest.fn().mockResolvedValue(undefined);
    useSponsorStore.setState({ sponsor: null, loaded: false, fetchActive });

    render(
      <SponsorThemeProvider>
        <div>child</div>
      </SponsorThemeProvider>,
    );

    expect(fetchActive).toHaveBeenCalled();
  });

  it('writes CSS variables when a sponsor is active', () => {
    render(
      <SponsorThemeProvider>
        <div>child</div>
      </SponsorThemeProvider>,
    );

    act(() => {
      useSponsorStore.setState({
        sponsor: {
          id: 1,
          brand_name: 'X',
          logo_url: '',
          primary_color: '#123456',
          secondary_color: '#abcdef',
          message_text: '',
          active_from: '2026-01-01',
          active_until: '2026-12-31',
          is_currently_active: true,
        },
        loaded: true,
      });
    });

    expect(document.documentElement.style.getPropertyValue('--sponsor-primary')).toBe('#123456');
    expect(document.documentElement.style.getPropertyValue('--sponsor-secondary')).toBe('#abcdef');
  });

  it('removes CSS variables when sponsor is cleared', () => {
    document.documentElement.style.setProperty('--sponsor-primary', '#000');
    document.documentElement.style.setProperty('--sponsor-secondary', '#fff');

    render(
      <SponsorThemeProvider>
        <div>child</div>
      </SponsorThemeProvider>,
    );

    act(() => {
      useSponsorStore.setState({ sponsor: null, loaded: true });
    });

    expect(document.documentElement.style.getPropertyValue('--sponsor-primary')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--sponsor-secondary')).toBe('');
  });
});
