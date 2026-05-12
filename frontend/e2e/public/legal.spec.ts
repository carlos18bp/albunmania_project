import { expect, test } from '../test-with-coverage';
import { LEGAL_TERMS, LEGAL_PRIVACY, HELP_FAQ } from '../helpers/flow-tags';

/** Static legal/help pages — public, no seed / no auth needed. */

test('terms page renders the document with the draft notice', { tag: [...LEGAL_TERMS] }, async ({ page }) => {
  await page.goto('/terminos');
  await expect(page.getByRole('heading', { level: 1, name: 'Términos y Condiciones' })).toBeVisible();
  await expect(page.getByTestId('terms-page')).toBeVisible();
  await expect(page.getByTestId('legal-draft-notice')).toBeVisible();
});

test('privacy page renders the document with the draft notice', { tag: [...LEGAL_PRIVACY] }, async ({ page }) => {
  await page.goto('/privacidad');
  await expect(page.getByRole('heading', { level: 1, name: 'Política de Privacidad' })).toBeVisible();
  await expect(page.getByTestId('privacy-page')).toBeVisible();
  await expect(page.getByTestId('legal-draft-notice')).toBeVisible();
});

test('help page renders the FAQ accordion and filters by audience', { tag: [...HELP_FAQ] }, async ({ page }) => {
  await page.goto('/ayuda');
  await expect(page.getByRole('heading', { level: 1, name: 'Centro de Ayuda' })).toBeVisible();
  await expect(page.getByTestId('faq-accordion')).toBeVisible();
  // Open a question.
  await page.getByTestId('faq-question-que-es').click();
  await expect(page.getByTestId('faq-answer-que-es')).toBeVisible();
  // Filter to "comerciante" — the "qué es" general question disappears.
  await page.getByTestId('faq-filter-comerciante').click();
  await expect(page.getByTestId('faq-question-que-es')).toHaveCount(0);
  await expect(page.getByTestId('faq-question-comerciante-alta')).toBeVisible();
});

test('footer links to the legal/help pages', { tag: [...LEGAL_TERMS] }, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Términos y Condiciones' })).toHaveAttribute('href', '/terminos');
  await expect(page.getByRole('link', { name: 'Política de Privacidad' })).toHaveAttribute('href', '/privacidad');
  await expect(page.getByRole('link', { name: 'Centro de Ayuda' })).toHaveAttribute('href', '/ayuda');
});
