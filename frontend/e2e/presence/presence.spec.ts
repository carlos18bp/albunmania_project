/**
 * Presence — "en línea ahora" Live Badge + active-collectors banner.
 *
 * Pre-req: backend on :8000 with create_fake_data seed; frontend on :3000.
 * Storage state user.json in .playwright_local/sessions/. The seed marks
 * both canonical collectors (user@ + user2@example.com) as online now.
 */
import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PRESENCE_LIVE_BADGE } from '../helpers/flow-tags';

const SESSIONS_DIR = path.join(__dirname, '..', '..', '..', '.playwright_local', 'sessions');
function loadStorageState(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, filename), 'utf-8'));
}

test.describe('presence', () => {
  test.use({ storageState: loadStorageState('user.json') });

  test('the heartbeat ping fires on an authenticated page', { tag: [...PRESENCE_LIVE_BADGE] }, async ({ page }) => {
    const ping = page.waitForResponse(
      (res) => res.url().includes('/api/presence/ping/') && res.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await page.goto('/dashboard');
    const res = await ping;
    expect(res.status()).toBe(200);
  });

  test('the dashboard shows the active-collectors banner', { tag: [...PRESENCE_LIVE_BADGE] }, async ({ page }) => {
    await page.goto('/dashboard');
    const banner = page.getByTestId('active-collectors-banner');
    await expect(banner).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('active-collectors-count')).not.toHaveText('0');
  });

  test('the Live Badge shows on my own profile (seeded online)', { tag: [...PRESENCE_LIVE_BADGE] }, async ({ page }) => {
    await page.goto('/profile/me');
    await expect(page.getByTestId('profile-header')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('live-badge').first()).toBeVisible();
  });
});
