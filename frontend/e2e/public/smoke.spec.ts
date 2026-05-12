import { expect, test } from '../test-with-coverage';
import { PUBLIC_HOME_LOADS } from '../helpers/flow-tags';

test('home page loads', { tag: [...PUBLIC_HOME_LOADS] }, async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Albunman.* — la comunidad colombiana/ }),
  ).toBeVisible();
});
