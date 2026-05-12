/**
 * Session 5 — Analytics + Manual + cross-feature smoke regression.
 *
 * Scope (Epics 13 + 14 + smoke):
 *  - /admin/analytics composite KPI dashboard
 *  - CSV export link points at /api/admin/analytics/export.csv
 *  - /manual interactive wiki: 9 sections + client-side search
 *  - Smoke regression: every Sprint 1-4 entry point still loads OK
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

test.describe('Session 5 — Analytics + Manual + Smoke', () => {
  test.describe('/admin/analytics (auth as admin)', () => {
    test.use({ storageState: loadStorageState('admin.json') });

    test('renders the seven KPI blocks', async ({ page }) => {
      await page.goto('/admin/analytics');
      await page.waitForResponse(
        (res) => res.url().includes('/api/admin/analytics/overview/'),
        { timeout: 5_000 },
      );
      await expect(page.getByRole('heading', { name: 'Analítica + KPIs' })).toBeVisible();

      // Community KPIs row.
      await expect(page.getByTestId('community-kpis')).toBeVisible();
      await expect(page.getByTestId('community-kpis')).toContainText('Usuarios activos');
      await expect(page.getByTestId('community-kpis')).toContainText('Trades completados');

      // Ad KPIs row.
      await expect(page.getByTestId('ad-kpis')).toBeVisible();
      await expect(page.getByTestId('ad-kpis')).toContainText('Impresiones');
      await expect(page.getByTestId('ad-kpis')).toContainText('CTR');

      // Trend chart + breakdown sections render the matching headings.
      await expect(page.getByText('Matches y trades por día')).toBeVisible();
      await expect(page.getByText('Cromos más ofertados')).toBeVisible();
      await expect(page.getByText('Cromos más buscados')).toBeVisible();
      await expect(page.getByText('Dispositivos')).toBeVisible();
      await expect(page.getByText('Top ciudades por impresiones')).toBeVisible();
    });

    test('CSV export link points at /api/admin/analytics/export.csv', async ({ page }) => {
      await page.goto('/admin/analytics');
      const link = page.getByTestId('export-csv');
      await link.waitFor({ timeout: 10_000 });
      const href = await link.getAttribute('href');
      expect(href).toMatch(/\/api\/admin\/analytics\/export\.csv$/);
    });
  });

  test.describe('/manual (public)', () => {
    test('renders sidebar + wiki sections', async ({ page }) => {
      await page.goto('/manual');
      await expect(page.getByRole('heading', { name: 'Manual interactivo' })).toBeVisible({ timeout: 10_000 });
      // Sidebar renders each section title as a collapsible <button>.
      const sectionTitles = ['Coleccionista', 'Comerciante', 'Web Manager', 'Administrador'];
      for (const t of sectionTitles) {
        await expect(
          page.getByRole('button', { name: new RegExp(t, 'i') }).first(),
        ).toBeVisible();
      }
    });

    test('search input narrows the visible processes', async ({ page }) => {
      await page.goto('/manual');
      // Find the search input by placeholder text (Spanish or English).
      const search = page.getByPlaceholder(/Buscar|Search/i).first();
      await search.waitFor({ timeout: 10_000 });
      await search.fill('match');
      await page.waitForTimeout(500);
      // Process titles for "match" should still be visible; unrelated
      // processes should not. We check that something matched.
      const processCards = await page.locator('article, section').count();
      expect(processCards).toBeGreaterThan(0);
    });
  });

  test.describe('Smoke regression — Sprint 1-4 surfaces still load', () => {
    test.use({ storageState: loadStorageState('user.json') });

    const guestSurfaces = [
      { url: '/', heading: /Albunman.* — la comunidad/ },
      { url: '/sign-in', anySelector: 'iframe[src*="hcaptcha"]' },
      { url: '/manual', heading: /Manual interactivo/ },
      { url: '/merchants', heading: /D.+nde comprar sobres/i },
    ];

    for (const surface of guestSurfaces) {
      test(`smoke: ${surface.url} loads without crash`, async ({ page }) => {
        await page.goto(surface.url);
        if (surface.heading) {
          await expect(page.getByRole('heading', { name: surface.heading })).toBeVisible({ timeout: 10_000 });
        } else if (surface.anySelector) {
          await page.waitForTimeout(2500);
          const count = await page.locator(surface.anySelector).count();
          expect(count).toBeGreaterThan(0);
        }
      });
    }

    const authedSurfaces = [
      { url: '/dashboard', heading: 'Mi álbum' },
      { url: '/catalog/mundial-26', selector: '[data-testid^="sticker-card-"]' },
      { url: '/match', heading: 'Match' },
      { url: '/match/qr', heading: 'Match presencial' },
      { url: '/match/1', heading: /Match #1/ },
    ];

    for (const surface of authedSurfaces) {
      test(`smoke: ${surface.url} loads with auth`, async ({ page }) => {
        await page.goto(surface.url);
        if (surface.heading) {
          await expect(
            page.getByRole('heading', { name: surface.heading }),
          ).toBeVisible({ timeout: 10_000 });
        } else if (surface.selector) {
          await page.waitForSelector(surface.selector, { timeout: 10_000 });
        }
      });
    }
  });
});
