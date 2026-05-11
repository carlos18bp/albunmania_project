import { NextResponse, type NextRequest } from 'next/server';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isValidLocale } from '@/lib/i18n/config';

/**
 * Locale resolution proxy (Next.js 16 replacement for the old
 * middleware.ts file convention).
 *
 * Reads the user's preferred locale from cookie `NEXT_LOCALE` first,
 * then `Accept-Language`, falling back to `DEFAULT_LOCALE` ('es').
 * Sets `x-locale` request header so server components can pick it up
 * via next-intl's getRequestConfig.
 *
 * Auth gating for /dashboard, /admin, /onboarding is handled
 * client-side by `useRequireAuth`. JWTs themselves live in cookies
 * (`access_token`, `refresh_token`) per `lib/services/tokens.ts` so a
 * server-side gate is technically possible, but we keep the gating
 * client-side for now to avoid a second source of truth.
 */
export function proxy(req: NextRequest) {
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value;
  const accepted = req.headers.get('accept-language')?.split(',')[0]?.split('-')[0]?.toLowerCase();

  const candidate = cookieLocale ?? accepted ?? DEFAULT_LOCALE;
  const locale = isValidLocale(candidate) ? candidate : DEFAULT_LOCALE;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-locale', locale);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (!cookieLocale) {
    res.cookies.set('NEXT_LOCALE', locale, { path: '/', sameSite: 'lax' });
  }
  return res;
}

export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico|manifest.webmanifest|icons|.*\\..*).*)',
  ],
};

export const __SUPPORTED_LOCALES__ = SUPPORTED_LOCALES;
