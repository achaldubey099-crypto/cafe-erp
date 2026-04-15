import { expect, test, type Page } from '@playwright/test';

import {
  MENU_PRODUCTS,
  TEST_CART,
  TRACKING_ORDER,
  clearStorage,
  mockMenu,
  seedCart,
} from './helpers/ui-fixtures';

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

async function scanTableOnMenu(page: Page, tableId: number) {
  await mockMenu(page, MENU_PRODUCTS);
  await page.goto(`/?tableId=${tableId}`);
  await expect(page.getByText(`Table #${tableId} connected`)).toBeVisible();
}

async function openCheckoutForScannedTable(page: Page, tableId: number) {
  await clearStorage(page);
  await seedCart(page, TEST_CART);
  await page.goto(`/checkout?tableId=${tableId}`);
  await expect(page.getByText('Finalize Order')).toBeVisible();
}

test.describe('Table QR Ordering Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  for (const tableId of scannedTables) {
    test(`menu scan binds table ${tableId} from QR url`, async ({ page }) => {
      await scanTableOnMenu(page, tableId);
      await expect.poll(() => readStorage(page, 'tableId')).toBe(String(tableId));
    });
  }

  for (const tableId of scannedTables) {
    test(`guest profile shows scanned table ${tableId}`, async ({ page }) => {
      await clearStorage(page);
      await page.goto(`/profile?tableId=${tableId}`);
      await expect(page.getByText(`Table #${tableId}`)).toBeVisible();
      await expect.poll(() => readStorage(page, 'tableId')).toBe(String(tableId));
    });
  }

  for (const tableId of checkoutTables) {
    test(`counter checkout submits scanned table ${tableId}`, async ({ page }) => {
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
              _id: `table-${tableId}-order`,
              tableId,
            },
          }),
        });
      });

      await openCheckoutForScannedTable(page, tableId);
      await page.getByRole('button', { name: 'Counter' }).click();
      await page.getByRole('button', { name: /Place Order/ }).click();

      await expect.poll(() => orderPayload?.tableId).toBe(tableId);
      await expect.poll(() => orderPayload?.paymentMethod).toBe('Counter');
      await expect.poll(() => String(orderPayload?.sessionId || '')).toContain(`_${tableId}`);
      await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible();
      await expect(page.getByText(`Your order for Table #${tableId} has been sent to the kitchen.`)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Track Order' })).toBeVisible();
    });
  }

  for (const [fromTable, toTable] of tableRebindPairs) {
    test(`scanning table ${toTable} after table ${fromTable} clears the old session`, async ({ page }) => {
      await clearStorage(page);
      await mockMenu(page, MENU_PRODUCTS);

      await page.goto(`/checkout?tableId=${fromTable}`);
      await expect(page.getByText('Finalize Order')).toBeVisible();
      await expect.poll(() => readStorage(page, 'sessionId')).not.toBeNull();

      await page.goto(`/?tableId=${toTable}`);
      await expect(page.getByText(`Table #${toTable} connected`)).toBeVisible();
      await expect.poll(() => readStorage(page, 'tableId')).toBe(String(toTable));
      await expect.poll(() => readStorage(page, 'sessionId')).toBeNull();
    });
  }

  for (const tableId of trackingTables) {
    test(`orders page uses query table ${tableId} when loading latest order`, async ({ page }) => {
      let seenTableId = '';

      await page.route('**/api/orders/latest**', async (route) => {
        seenTableId = new URL(route.request().url()).searchParams.get('tableId') || '';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...TRACKING_ORDER,
            _id: `tracking-${tableId}`,
            tableId,
          }),
        });
      });

      await page.goto(`/orders?tableId=${tableId}`);

      await expect.poll(() => seenTableId).toBe(String(tableId));
      await expect(page.getByText('Order total ₹640.00')).toBeVisible();
      await expect.poll(() => readStorage(page, 'tableId')).toBe(String(tableId));
    });
  }
});
