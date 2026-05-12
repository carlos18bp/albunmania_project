/**
 * IP geolocation endpoint (GeoIP2). In dev/CI the MaxMind .mmdb is not
 * provisioned, so the endpoint reports {available:false}; the onboarding
 * wizard (StepGeolocation, covered by unit tests) then falls back to the
 * browser geolocation prompt.
 *
 * Pre-req: backend on :8000.
 */
import { expect, test } from '@playwright/test';
import { GEO_IP_LOCATE } from '../helpers/flow-tags';

test('GET /api/geo/ip-locate/ responds (graceful when no DB)', { tag: [...GEO_IP_LOCATE] }, async ({ request }) => {
  const res = await request.get('/api/geo/ip-locate/');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toMatchObject({ source: 'geoip' });
  expect(typeof body.available).toBe('boolean');
  // No .mmdb in dev → not available; the wizard falls back to the browser API.
  expect(body.available).toBe(false);
});
