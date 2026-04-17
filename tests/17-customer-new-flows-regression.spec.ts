import { expect, test, type Page } from '@playwright/test';

import {
  EXISTING_FEEDBACK,
  TEST_CART,
  TRACKING_ORDER,
  clearStorage,
  mockFeedback,
  mockLatestOrder,
  seedCart,
  seedCustomer,
} from './helpers/ui-fixtures';
import { mockProtectedMenuApis, openProtectedTable, seedProtectedAccess } from './helpers/public-access';

const paymentMethods = ['UPI', 'Card', 'Counter'] as const;
const splitExpectations = [
  { people: 1, perPerson: '₹1175' },
  { people: 2, perPerson: '₹588' },
  { people: 3, perPerson: '₹392' },
  { people: 4, perPerson: '₹294' },
  { people: 5, perPerson: '₹235' },
];
const modalTables = [2, 5, 8, 11, 14];
const reviewRatings = [1, 2, 3, 4, 5];

async function scanTableAndOpenCheckout(page: Page, tableNumber = 7) {
  await clearStorage(page);
  await seedCart(page, TEST_CART);
  await seedProtectedAccess(page, tableNumber);
  await mockProtectedMenuApis(page);
  await openProtectedTable(page, tableNumber);
  await page.goto('/checkout');
  await expect(page.getByText('Finalize Order')).toBeVisible();
}

async function openTrackingForReview(
  page: Page,
  options?: { cancelled?: boolean; customer?: boolean; feedback?: typeof EXISTING_FEEDBACK | null }
) {
  const order = options?.cancelled
    ? { ...TRACKING_ORDER, _id: 'cancelled-order', status: 'cancelled' as const, tableId: 7 }
    : { ...TRACKING_ORDER, status: 'pending' as const };

  await clearStorage(page);
  await seedProtectedAccess(page, 7);
  if (options?.customer) {
    await seedCustomer(page);
  }
  await mockLatestOrder(page, order);
  await mockFeedback(page, options?.feedback === undefined ? null : options.feedback);
  await page.goto('/orders');
}

test.describe('Customer New Flow Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  for (const method of paymentMethods) {
    test(`checkout shows ${method} payment option`, async ({ page }) => {
      await scanTableAndOpenCheckout(page, 7);
      await expect(page.getByRole('button', { name: method })).toBeVisible();
    });
  }

  for (const method of paymentMethods) {
    test(`checkout can select ${method} payment option`, async ({ page }) => {
      await scanTableAndOpenCheckout(page, 7);
      const button = page.getByRole('button', { name: method });
      await button.click();
      await expect(button).toHaveClass(/border-primary/);
    });
  }

  for (const entry of splitExpectations) {
    test(`split bill shows ${entry.perPerson} per person for ${entry.people} people`, async ({ page }) => {
      await scanTableAndOpenCheckout(page, 7);

      const splitBillSection = page.locator('section').filter({ has: page.getByText('Split Bill') }).first();
      const plusButton = splitBillSection.locator('button').nth(1);
      for (let step = 1; step < entry.people; step += 1) {
        await plusButton.click();
      }

      await expect(splitBillSection.getByText(entry.perPerson)).toBeVisible();
    });
  }

  for (const tableNumber of modalTables) {
    test(`counter checkout success modal is shown for protected table ${tableNumber}`, async ({ page }) => {
      await page.route('**/api/orders', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Order placed successfully',
            order: { ...TRACKING_ORDER, _id: `modal-${tableNumber}`, tableId: tableNumber },
          }),
        });
      });

      await scanTableAndOpenCheckout(page, tableNumber);
      await page.getByRole('button', { name: 'Counter' }).click();
      await page.getByRole('button', { name: /Place Order/ }).click();

      await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Track Order' })).toBeVisible();
    });
  }

  test('cancelled order page shows cancelled status', async ({ page }) => {
    await openTrackingForReview(page, { cancelled: true });
    await expect(page.getByRole('heading', { name: 'No Active Order' })).toBeVisible();
  });

  test('cancelled order page shows the active-order empty state', async ({ page }) => {
    await openTrackingForReview(page, { cancelled: true });
    await expect(page.getByText('No pending, preparing, or ready orders right now.')).toBeVisible();
  });

  test('cancelled order page clears the order total card', async ({ page }) => {
    await openTrackingForReview(page, { cancelled: true });
    await expect(page.getByText('No order selected')).toBeVisible();
  });

  test('cancelled order page clears the item summary', async ({ page }) => {
    await openTrackingForReview(page, { cancelled: true });
    await expect(page.getByText('No order items yet')).toBeVisible();
  });

  for (const rating of reviewRatings) {
    test(`customer can submit a ${rating} star review`, async ({ page }) => {
      let reviewPayload: Record<string, unknown> | null = null;

      await clearStorage(page);
      await seedCustomer(page);
      await seedProtectedAccess(page, 7);
      await mockLatestOrder(page, { ...TRACKING_ORDER, status: 'pending' as const });
      await page.route('**/api/feedback/order/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ feedback: null }),
        });
      });
      await page.route('**/api/feedback', async (route) => {
        reviewPayload = route.request().postDataJSON?.() || null;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Review saved',
            feedback: {
              ...EXISTING_FEEDBACK,
              rating,
              comment: `rating ${rating}`,
              updatedAt: new Date().toISOString(),
            },
          }),
        });
      });

      await page.goto('/orders');
      await page.getByRole('button', { name: new RegExp(`Rate ${rating} star`) }).click();
      await page.getByPlaceholder('Tell us about your coffee...').fill(`rating ${rating}`);
      await page.getByRole('button', { name: 'Submit Review' }).click();

      await expect.poll(() => reviewPayload?.rating).toBe(rating);
      await expect.poll(() => reviewPayload?.comment).toBe(`rating ${rating}`);
      await expect(page.getByText('Review submitted. Thank you.')).toBeVisible();
    });
  }
});
