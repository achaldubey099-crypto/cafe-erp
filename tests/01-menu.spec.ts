import { expect, test } from '@playwright/test';

import { mockProtectedMenuApis, openProtectedTable, PUBLIC_TEST_RESTAURANT } from './helpers/public-access';

test.describe('Menu Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockProtectedMenuApis(page);
    await openProtectedTable(page, 7);
  });

  test('page loads and shows the protected restaurant header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(PUBLIC_TEST_RESTAURANT.brandName);
  });

  test('menu items load from the protected access endpoint', async ({ page }) => {
    await page.waitForSelector('text=Loading menu...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await expect(page.locator('text=/₹\\d+/').first()).toBeVisible({ timeout: 10000 });
  });

  test('category tabs render and are clickable', async ({ page }) => {
    await page.waitForSelector('text=Loading menu...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Coffee' })).toBeVisible();
  });

  test('search bar exists and filters products', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search your favorite brew...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('zzzzzznonexistent');
    await expect(page.getByText(/^0 Items$/)).toBeVisible();
  });

  test('login button is visible for guests', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('guest add-to-cart keeps the customer inside the protected menu flow', async ({ page }) => {
    await page.locator('button svg.lucide-plus').first().click();
    await expect(page).toHaveURL(/\/access\//);
    await expect(page.getByText(/items/i).first()).toBeVisible();
  });

  test("featured product section renders the editor's choice badge", async ({ page }) => {
    await expect(page.getByText("Editor's Choice")).toBeVisible();
  });
});
