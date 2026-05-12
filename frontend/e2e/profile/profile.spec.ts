/**
 * /profile/[id] — public profile + "Editar mi cuenta".
 *
 * Pre-req: backend on :8000 with create_fake_data seed; frontend on :3000.
 * Storage state user.json in .playwright_local/sessions/.
 */
import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PROFILE_VIEW, REVIEW_PROFILE_SUMMARY } from '../helpers/flow-tags';

const SESSIONS_DIR = path.join(__dirname, '..', '..', '..', '.playwright_local', 'sessions');
function loadStorageState(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, filename), 'utf-8'));
}

test.describe('Profile page', () => {
  test.use({ storageState: loadStorageState('user.json') });

  test('/profile/me renders the own profile header + reviews + account settings', { tag: [...PROFILE_VIEW, ...REVIEW_PROFILE_SUMMARY] }, async ({ page }) => {
    await page.goto('/profile/me');
    await expect(page.getByTestId('profile-page')).toBeVisible({ timeout: 15_000 });
    // ProfileHeader (the seed user has first_name "Lucía").
    await expect(page.getByRole('heading', { level: 1, name: /Luc[ií]a/ })).toBeVisible();
    await expect(page.getByTestId('profile-metrics')).toBeVisible();
    // Reseñas section — the seed user received one 4★ review from user2.
    await expect(page.getByTestId('profile-reviews')).toBeVisible();
    await expect(page.locator('[data-testid^="review-card-"]').first()).toBeVisible({ timeout: 10_000 });
    // Own profile → the edit form is visible.
    await expect(page.getByTestId('account-settings')).toBeVisible();
    await expect(page.getByTestId('account-city')).toBeVisible();
  });

  test('saving the account settings PATCHes /profile/me/ and confirms', { tag: [...PROFILE_VIEW] }, async ({ page }) => {
    await page.goto('/profile/me');
    await page.getByTestId('account-city').waitFor({ timeout: 15_000 });
    await page.getByTestId('account-city').fill('Bogotá D.C.');

    const patch = page.waitForResponse((res) => res.url().includes('/api/profile/me/') && res.request().method() === 'PATCH', { timeout: 5_000 });
    await page.getByTestId('account-save').click();
    const res = await patch;
    expect(res.status()).toBe(200);
    await expect(page.getByTestId('account-saved')).toBeVisible({ timeout: 5_000 });
  });

  test('the star filter chips re-query the reviews list', { tag: [...REVIEW_PROFILE_SUMMARY] }, async ({ page }) => {
    await page.goto('/profile/me');
    await expect(page.getByTestId('profile-reviews')).toBeVisible({ timeout: 15_000 });
    const req = page.waitForResponse((res) => res.url().includes('/api/users/') && res.url().includes('/reviews/') && res.url().includes('stars=5'), { timeout: 5_000 });
    await page.getByTestId('profile-reviews-filter-5').click();
    await req;
    // The seed review is 4★, so filtering to 5★ → empty state.
    await expect(page.getByTestId('profile-reviews-empty')).toBeVisible({ timeout: 5_000 });
  });
});
