import { expect, test } from '@playwright/test';

import {
  ALT_CART,
  TEST_CART,
  clearStorage,
  seedCart,
  seedCustomer,
} from './helpers/ui-fixtures';

async function openCart(page: Parameters<typeof test>[0]['page'], options?: { cart?: typeof TEST_CART; customer?: boolean }) {
  await clearStorage(page);

  if (options?.cart) {
    await seedCart(page, options.cart);
  }

  if (options?.customer) {
    await seedCustomer(page);
  }

  await page.goto('/cart');
}

function cartRow(page: Parameters<typeof test>[0]['page'], name: string) {
  return page
    .getByRole('heading', { name, level: 3 })
    .locator('xpath=ancestor::div[contains(@class,"bg-surface-container")][1]');
}

const lineItems = [
  { name: 'Red Velvet Latte', price: 325, quantity: 2, lineTotal: 650 },
  { name: 'Burger', price: 450, quantity: 1, lineTotal: 450 },
] as const;

test.describe('Cart Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('empty cart shows empty state heading', async ({ page }) => {
    await openCart(page);
    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  });

  test('empty cart shows supporting copy', async ({ page }) => {
    await openCart(page);
    await expect(page.getByText("Looks like you haven't added any brews yet.")).toBeVisible();
  });

  test('empty cart shows browse menu button', async ({ page }) => {
    await openCart(page);
    await expect(page.getByRole('button', { name: 'Browse Menu' })).toBeVisible();
  });

  test('empty cart hides checkout bar', async ({ page }) => {
    await openCart(page);
    await expect(page.getByRole('button', { name: 'Checkout' })).toHaveCount(0);
  });

  test('browse menu button returns to home', async ({ page }) => {
    await openCart(page);
    await page.getByRole('button', { name: 'Browse Menu' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('cart header shows total quantity count', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    await expect(page.getByRole('heading', { name: 'Your Cart (3)' })).toBeVisible();
  });

  test('clear button is visible when cart has items', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
  });

  test('total label is visible in checkout bar', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    await expect(page.getByText('Total')).toBeVisible();
  });

  test('cart shows grand total for seeded items', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    await expect(page.getByRole('heading', { name: '₹1100' })).toBeVisible();
  });

  test('checkout button is visible for non-empty cart', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
  });

  test('back button is visible in the header', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    await expect(page.locator('button').first()).toBeVisible();
  });

  for (const item of lineItems) {
    test(`cart renders ${item.name}`, async ({ page }) => {
      await openCart(page, { cart: TEST_CART });
      await expect(page.getByText(item.name)).toBeVisible();
    });

    test(`${item.name} shows unit price`, async ({ page }) => {
      await openCart(page, { cart: TEST_CART });
      await expect(page.getByText(`₹${item.price}`)).toBeVisible();
    });

    test(`${item.name} shows quantity`, async ({ page }) => {
      await openCart(page, { cart: TEST_CART });
      const card = cartRow(page, item.name);
      await expect(card.getByText(String(item.quantity), { exact: true })).toBeVisible();
    });

    test(`${item.name} image is rendered`, async ({ page }) => {
      await openCart(page, { cart: TEST_CART });
      await expect(page.getByAltText(item.name)).toBeVisible();
    });

    test(`${item.name} card has decrement control`, async ({ page }) => {
      await openCart(page, { cart: TEST_CART });
      const card = cartRow(page, item.name);
      await expect(card.getByRole('button').nth(0)).toBeVisible();
    });

    test(`${item.name} card has increment control`, async ({ page }) => {
      await openCart(page, { cart: TEST_CART });
      const card = cartRow(page, item.name);
      await expect(card.getByRole('button').nth(1)).toBeVisible();
    });

    test(`${item.name} card has trash button`, async ({ page }) => {
      await openCart(page, { cart: TEST_CART });
      const card = cartRow(page, item.name);
      await expect(card.getByRole('button').nth(2)).toBeVisible();
    });
  }

  test('incrementing latte updates quantity to 3', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Red Velvet Latte');
    await card.getByRole('button').nth(1).click();
    await expect(card.getByText('3', { exact: true })).toBeVisible();
  });

  test('incrementing latte updates header count to 4', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Red Velvet Latte');
    await card.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Your Cart (4)' })).toBeVisible();
  });

  test('incrementing burger updates total to 1550', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Burger');
    await card.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: '₹1550' })).toBeVisible();
  });

  test('decrementing latte lowers quantity to 1', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Red Velvet Latte');
    await card.getByRole('button').nth(0).click();
    await expect(card.getByText('1', { exact: true })).toBeVisible();
  });

  test('decrementing latte lowers total to 775', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Red Velvet Latte');
    await card.getByRole('button').nth(0).click();
    await expect(page.getByRole('heading', { name: '₹775' })).toBeVisible();
  });

  test('decrementing burger removes the item row', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Burger');
    await card.getByRole('button').nth(0).click();
    await expect(page.getByText('Burger')).toHaveCount(0);
  });

  test('decrementing burger updates total to 650', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Burger');
    await card.getByRole('button').nth(0).click();
    await expect(page.getByRole('heading', { name: '₹650' })).toBeVisible();
  });

  test('decrementing burger updates header count to 2', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Burger');
    await card.getByRole('button').nth(0).click();
    await expect(page.getByRole('heading', { name: 'Your Cart (2)' })).toBeVisible();
  });

  test('trash button removes latte immediately', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Red Velvet Latte');
    await card.getByRole('button').nth(2).click();
    await expect(page.getByText('Red Velvet Latte')).toHaveCount(0);
  });

  test('trash button removes burger immediately', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Burger');
    await card.getByRole('button').nth(2).click();
    await expect(page.getByText('Burger')).toHaveCount(0);
  });

  test('deleting latte leaves burger total of 450', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Red Velvet Latte');
    await card.getByRole('button').nth(2).click();
    await expect(page.getByRole('heading', { name: '₹450' })).toBeVisible();
  });

  test('deleting burger leaves latte total of 650', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Burger');
    await card.getByRole('button').nth(2).click();
    await expect(page.getByRole('heading', { name: '₹650' })).toBeVisible();
  });

  test('clear button empties the cart', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  });

  test('clear button hides checkout bar', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByRole('button', { name: 'Checkout' })).toHaveCount(0);
  });

  test('guest checkout redirects to login', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/\/login\?returnTo=\/checkout/);
  });

  test('logged-in customer checkout goes to checkout page', async ({ page }) => {
    await openCart(page, { cart: TEST_CART, customer: true });
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('cart persists increment to localStorage', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Burger');
    await card.getByRole('button').nth(1).click();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    expect(cart.find((item: { _id: string }) => item._id === 'snack-1')?.quantity).toBe(2);
  });

  test('cart persists decrement to localStorage', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Red Velvet Latte');
    await card.getByRole('button').nth(0).click();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    expect(cart.find((item: { _id: string }) => item._id === 'coffee-1')?.quantity).toBe(1);
  });

  test('cart persists delete to localStorage', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    const card = cartRow(page, 'Burger');
    await card.getByRole('button').nth(2).click();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    expect(cart.some((item: { _id: string }) => item._id === 'snack-1')).toBe(false);
  });

  test('clear button resets localStorage cart', async ({ page }) => {
    await openCart(page, { cart: TEST_CART });
    await page.getByRole('button', { name: 'Clear' }).click();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    expect(cart).toEqual([]);
  });

  test('alternate cart renders chocolate cake entry', async ({ page }) => {
    await openCart(page, { cart: ALT_CART });
    await expect(page.getByText('Chocolate Cake')).toBeVisible();
  });

  test('alternate cart total is 885', async ({ page }) => {
    await openCart(page, { cart: ALT_CART });
    await expect(page.getByRole('heading', { name: '₹885' })).toBeVisible();
  });

  test('alternate cart header count is 3', async ({ page }) => {
    await openCart(page, { cart: ALT_CART });
    await expect(page.getByRole('heading', { name: 'Your Cart (3)' })).toBeVisible();
  });

  test('alternate cart decrement lowers chocolate cake quantity', async ({ page }) => {
    await openCart(page, { cart: ALT_CART });
    const card = cartRow(page, 'Chocolate Cake');
    await card.getByRole('button').nth(0).click();
    await expect(card.getByText('2', { exact: true })).toBeVisible();
  });
});
