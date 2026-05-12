/**
 * Catalogue availability + proximity-radius filters on /catalog/[slug].
 *
 * Pre-req: backend on :8000 with create_fake_data seed (album "mundial-26",
 * 50 stickers, canonical collectors with inventory + approximate Bogotá
 * coords); frontend on :3000. Storage state user.json.
 */
import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CATALOG_AVAILABILITY_PROXIMITY } from '../helpers/flow-tags';

const SESSIONS_DIR = path.join(__dirname, '..', '..', '..', '.playwright_local', 'sessions');
function loadStorageState(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, filename), 'utf-8'));
}

test.describe('catalogue availability + proximity filters', () => {
  test.use({ storageState: loadStorageState('user.json') });

  test('the availability select narrows the catalogue server-side', { tag: [...CATALOG_AVAILABILITY_PROXIMITY] }, async ({ page }) => {
    await page.goto('/catalog/mundial-26');
    // Wait until the page is interactive (the nearby box enables once the profile loaded).
    await expect(page.getByTestId('catalog-filter-nearby')).toBeEnabled({ timeout: 15_000 });

    const req = page.waitForResponse(
      (res) => /\/api\/albums\/[^/]+\/stickers\/\?.*availability=missing/.test(res.url()) && res.request().method() === 'GET',
      { timeout: 10_000 },
    );
    await page.getByTestId('catalog-filter-availability').selectOption('missing');
    expect((await req).status()).toBe(200);
  });

  test('"Disponibles cerca" sends a nearby request once the location is loaded', { tag: [...CATALOG_AVAILABILITY_PROXIMITY] }, async ({ page }) => {
    await page.goto('/catalog/mundial-26');
    const checkbox = page.getByTestId('catalog-filter-nearby');
    // The page refreshes the profile on mount; the checkbox enables once the location is known.
    await expect(checkbox).toBeEnabled({ timeout: 15_000 });

    const req = page.waitForResponse(
      (res) => /\/api\/albums\/[^/]+\/stickers\/\?.*nearby=true/.test(res.url()) && res.request().method() === 'GET',
      { timeout: 10_000 },
    );
    await checkbox.check();
    expect((await req).status()).toBe(200);
    await expect(page.getByTestId('catalog-filter-radius')).toBeVisible();
  });
});
