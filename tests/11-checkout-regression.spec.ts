import { expect, test } from '@playwright/test';

import {
  ALT_CART,
  TEST_CART,
  TRACKING_ORDER,
  clearStorage,
  mockFeedback,
  mockLatestOrder,
  mockOrderSubmission,
  seedCart,
  seedCustomer,
  seedTable,
} from './helpers/ui-fixtures';

async function openCheckout(
  page: Parameters<typeof test>[0]['page'],
  options?: { customer?: boolean; cart?: typeof TEST_CART; tableId?: string }
) {
  await clearStorage(page);

  if (options?.customer) {
    await seedCustomer(page);
  }

  if (options?.cart) {
    await seedCart(page, options.cart);
  }

  await seedTable(page, options?.tableId || '7');
  await page.goto('/checkout');
}

function splitBillSection(page: Parameters<typeof test>[0]['page']) {
  return page.locator('section').filter({ has: page.getByRole('heading', { name: 'Split Bill' }) });
}

function summarySection(page: Parameters<typeof test>[0]['page']) {
  return page.locator('section').filter({ has: page.getByText('Subtotal') });
}

const paymentMethods = ['UPI', 'Card', 'Counter'] as const;

test.describe('Checkout Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('guest is redirected to login', async ({ page }) => {
    await openCheckout(page, { cart: TEST_CART });
    await expect(page).toHaveURL(/\/login/);
  });

  test('authenticated customer sees finalize order heading', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByRole('heading', { name: 'Finalize Order' })).toBeVisible();
  });

  test('checkout shows tray heading', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByRole('heading', { name: 'Your Tray' })).toBeVisible();
  });

  test('checkout shows cart item count text', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByText('2 ITEMS')).toBeVisible();
  });

  test('checkout shows split bill section', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByText('Split Bill')).toBeVisible();
  });

  test('checkout shows payment method section', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByText('Payment Method')).toBeVisible();
  });

  test('checkout shows place order button', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByRole('button', { name: /Place Order/ })).toBeVisible();
  });

  test('checkout shows subtotal row', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByText('Subtotal')).toBeVisible();
  });

  test('checkout shows platform fee row', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByText('Platform Fee')).toBeVisible();
  });

  test('checkout shows tax row', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByText('Tax')).toBeVisible();
  });

  test('checkout shows total row', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByText('Total', { exact: true })).toBeVisible();
  });

  for (const item of TEST_CART) {
    test(`tray lists ${item.name}`, async ({ page }) => {
      await openCheckout(page, { customer: true, cart: TEST_CART });
      await expect(page.getByText(item.name)).toBeVisible();
    });

    test(`${item.name} shows quantity in tray`, async ({ page }) => {
      await openCheckout(page, { customer: true, cart: TEST_CART });
      await expect(page.getByText(`Qty: ${item.quantity}`)).toBeVisible();
    });

    test(`${item.name} shows line amount in tray`, async ({ page }) => {
      await openCheckout(page, { customer: true, cart: TEST_CART });
      await expect(page.getByText(`₹${item.price * item.quantity}`)).toBeVisible();
    });
  }

  for (const method of paymentMethods) {
    test(`payment method ${method} is visible`, async ({ page }) => {
      await openCheckout(page, { customer: true, cart: TEST_CART });
      await expect(page.getByRole('button', { name: method })).toBeVisible();
    });
  }

  test('UPI is selected by default', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    const upi = page.getByRole('button', { name: 'UPI' });
    await expect(upi).toHaveClass(/border-primary/);
  });

  test('clicking Card selects card payment', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    const button = page.getByRole('button', { name: 'Card' });
    await button.click();
    await expect(button).toHaveClass(/border-primary/);
  });

  test('clicking Counter selects counter payment', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    const button = page.getByRole('button', { name: 'Counter' });
    await button.click();
    await expect(button).toHaveClass(/border-primary/);
  });

  test('card selection removes active style from UPI', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await page.getByRole('button', { name: 'Card' }).click();
    await expect(page.getByRole('button', { name: 'UPI' })).not.toHaveClass(/border-primary/);
  });

  test('subtotal matches seeded cart', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(summarySection(page).getByText(/^₹1100$/)).toBeVisible();
  });

  test('platform fee is fixed at 20', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByText('₹20')).toBeVisible();
  });

  test('tax is 5 percent rounded', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByText('₹55')).toBeVisible();
  });

  test('footer button shows total amount', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByRole('button', { name: /₹1175/ })).toBeVisible();
  });

  test('people count starts at 1', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible();
  });

  test('per person amount starts at full total', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(splitBillSection(page).getByText(/^₹1175$/)).toBeVisible();
  });

  test('increasing people count to 2 updates split amount', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    const splitSection = splitBillSection(page);
    await splitSection.locator('button').nth(1).click();
    await expect(splitSection.getByText(/^₹588$/)).toBeVisible();
  });

  test('increasing people count twice shows 3 people', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    const splitSection = splitBillSection(page);
    await splitSection.locator('button').nth(1).click();
    await splitSection.locator('button').nth(1).click();
    await expect(splitSection.locator('span').filter({ hasText: /^3$/ })).toBeVisible();
  });

  test('decreasing people count does not go below 1', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    const splitSection = splitBillSection(page);
    await splitSection.locator('button').nth(0).click();
    await expect(splitSection.locator('span').filter({ hasText: /^1$/ })).toBeVisible();
  });

  test('session id is created on load', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART, tableId: '7' });
    const sessionId = await page.evaluate(() => localStorage.getItem('sessionId'));
    expect(sessionId).toContain('_7');
  });

  test('query tableId persists to storage', async ({ page }) => {
    await clearStorage(page);
    await seedCustomer(page);
    await seedCart(page, TEST_CART);
    await page.goto('/checkout?tableId=9');
    const tableId = await page.evaluate(() => localStorage.getItem('tableId'));
    expect(tableId).toBe('9');
  });

  test('empty authenticated cart still shows checkout screen', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: [] as typeof TEST_CART });
    await expect(page.getByRole('heading', { name: 'Finalize Order' })).toBeVisible();
  });

  test('placing order with empty cart shows alert', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: [] as typeof TEST_CART });
    await page.evaluate(() => {
      (window as typeof window & { __lastAlert?: string }).__lastAlert = '';
      window.alert = (message?: string) => {
        (window as typeof window & { __lastAlert?: string }).__lastAlert = String(message ?? '');
      };
    });
    await page.getByRole('button', { name: 'Counter' }).click();
    await page.getByRole('button', { name: /Place Order/ }).evaluate((button: HTMLButtonElement) => button.click());
    await page.waitForFunction(() => (window as typeof window & { __lastAlert?: string }).__lastAlert === 'Cart is empty');
  });

  test('successful order placement shows success alert', async ({ page }) => {
    await mockOrderSubmission(page, TRACKING_ORDER);
    await mockLatestOrder(page, TRACKING_ORDER);
    await openCheckout(page, { customer: true, cart: TEST_CART, tableId: '7' });
    await page.getByRole('button', { name: 'Counter' }).click();
    const dialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: /Place Order/ }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBe('Order placed successfully!');
    await dialog.accept();
  });

  test('successful order placement navigates to orders with table id', async ({ page }) => {
    await mockOrderSubmission(page, TRACKING_ORDER);
    await mockLatestOrder(page, TRACKING_ORDER);
    await mockFeedback(page, null);
    await openCheckout(page, { customer: true, cart: TEST_CART, tableId: '7' });
    await page.getByRole('button', { name: 'Counter' }).click();
    const dialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: /Place Order/ }).click();
    const dialog = await dialogPromise;
    await dialog.accept();
    await expect(page).toHaveURL(/\/orders\?tableId=7/);
  });

  test('successful order placement clears cart storage', async ({ page }) => {
    await mockOrderSubmission(page, TRACKING_ORDER);
    await mockLatestOrder(page, TRACKING_ORDER);
    await mockFeedback(page, null);
    await openCheckout(page, { customer: true, cart: TEST_CART, tableId: '7' });
    await page.getByRole('button', { name: 'Counter' }).click();
    const dialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: /Place Order/ }).click();
    const dialog = await dialogPromise;
    await dialog.accept();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'));
    expect(cart).toEqual([]);
  });

  test('alternate cart subtotal is visible', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: ALT_CART });
    await expect(summarySection(page).getByText(/^₹885$/)).toBeVisible();
  });

  test('alternate cart footer total is 949', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: ALT_CART });
    await expect(page.getByRole('button', { name: /₹949/ })).toBeVisible();
  });

  test('back button is visible in checkout header', async ({ page }) => {
    await openCheckout(page, { customer: true, cart: TEST_CART });
    await expect(page.locator('button').first()).toBeVisible();
  });
});
