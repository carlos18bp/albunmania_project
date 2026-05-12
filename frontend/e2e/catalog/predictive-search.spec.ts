/**
 * Predictive catalogue search — the autocomplete dropdown on /catalog/[slug].
 *
 * Pre-req: backend on :8000 with create_fake_data seed (album "mundial-26",
 * 50 stickers across teams incl. "Argentina"); frontend on :3000.
 * Storage state user.json in .playwright_local/sessions/.
 */
import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CATALOG_PREDICTIVE_SEARCH } from '../helpers/flow-tags';

const SESSIONS_DIR = path.join(__dirname, '..', '..', '..', '.playwright_local', 'sessions');
function loadStorageState(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, filename), 'utf-8'));
}

test.describe('catalogue predictive search', () => {
  test.use({ storageState: loadStorageState('user.json') });

  test('typing shows the suggestions dropdown', { tag: [...CATALOG_PREDICTIVE_SEARCH] }, async ({ page }) => {
    await page.goto('/catalog/mundial-26');
    const input = page.getByTestId('catalog-search');
    await expect(input).toBeVisible({ timeout: 15_000 });

    const search = page.waitForResponse(
      (res) => /\/api\/albums\/[^/]+\/search\/\?/.test(res.url()) && res.request().method() === 'GET',
      { timeout: 10_000 },
    );
    await input.fill('arg');
    await search;
    await expect(page.getByTestId('catalog-suggestions')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid^="suggestion-sticker-"]').first()).toBeVisible();
  });

  test('picking a sticker suggestion filters the grid', { tag: [...CATALOG_PREDICTIVE_SEARCH] }, async ({ page }) => {
    await page.goto('/catalog/mundial-26');
    const input = page.getByTestId('catalog-search');
    await expect(input).toBeVisible({ timeout: 15_000 });
    await input.fill('arg');
    await expect(page.getByTestId('catalog-suggestions')).toBeVisible({ timeout: 10_000 });

    const first = page.locator('[data-testid^="suggestion-sticker-"]').first();
    await first.click();
    await expect(page.getByTestId('catalog-suggestions')).toBeHidden();
    await expect(input).not.toHaveValue('arg');
  });
});
