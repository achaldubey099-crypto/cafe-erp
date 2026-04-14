import { expect, test } from '@playwright/test';

import {
  MENU_PRODUCTS,
  MOCK_CUSTOMER,
  PROFILE_FAVORITES,
  TEST_CART,
  clearStorage,
  mockFavorites,
  mockMenu,
  seedCart,
  seedCustomer,
} from './helpers/ui-fixtures';

const categories = ['Coffee', 'Snacks', 'Desserts', 'Teas', 'Seasonal'] as const;
const bottomNavLabels = ['Menu', 'Checkout', 'Orders', 'Profile'] as const;
const guestProtectedProducts = ['Red Velvet Latte', 'Burger', 'Chocolate Cake'] as const;
const authCartExpectations = [
  { name: 'Red Velvet Latte', quantity: 2 },
  { name: 'Burger', quantity: 1 },
] as const;

async function openMenu(page: Parameters<typeof test>[0]['page']) {
  await mockMenu(page);
  await page.goto('/');
  await page.waitForSelector('text=Loading menu...', { state: 'hidden', timeout: 10000 }).catch(() => {});
}

function gridProductCard(page: Parameters<typeof test>[0]['page'], name: string) {
  return page
    .getByRole('heading', { name, level: 4 })
    .locator('xpath=ancestor::div[contains(@class,"group")][1]');
}

