/**
 * In-app notification center + Header bell.
 *
 * Pre-req: backend on :8000 with create_fake_data seed; frontend on :3000.
 * Storage state user.json in .playwright_local/sessions/. The seed gives
 * user@example.com two notifications (one unread MATCH_MUTUAL + one read
 * REVIEW_RECEIVED).
 */
import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { NOTIFICATIONS_CENTER } from '../helpers/flow-tags';

const SESSIONS_DIR = path.join(__dirname, '..', '..', '..', '.playwright_local', 'sessions');
function loadStorageState(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, filename), 'utf-8'));
}

const ROW = 'li[data-testid^="notification-"]';

test.describe('Notifications', () => {
  test.use({ storageState: loadStorageState('user.json') });

  test('the Header bell shows the unread count badge', { tag: [...NOTIFICATIONS_CENTER] }, async ({ page }) => {
    await page.goto('/dashboard');
    const bell = page.getByTestId('header-notifications');
    await expect(bell).toBeVisible({ timeout: 15_000 });
    await expect(bell).toHaveAttribute('href', '/notificaciones');
    await expect(page.getByTestId('header-notifications-badge')).toHaveText('1', { timeout: 10_000 });
  });

  test('/notificaciones lists the user notifications, one unread', { tag: [...NOTIFICATIONS_CENTER] }, async ({ page }) => {
    await page.goto('/notificaciones');
    await expect(page.getByTestId('notifications-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(ROW)).toHaveCount(2, { timeout: 10_000 });
    await expect(page.locator(`${ROW}[data-read="false"]`)).toHaveCount(1);
  });

  test('"sólo no leídas" filter narrows the list to the unread one', { tag: [...NOTIFICATIONS_CENTER] }, async ({ page }) => {
    await page.goto('/notificaciones');
    await expect(page.getByTestId('notifications-page')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('notifications-unread-only').check();
    await page.waitForResponse((res) => res.url().includes('/api/notifications/') && res.url().includes('unread=true'), { timeout: 5_000 });
    await expect(page.locator(ROW)).toHaveCount(1, { timeout: 10_000 });
  });

  test('"marcar todas como leídas" clears the unread state', { tag: [...NOTIFICATIONS_CENTER] }, async ({ page }) => {
    await page.goto('/notificaciones');
    await expect(page.getByTestId('notifications-page')).toBeVisible({ timeout: 15_000 });
    const patch = page.waitForResponse((res) => res.url().includes('/api/notifications/read-all/'), { timeout: 5_000 });
    await page.getByTestId('notifications-mark-all').click();
    await patch;
    await expect(page.locator(`${ROW}[data-read="false"]`)).toHaveCount(0, { timeout: 10_000 });
  });
});
