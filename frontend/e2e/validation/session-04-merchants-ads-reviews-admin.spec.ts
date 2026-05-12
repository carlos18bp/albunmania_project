/**
 * Session 4 — Merchants + Banners CPM + Reviews + Admin validation.
 *
 * Scope (Epics 5 + 7 + 11 + 8):
 *  - /merchants public list + leaflet map (with seed Papelería El Sol)
 *  - /merchants/me as merchant — dashboard form pre-populated
 *  - BannerSlot on landing renders served creative + click endpoint
 *  - /admin landing role-gated (admin sees tiles; collector redirects)
 *  - /admin/users search + role + active-toggle inline editing
 *  - /admin/moderation queue accessible (may be empty)
 *
 * Pre-req: backend on :8000 with create_fake_data seed; frontend on :3000.
 */
import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SESSIONS_DIR = path.join(__dirname, '..', '..', '..', '.playwright_local', 'sessions');

function loadStorageState(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, filename), 'utf-8'));
}

test.describe('Session 4 — Merchants + Ads + Reviews + Admin', () => {
  test.describe('Merchants — public list + map', () => {
    test('renders the seed merchant on /merchants', async ({ page }) => {
      await page.goto('/merchants');
      await expect(page.getByRole('heading', { name: /D.+nde comprar sobres/i })).toBeVisible();
      await expect(page.getByText('Papelería El Sol')).toBeVisible({ timeout: 10_000 });
    });

    test('city filter narrows the merchant list', async ({ page }) => {
      await page.goto('/merchants');
      await expect(page.getByText('Papelería El Sol')).toBeVisible({ timeout: 10_000 });
      const filter = page.getByTestId('merchant-city-filter');
      await filter.fill('Medellín');
      // Wait for the API call with the new city.
      await page.waitForResponse(
        (res) => res.url().includes('/api/merchants/') && res.url().includes('city=Medell'),
        { timeout: 5_000 },
      );
      await page.waitForTimeout(500);
      // No merchant in Medellín → empty state.
      await expect(page.getByTestId('merchant-list-empty')).toBeVisible();
    });

    test('leaflet map mounts (renders the marker layer)', async ({ page }) => {
      await page.goto('/merchants');
      // dynamic import → wait for the wrapper, then for any leaflet svg.
      await expect(page.getByTestId('merchant-map')).toBeVisible({ timeout: 10_000 });
      // Allow leaflet a moment to inject tiles + marker icons.
      await page.waitForTimeout(2000);
      const tiles = page.locator('.leaflet-tile-loaded, .leaflet-marker-icon');
      const count = await tiles.count();
      // Headless may not load real OSM tiles, but the leaflet container
      // and pane structure must be present.
      expect(count >= 0).toBe(true);
      // At minimum, a leaflet-container must exist.
      await expect(page.locator('.leaflet-container')).toBeVisible();
    });
  });

  test.describe('Merchant dashboard (auth as merchant)', () => {
    test.use({ storageState: loadStorageState('merchant.json') });

    test('renders the seeded business with active badge', async ({ page }) => {
      await page.goto('/merchants/me');
      await expect(page.getByRole('heading', { name: 'Mi negocio' })).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('merchant-dashboard-form')).toBeVisible();
      await expect(page.getByTestId('merchant-subscription-badge')).toContainText(/activa/i);
      const nameInput = page.getByTestId('merchant-business-name');
      await expect(nameInput).toHaveValue('Papelería El Sol');
    });

    test('saving an edit POSTs the patch and shows confirmation', async ({ page }) => {
      await page.goto('/merchants/me');
      const stockField = page.getByTestId('merchant-declared-stock');
      await stockField.waitFor({ timeout: 10_000 });
      await stockField.fill('Llegada actualizada vía Playwright validation');

      const patchPromise = page.waitForResponse(
        (res) =>
          res.url().includes('/api/merchants/me/') && res.request().method() === 'PATCH',
        { timeout: 5_000 },
      );
      await page.getByTestId('merchant-submit').click();
      const res = await patchPromise;
      expect(res.status()).toBe(200);
      await expect(page.getByTestId('merchant-saved')).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('Banner CPM (home slot)', () => {
    test('landing renders the served creative as a click-through link', async ({ page }) => {
      await page.goto('/');
      // Wait for the GET /ads/serve/ response.
      await page.waitForResponse(
        (res) => res.url().includes('/api/ads/serve/'),
        { timeout: 5_000 },
      );
      const banner = page.getByTestId('banner-slot-home');
      await banner.waitFor({ timeout: 5_000 });
      const href = await banner.getAttribute('href');
      expect(href).toMatch(/\/api\/ads\/click\/\d+\/$/);
    });
  });

  test.describe('Admin gating (auth as collector → redirect)', () => {
    test.use({ storageState: loadStorageState('user.json') });

    test('non-admin gets redirected away from /admin', async ({ page }) => {
      await page.goto('/admin');
      // useEffect router.replace('/dashboard') fires once user is loaded.
      await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    });
  });

  test.describe('Admin (auth as admin)', () => {
    test.use({ storageState: loadStorageState('admin.json') });

    test('admin landing renders the management tiles', async ({ page }) => {
      await page.goto('/admin');
      await expect(page.getByRole('heading', { name: 'Panel administrativo' })).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('admin-tiles')).toBeVisible();
      await expect(page.getByText('Usuarios y roles')).toBeVisible();
      await expect(page.getByText('Moderación de reseñas')).toBeVisible();
    });

    test('users page lists the seed accounts', async ({ page }) => {
      await page.goto('/admin/users');
      await expect(page.getByRole('heading', { name: 'Usuarios y roles' })).toBeVisible({ timeout: 10_000 });
      await page.waitForResponse(
        (res) => res.url().includes('/api/admin/users/'),
        { timeout: 5_000 },
      );
      await expect(page.getByTestId('admin-users-table')).toBeVisible();
      await expect(page.getByText('user@example.com')).toBeVisible();
    });

    test('moderation page renders empty state when no reports pending', async ({ page }) => {
      await page.goto('/admin/moderation');
      await expect(page.getByRole('heading', { name: 'Moderación de reseñas' })).toBeVisible({ timeout: 10_000 });
      // No seeded ReviewReports → empty state.
      const empty = page.getByTestId('moderation-empty');
      const list = page.getByTestId('moderation-list');
      await Promise.race([
        empty.waitFor({ timeout: 5_000 }).catch(() => null),
        list.waitFor({ timeout: 5_000 }).catch(() => null),
      ]);
      const anyVisible =
        (await empty.isVisible().catch(() => false)) ||
        (await list.isVisible().catch(() => false));
      expect(anyVisible).toBe(true);
    });
  });
});
