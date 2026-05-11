'use client';

import { useEffect } from 'react';

import { useSponsorStore } from '@/lib/stores/sponsorStore';

/**
 * SponsorThemeProvider — fetches the active Presenting Sponsor and applies
 * its primary/secondary colours as CSS variables (--sponsor-primary,
 * --sponsor-secondary) on the document root.
 *
 * Components that want sponsor-aware accents (splash, header band, push
 * banner) read those variables. When no sponsor is active the variables
 * are removed so the theme falls back to its native palette.
 *
 * This is the dynamic-theming half of Epic 10. The Light/Dark switcher
 * is already covered by next-themes via ThemeProvider.
 */
export default function SponsorThemeProvider({ children }: { children: React.ReactNode }) {
  const sponsor = useSponsorStore((s) => s.sponsor);
  const fetchActive = useSponsorStore((s) => s.fetchActive);

  useEffect(() => {
    void fetchActive();
  }, [fetchActive]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (sponsor) {
      root.style.setProperty('--sponsor-primary', sponsor.primary_color);
      root.style.setProperty('--sponsor-secondary', sponsor.secondary_color);
    } else {
      root.style.removeProperty('--sponsor-primary');
      root.style.removeProperty('--sponsor-secondary');
    }
  }, [sponsor]);

  return <>{children}</>;
}
