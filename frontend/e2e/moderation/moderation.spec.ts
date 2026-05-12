/**
 * Reporting a trade + the admin moderation queue (general reports).
 *
 * Pre-req: backend on :8000 with create_fake_data seed; frontend on :3000.
 * Storage states user.json + admin.json in .playwright_local/sessions/.
 * Match #1 is the seeded mutual match between user@example.com and
 * user2@example.com (both are participants of its trade).
 */
import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { REPORT_USER_OR_TRADE, ADMIN_MODERATION_QUEUE } from '../helpers/flow-tags';

const SESSIONS_DIR = path.join(__dirname, '..', '..', '..', '.playwright_local', 'sessions');
function loadStorageState(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, filename), 'utf-8'));
}

test('a participant reports a trade from /match/1', { tag: [...REPORT_USER_OR_TRADE] }, async ({ browser }) => {
  const userCtx = await browser.newContext({ storageState: loadStorageState('user.json') });
  const userPage = await userCtx.newPage();
  await userPage.goto('/match/1');
  await expect(userPage.getByRole('heading', { name: /Match #1/ })).toBeVisible({ timeout: 15_000 });

  await userPage.getByTestId('report-button').click();
  await expect(userPage.getByTestId('report-modal')).toBeVisible();
  await userPage.getByTestId('report-reason').selectOption('no_show');
  await userPage.getByTestId('report-detail').fill('No apareció en el punto acordado');

  const post = userPage.waitForResponse((res) => res.url().includes('/api/reports/') && res.request().method() === 'POST', { timeout: 5_000 });
  await userPage.getByTestId('report-submit').click();
  const res = await post;
  expect(res.status()).toBe(201);
  await expect(userPage.getByTestId('report-submitted')).toBeVisible();
  await userCtx.close();
});

test('the report shows up in the admin moderation queue and can be resolved', { tag: [...ADMIN_MODERATION_QUEUE] }, async ({ browser }) => {
  const adminCtx = await browser.newContext({ storageState: loadStorageState('admin.json') });
  const adminPage = await adminCtx.newPage();
  await adminPage.goto('/admin/moderation');
  await expect(adminPage.getByTestId('reports-section')).toBeVisible({ timeout: 15_000 });
  // At least one pending report (the trade report created above, or a seeded one).
  await adminPage.waitForResponse((res) => res.url().includes('/api/admin/reports/'), { timeout: 5_000 });
  const firstReport = adminPage.locator('[data-testid^="report-"]').filter({ has: adminPage.locator('[data-testid^="report-action-"]') }).first();
  await expect(firstReport).toBeVisible({ timeout: 10_000 });
  // Resolve it as "actioned".
  const patch = adminPage.waitForResponse((res) => res.url().match(/\/api\/admin\/reports\/\d+\/$/) && res.request().method() === 'PATCH', { timeout: 5_000 });
  await firstReport.locator('[data-testid^="report-action-"]').click();
  const res = await patch;
  expect(res.status()).toBe(200);
  await adminCtx.close();
});
