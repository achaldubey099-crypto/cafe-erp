import { expect, test, type Page } from '@playwright/test';

import { clearStorage, mockFeedback } from './helpers/ui-fixtures';
import {
  getProtectedCafeUrl,
  getProtectedTableUrl,
  getTableAccessKey,
  getTableLabel,
  mockProtectedMenuApis,
  mockProtectedOrderApis,
  openProtectedTable,
  seedProtectedAccess,
} from './helpers/public-access';

const protectedTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const restaurantEntryTables = [1, 2, 3, 4, 5];
const rebindPairs: Array<[number, number]> = [
  [1, 6],
  [2, 7],
  [3, 8],
  [4, 9],
  [5, 10],
];
const trackedTables = [3, 6, 9, 12, 15];

async function readStorage(page: Page, key: string) {
  return page.evaluate((storageKey) => localStorage.getItem(storageKey), key);
}

test.describe('Protected Public Access Links', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  for (const tableNumber of protectedTables) {
    test(`protected table url ${tableNumber} loads the right table context`, async ({ page }) => {
      await mockProtectedMenuApis(page, { defaultTableNumber: tableNumber });
      await openProtectedTable(page, tableNumber);

      await expect(
        page.getByRole('banner').getByText(getTableLabel(tableNumber), { exact: true })
      ).toBeVisible();
      await expect.poll(() => readStorage(page, 'tableAccessKey')).toBe(getTableAccessKey(tableNumber));
    });
  }

  for (const tableNumber of restaurantEntryTables) {
    test(`restaurant access url redirects into first protected table ${tableNumber}`, async ({ page }) => {
      await mockProtectedMenuApis(page, { defaultTableNumber: tableNumber });
      await page.goto(getProtectedCafeUrl());

      await expect(page).toHaveURL(new RegExp(`/access/${getTableAccessKey(tableNumber)}$`));
      await expect(
        page.getByRole('banner').getByText(getTableLabel(tableNumber), { exact: true })
      ).toBeVisible();
    });
  }

  for (const [fromTable, toTable] of rebindPairs) {
    test(`switching from protected table ${fromTable} to ${toTable} clears the old session`, async ({ page }) => {
      await seedProtectedAccess(page, fromTable);
      await mockProtectedMenuApis(page, { defaultTableNumber: fromTable });
      await openProtectedTable(page, fromTable);
      await page.evaluate(() => {
        localStorage.setItem('sessionId', 'existing_protected_session');
      });
      await expect.poll(() => readStorage(page, 'sessionId')).toBe('existing_protected_session');

      await mockProtectedMenuApis(page, { defaultTableNumber: toTable });
      await openProtectedTable(page, toTable);

      await expect.poll(() => readStorage(page, 'tableAccessKey')).toBe(getTableAccessKey(toTable));
      await expect.poll(() => readStorage(page, 'sessionId')).toBeNull();
    });
  }

  for (const tableNumber of trackedTables) {
    test(`orders stay scoped when opened from protected table ${tableNumber}`, async ({ page }) => {
      await seedProtectedAccess(page, tableNumber);
      await mockProtectedOrderApis(page, {
        tableNumber,
        orders: [
          {
            _id: `tracked-${tableNumber}`,
            createdAt: '2026-04-14T10:00:00.000Z',
            items: [{ itemId: 'latte', name: 'Red Velvet Latte', price: 325, quantity: 1 }],
            grandTotal: 325,
            status: 'pending',
            estimatedTime: '10 mins',
            tableId: tableNumber,
          },
        ],
      });
      await mockFeedback(page, null);

      await page.goto('/orders');
      await expect(page.getByText('Order total ₹325.00', { exact: true })).toBeVisible();
      await expect.poll(() => readStorage(page, 'tableAccessKey')).toBe(getTableAccessKey(tableNumber));
    });
  }
});
