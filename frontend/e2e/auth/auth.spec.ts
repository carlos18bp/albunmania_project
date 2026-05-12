import { test, expect } from '../test-with-coverage';
import { waitForPageLoad } from '../fixtures';
import {
  AUTH_GOOGLE_SIGNIN,
  AUTH_GOOGLE_SIGNUP,
  AUTH_HCAPTCHA_GATE,
  AUTH_PROTECTED_REDIRECT,
  AUTH_GUEST_BROWSE,
} from '../helpers/flow-tags';

/**
 * Auth surfaces — no seed / no storage state required.
 *
 * /sign-in and /sign-up were rewritten to Google OAuth + hCaptcha only
 * (commit c738634): there is NO email/password form anymore. These tests
 * assert the current reality plus the protected-route redirect behaviour.
 * (Authenticated onboarding/dashboard flows live in e2e/validation/.)
 */

test.describe('Auth — sign-in page', () => {
  test('renders the Albunmanía heading without legacy email/password form', { tag: [...AUTH_GOOGLE_SIGNIN] }, async ({ page }) => {
    await page.goto('/sign-in');
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/.*sign-in/);
    await expect(page.getByRole('heading', { name: 'Entrar a Albunmanía' })).toBeVisible();
    // No template residue.
    await expect(page.getByPlaceholder('Email')).toHaveCount(0);
    await expect(page.getByPlaceholder('Password')).toHaveCount(0);
    await expect(page.locator('button[type="submit"]')).toHaveCount(0);
  });

  test('links to the sign-up page via "Crear cuenta"', { tag: [...AUTH_GOOGLE_SIGNIN] }, async ({ page }) => {
    await page.goto('/sign-in');
    await waitForPageLoad(page);

    const createLink = page.getByRole('link', { name: 'Crear cuenta' });
    await expect(createLink).toBeVisible();
    await createLink.click();
    await page.waitForURL(/.*sign-up/, { timeout: 10_000 });
    await expect(page).toHaveURL(/.*sign-up/);
  });

  test('mounts the hCaptcha widget once the sitekey arrives', { tag: [...AUTH_HCAPTCHA_GATE] }, async ({ page }) => {
    await page.goto('/sign-in');
    await waitForPageLoad(page);

    const captchaIframes = page.locator('iframe[src*="hcaptcha"]');
    await expect.poll(() => captchaIframes.count(), { timeout: 15_000 }).toBeGreaterThan(0);
  });
});

test.describe('Auth — sign-up page', () => {
  test('renders the sign-up page with Google OAuth, no legacy form', { tag: [...AUTH_GOOGLE_SIGNUP] }, async ({ page }) => {
    await page.goto('/sign-up');
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/.*sign-up/);
    await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();
    await expect(page.getByPlaceholder('First Name')).toHaveCount(0);
    await expect(page.getByPlaceholder('Confirm Password')).toHaveCount(0);
    await expect(page.locator('button[type="submit"]')).toHaveCount(0);
  });

  test('mounts the hCaptcha widget on the sign-up page', { tag: [...AUTH_HCAPTCHA_GATE] }, async ({ page }) => {
    await page.goto('/sign-up');
    await waitForPageLoad(page);

    const captchaIframes = page.locator('iframe[src*="hcaptcha"]');
    await expect.poll(() => captchaIframes.count(), { timeout: 15_000 }).toBeGreaterThan(0);
  });

  test('links back to the sign-in page', { tag: [...AUTH_GOOGLE_SIGNUP] }, async ({ page }) => {
    await page.goto('/sign-up');
    await waitForPageLoad(page);
    // The page footer link reads "Entrar" and points at /sign-in.
    const signInLink = page.locator('a[href="/sign-in"]').first();
    await expect(signInLink).toBeVisible();
  });
});

test.describe('Auth — protected routes', () => {
  test('redirects unauthenticated user from /dashboard to /sign-in', { tag: [...AUTH_PROTECTED_REDIRECT] }, async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/.*sign-in/, { timeout: 10_000 });
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('redirects unauthenticated user from /admin to /sign-in', { tag: [...AUTH_PROTECTED_REDIRECT] }, async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL(/.*sign-in/, { timeout: 10_000 });
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('redirects unauthenticated user from /merchants/me to /sign-in', { tag: [...AUTH_PROTECTED_REDIRECT] }, async ({ page }) => {
    await page.goto('/merchants/me');
    await page.waitForURL(/.*sign-in/, { timeout: 10_000 });
    await expect(page).toHaveURL(/.*sign-in/);
  });
});

test.describe('Auth — guest browsing', () => {
  test('guest can open the landing and the manual without login', { tag: [...AUTH_GUEST_BROWSE] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: /Albunman.* — la comunidad colombiana/ })).toBeVisible();

    await page.goto('/manual');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: /Manual interactivo/ })).toBeVisible();
  });

  test('guest sees Manual / Entrar / Registrarse in the header', { tag: [...AUTH_GUEST_BROWSE] }, async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    const header = page.getByTestId('site-header');
    await expect(header.getByRole('link', { name: 'Manual' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Entrar' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Registrarse' })).toBeVisible();
  });
});