test.describe('Menu Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('menu page shows the cafe heading', async ({ page }) => {
    await openMenu(page);
    await expect(page.getByRole('heading', { name: 'Artisan Café' })).toBeVisible();
  });

  test('menu page shows the subheading', async ({ page }) => {
    await openMenu(page);
    await expect(page.getByText('Morning Brews')).toBeVisible();
  });

  test('guest sees the login button', async ({ page }) => {
    await openMenu(page);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('search input is visible', async ({ page }) => {
    await openMenu(page);
    await expect(page.getByPlaceholder('Search your favorite brew...')).toBeVisible();
  });

  test('featured banner renders the editor label', async ({ page }) => {
    await openMenu(page);
    await expect(page.getByText("Editor's Choice")).toBeVisible();
  });

  test('featured banner shows the featured product name', async ({ page }) => {
    await openMenu(page);
    await expect(page.getByText('Red Velvet Latte').first()).toBeVisible();
  });

  test('featured product is also shown in the grid', async ({ page }) => {
    await openMenu(page);
    await expect(page.getByRole('heading', { name: 'Red Velvet Latte', level: 4 })).toBeVisible();
  });

  for (const label of bottomNavLabels) {
    test(`bottom nav shows ${label}`, async ({ page }) => {
      await openMenu(page);
      await expect(page.getByRole('link', { name: label })).toBeVisible();
    });
  }

  for (const category of categories) {
    test(`category button ${category} is visible`, async ({ page }) => {
      await openMenu(page);
      await expect(page.getByRole('button', { name: category })).toBeVisible();
    });

    test(`clicking ${category} keeps the menu heading visible`, async ({ page }) => {
      await openMenu(page);
      await page.getByRole('button', { name: category }).click();
      await expect(page.getByRole('heading', { name: `${category} Menu`, level: 2 })).toBeVisible();
    });

    test(`clicking ${category} shows at least one matching product`, async ({ page }) => {
      await openMenu(page);
      await page.getByRole('button', { name: category }).click();
      const firstProduct = MENU_PRODUCTS.find((item) => item.category === category);
      await expect(page.getByRole('heading', { name: firstProduct?.name || '', level: 4 })).toBeVisible();
    });

    test(`clicking ${category} updates the item count text`, async ({ page }) => {
      await openMenu(page);
      await page.getByRole('button', { name: category }).click();
      const count = MENU_PRODUCTS.filter((item) => item.category === category).length;
      await expect(page.getByText(new RegExp(`^${count} Items$`))).toBeVisible();
    });

    test(`clicking ${category} hides products from other categories`, async ({ page }) => {
      await openMenu(page);
      await page.getByRole('button', { name: category }).click();
      const foreignProduct = MENU_PRODUCTS.find((item) => item.category !== category);
      if (!foreignProduct) return;
      await expect(page.locator('h4', { hasText: foreignProduct.name })).toHaveCount(0);
    });
  }

  for (const productName of guestProtectedProducts) {
    test(`guest add-to-cart from ${productName} redirects to login`, async ({ page }) => {
      await openMenu(page);
      const card = gridProductCard(page, productName);
      await card.getByRole('button').last().click();
      await page.waitForURL('**/login**');
      await expect(page).toHaveURL(/\/login/);
    });

    test(`guest favorite tap from ${productName} redirects to login`, async ({ page }) => {
      await openMenu(page);
      const card = gridProductCard(page, productName);
      await card.locator('button').first().click();
      await page.waitForURL('**/login**');
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test('authenticated menu shows logout button', async ({ page }) => {
    await seedCustomer(page);
    await seedCart(page);
    await mockMenu(page);
    await mockFavorites(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('authenticated menu loads favorites without redirect', async ({ page }) => {
    await seedCustomer(page);
    await mockMenu(page);
    await mockFavorites(page, PROFILE_FAVORITES);
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
  });

  for (const entry of authCartExpectations) {
    test(`authenticated cart quantity badge appears for ${entry.name}`, async ({ page }) => {
      await seedCustomer(page);
      await seedCart(page);
      await mockMenu(page);
      await mockFavorites(page);
      await page.goto('/');
      const card = gridProductCard(page, entry.name);
      await expect(card.getByText(String(entry.quantity), { exact: true })).toBeVisible();
    });

    test(`authenticated decrement button appears for ${entry.name}`, async ({ page }) => {
      await seedCustomer(page);
      await seedCart(page);
      await mockMenu(page);
      await mockFavorites(page);
      await page.goto('/');
      const card = gridProductCard(page, entry.name);
      await expect(card.getByRole('button').first()).toBeVisible();
    });

    test(`authenticated increment button appears for ${entry.name}`, async ({ page }) => {
      await seedCustomer(page);
      await seedCart(page);
      await mockMenu(page);
      await mockFavorites(page);
      await page.goto('/');
      const card = gridProductCard(page, entry.name);
      await expect(card.getByRole('button').nth(1)).toBeVisible();
    });

    test(`authenticated favorite heart can be toggled on ${entry.name}`, async ({ page }) => {
      await seedCustomer(page);
      await seedCart(page);
      await mockMenu(page);
      await mockFavorites(page);
      await page.goto('/');
      const card = gridProductCard(page, entry.name);
      await card.locator('button').first().click();
      await expect(page).toHaveURL(/\/$/);
    });
  }

  test('floating cart button shows item count from seeded cart', async ({ page }) => {
    await seedCustomer(page);
    await seedCart(page);
    await mockMenu(page);
    await mockFavorites(page);
    await page.goto('/');
    await expect(page.getByText('3 items')).toBeVisible();
  });

  test('floating cart button shows total price from seeded cart', async ({ page }) => {
    await seedCustomer(page);
    await seedCart(page);
    await mockMenu(page);
    await mockFavorites(page);
    await page.goto('/');
    await expect(page.getByText('₹1100')).toBeVisible();
  });

  test('floating cart button navigates to cart', async ({ page }) => {
    await seedCustomer(page);
    await seedCart(page);
    await mockMenu(page);
    await mockFavorites(page);
    await page.goto('/');
    await page.getByRole('button', { name: /3 items/i }).click();
    await expect(page).toHaveURL(/\/cart/);
  });

  test('logout on menu returns to guest state', async ({ page }) => {
    await seedCustomer(page);
    await seedCart(page);
    await mockMenu(page);
    await mockFavorites(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('all mocked categories are represented on the page', async ({ page }) => {
    await openMenu(page);
    for (const category of categories) {
      await expect(page.getByRole('button', { name: category })).toBeVisible();
    }
  });
});
