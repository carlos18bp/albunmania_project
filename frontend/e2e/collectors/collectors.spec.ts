/**
 * Mapa de Coleccionistas (/mapa).
 *
 * Pre-req: backend on :8000 with create_fake_data seed; frontend on :3000.
 * Storage state user.json in .playwright_local/sessions/. The seed creates
 * ~10 collectors with approximate Bogotá coordinates.
 */
import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { COLLECTORS_MAP } from '../helpers/flow-tags';

const SESSIONS_DIR = path.join(__dirname, '..', '..', '..', '.playwright_local', 'sessions');
function loadStorageState(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, filename), 'utf-8'));
}

test.describe('collectors map', () => {
  test.use({ storageState: loadStorageState('user.json') });

  test('the map page lists nearby collectors', { tag: [...COLLECTORS_MAP] }, async ({ page }) => {
    const fetched = page.waitForResponse(
      (res) => res.url().includes('/api/collectors/map/') && res.request().method() === 'GET',
      { timeout: 15_000 },
    );
    await page.goto('/mapa');
    await expect(page.getByRole('heading', { name: 'Mapa de Coleccionistas' })).toBeVisible({ timeout: 15_000 });
    const res = await fetched;
    expect(res.status()).toBe(200);
    await expect(page.getByTestId('collector-map')).toBeVisible();
    await expect(page.getByTestId('collectors-list').locator('li').first()).toBeVisible({ timeout: 10_000 });
  });

  test('"Ver todos" refetches the unscoped collector list', { tag: [...COLLECTORS_MAP] }, async ({ page }) => {
    await page.goto('/mapa');
    await expect(page.getByTestId('collector-map')).toBeVisible({ timeout: 15_000 });
    const refetch = page.waitForResponse(
      (res) => res.url().includes('/api/collectors/map/') && res.request().method() === 'GET',
      { timeout: 10_000 },
    );
    await page.getByTestId('show-all-collectors').click();
    expect((await refetch).status()).toBe(200);
  });
});
