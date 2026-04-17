import { expect, test, type Page } from '@playwright/test';

import { MENU_PRODUCTS, TEST_CART, TRACKING_ORDER, clearStorage, mockFeedback, mockOrderSubmission, seedCart, seedCustomer } from './helpers/ui-fixtures';
import { getProtectedTableUrl, getTableAccessKey, getTableLabel, mockProtectedMenuApis, mockProtectedOrderApis, openProtectedTable, seedProtectedAccess } from './helpers/public-access';

const scannedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const checkoutTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const tableRebindPairs: Array<[number, number]> = [
  [1, 4],
  [2, 5],
  [3, 8],
  [4, 1],
  [6, 9],
  [7, 10],
  [8, 2],
  [11, 12],
];
const trackingTables = [2, 4, 6, 8, 10, 12, 14, 16];

async function readStorage(page: Page, key: string) {
  return page.evaluate((storageKey) => localStorage.getItem(storageKey), key);
}

async function scanTableOnMenu(page: Page, tableNumber: number) {
  await mockProtectedMenuApis(page, { products: MENU_PRODUCTS, defaultTableNumber: tableNumber });
  await openProtectedTable(page, tableNumber);
  await expect(
    page.getByRole('banner').getByText(getTableLabel(tableNumber), { exact: true })
  ).toBeVisible();
}

async function openCheckoutForScannedTable(page: Page, tableNumber: number) {
  await clearStorage(page);
  await seedCustomer(page);
  await seedCart(page, TEST_CART);
  await seedProtectedAccess(page, tableNumber);
  await page.goto('/checkout');
  await expect(page.getByText('Finalize Order')).toBeVisible();
}

test.describe('Table QR Ordering Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  for (const tableNumber of scannedTables) {
    test(`protected table link binds table ${tableNumber} in storage`, async ({ page }) => {
      await scanTableOnMenu(page, tableNumber);
      await expect.poll(() => readStorage(page, 'tableAccessKey')).toBe(getTableAccessKey(tableNumber));
    });
  }

  for (const tableNumber of checkoutTables) {
    test(`counter checkout submits with protected table ${tableNumber}`, async ({ page }) => {
      let orderPayload: Record<string, any> | null = null;

      await page.route('**/api/orders', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }

        orderPayload = route.request().postDataJSON?.() || null;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Order placed successfully',
            order: {
              ...TRACKING_ORDER,
              _id: `table-${tableNumber}-order`,
              tableId: tableNumber,
            },
          }),
        });
      });

      await openCheckoutForScannedTable(page, tableNumber);
      await page.getByRole('button', { name: 'Counter' }).click();
      await page.getByRole('button', { name: /Place Order/ }).click();

      await expect.poll(() => orderPayload?.paymentMethod).toBe('Counter');
      await expect.poll(() => String(orderPayload?.sessionId || '')).toContain(getTableAccessKey(tableNumber));
      await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Track Order' })).toBeVisible();
    });
  }

  for (const [fromTable, toTable] of tableRebindPairs) {
    test(`opening table ${toTable} after table ${fromTable} resets the old session`, async ({ page }) => {
      await clearStorage(page);
      await seedCustomer(page);
      await seedCart(page, TEST_CART);
      await seedProtectedAccess(page, fromTable);
      await page.goto('/checkout');
      await expect(page.getByText('Finalize Order')).toBeVisible();
      await expect.poll(() => readStorage(page, 'sessionId')).not.toBeNull();

      await scanTableOnMenu(page, toTable);
      await expect.poll(() => readStorage(page, 'tableAccessKey')).toBe(getTableAccessKey(toTable));
      await expect.poll(() => readStorage(page, 'sessionId')).toBeNull();
    });
  }

  for (const tableNumber of trackingTables) {
    test(`orders page keeps table ${tableNumber} scoped through protected storage`, async ({ page }) => {
      await clearStorage(page);
      await seedProtectedAccess(page, tableNumber);
      await mockProtectedOrderApis(page, {
        tableNumber,
        orders: [{ ...TRACKING_ORDER, _id: `tracking-${tableNumber}`, tableId: tableNumber, status: 'pending' }],
      });
      await mockFeedback(page, null);
      await page.goto('/orders');

      await expect(page.getByText(/Order total ₹/)).toBeVisible();
      await expect.poll(() => readStorage(page, 'tableAccessKey')).toBe(getTableAccessKey(tableNumber));
    });
  }

  test('protected table urls are not plain table numbers', async ({ page }) => {
    await scanTableOnMenu(page, 7);
    expect(getProtectedTableUrl(7)).not.toContain('tableId=');
    await expect(page).toHaveURL(/\/access\/table_access_7$/);
  });
});
