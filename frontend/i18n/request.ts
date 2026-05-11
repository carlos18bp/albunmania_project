/**
 * next-intl getRequestConfig — server-side message loader.
 *
 * Used by the App Router to resolve the active locale per request and load
 * the matching JSON message bundle from frontend/messages/.
 *
 * The locale is currently resolved from the `x-locale` header set by
 * frontend/middleware.ts (Accept-Language sniffing) and falls back to the
 * default locale defined in lib/i18n/config.ts.
 *
 * Once the routing model migrates to `app/[locale]/…` (planned for Epic 14),
 * this resolver will switch to reading the route segment instead of the
 * header.
 */
// next-intl is declared in package.json but install runs after A6.
// We require it dynamically so 'next dev' / build keeps working without it.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getRequestConfig } = require('next-intl/server') as {
  getRequestConfig: (
    cb: (args: { requestLocale: Promise<string | undefined> }) => Promise<{
      locale: string;
      messages: Record<string, unknown>;
    }>,
  ) => unknown;
};

import { DEFAULT_LOCALE, isValidLocale } from '@/lib/i18n/config';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isValidLocale(requested) ? requested : DEFAULT_LOCALE;

  const messages = (await import(`../messages/${locale}.json`)).default as Record<string, unknown>;

  return { locale, messages };
});
