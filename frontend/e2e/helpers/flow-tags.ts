/**
 * Flow tag constants for consistent E2E test tagging.
 *
 * Each constant bundles @flow:, @module:, and @priority: tags.
 * Use spread syntax to compose tags in tests:
 *
 *   import { AUTH_LOGIN_INVALID } from '../helpers/flow-tags';
 *   test('...', { tag: [...AUTH_LOGIN_INVALID] }, async ({ page }) => { ... });
 *
 * Albunmanía-specific tags (catálogo del álbum, match swipe + QR, WhatsApp,
 * sponsor, banners CPM, reseñas) will be added here as their epics land in
 * Bloque B.
 */

// ── Home ──
export const HOME_LOADS = ['@flow:home-loads', '@module:home', '@priority:P1'];

// ── Auth ──
export const AUTH_SIGN_IN_FORM = ['@flow:auth-sign-in-form', '@module:auth', '@priority:P1'];
export const AUTH_SIGN_UP_FORM = ['@flow:auth-sign-up-form', '@module:auth', '@priority:P1'];
export const AUTH_LOGIN_INVALID = ['@flow:auth-login-invalid', '@module:auth', '@priority:P1'];
export const AUTH_PROTECTED_REDIRECT = ['@flow:auth-protected-redirect', '@module:auth', '@priority:P1'];
export const AUTH_FORGOT_PASSWORD_FORM = ['@flow:auth-forgot-password-form', '@module:auth', '@priority:P2'];
