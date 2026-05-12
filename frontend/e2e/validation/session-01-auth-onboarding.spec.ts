/**
 * Session 1 — Auth & Onboarding validation.
 *
 * Scope: validate the Albunmanía-specific flows of Epic 1 end-to-end
 * in a real browser. NOT a regression suite — these tests assert what
 * the Playwright validation plan calls out per-session.
 *
 * Run with:
 *   npx playwright test e2e/validation/session-01-auth-onboarding.spec.ts
 *
 * Pre-req: backend on :8000 with create_fake_data seed; frontend on :3000.
 */
import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  PUBLIC_HOME_LOADS,
  AUTH_GOOGLE_SIGNIN,
  AUTH_HCAPTCHA_GATE,
  AUTH_ONBOARDING_WIZARD,
} from '../helpers/flow-tags';

const SESSIONS_DIR = path.join(__dirname, '..', '..', '..', '.playwright_local', 'sessions');

function loadStorageState(filename: string) {
  const fullPath = path.join(SESSIONS_DIR, filename);
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

test.describe('Session 1 — Auth & Onboarding', () => {
  test.describe('Landing (public)', () => {
    test('renders hero, CTAs and sponsor splash mount', { tag: [...PUBLIC_HOME_LOADS] }, async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('heading', {
        name: /Albunman.* — la comunidad colombiana/,
      })).toBeVisible();

      await expect(page.getByRole('link', { name: 'Registrarme con Google' })).toBeVisible();
      await expect(page.getByRole('link', { name: '¿Cómo funciona?' })).toBeVisible();

      // SponsorSplash mounts client-side and auto-dismisses (no seed
      // Sponsor → it never appears). Either way the footer disclaimer is
      // the observable proof the page rendered without crashing.
      await expect(page.getByText(/No afiliado oficialmente con FIFA o Panini/)).toBeVisible();
    });

    test('header shows Manual + Entrar + Registrarse for guests', { tag: [...PUBLIC_HOME_LOADS] }, async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('link', { name: 'Manual' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Registrarse' })).toBeVisible();
    });
  });

  test.describe('Sign-in page', () => {
    test('renders Albunmanía heading + hCaptcha + Google fallback', { tag: [...AUTH_GOOGLE_SIGNIN, ...AUTH_HCAPTCHA_GATE] }, async ({ page }) => {
      await page.goto('/sign-in');
      await expect(page).toHaveURL(/.*sign-in/);

      // Page now renders the Albunmanía Spanish copy — no email/password
      // template residue.
      await expect(page.getByRole('heading', { name: 'Entrar a Albunmanía' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Crear cuenta' })).toBeVisible();
      // No legacy form fields anymore.
      await expect(page.getByPlaceholder('Email')).toHaveCount(0);
      await expect(page.getByPlaceholder('Password')).toHaveCount(0);

      // hCaptcha iframes mount once the sitekey arrives from /api/captcha/site-key/.
      const captchaIframes = page.locator('iframe[src*="hcaptcha"]');
      await expect.poll(() => captchaIframes.count(), { timeout: 10_000 }).toBeGreaterThan(0);

      // With NEXT_PUBLIC_GOOGLE_CLIENT_ID unset, the page surfaces the
      // explicit "config pendiente" message (data-testid is more stable
      // than the human-readable string).
      await expect(page.getByTestId('missing-google-client-id')).toBeVisible();
    });
  });

  test.describe('Onboarding (authenticated)', () => {
    test.use({ storageState: loadStorageState('user.json') });

    test('GET /dashboard with valid JWT renders the album section', { tag: [...AUTH_ONBOARDING_WIZARD] }, async ({ page }) => {
      // Seed user has active_album_id already set, so they are onboarded
      // and should land on the dashboard with the StatCard tile section.
      await page.goto('/dashboard');
      await expect(page.getByRole('heading', { name: 'Mi álbum' })).toBeVisible({ timeout: 15_000 });
    });

    test('GET /onboarding renders the wizard step labels', { tag: [...AUTH_ONBOARDING_WIZARD] }, async ({ page }) => {
      await page.goto('/onboarding');
      // Even if the user is already onboarded, the page must render
      // without crashing. Verify at least the first step heading.
      const firstStep = page.getByText(/Elige tu álbum activo|Pick your active album/i);
      await expect(firstStep).toBeVisible({ timeout: 15_000 });
    });
  });
});
