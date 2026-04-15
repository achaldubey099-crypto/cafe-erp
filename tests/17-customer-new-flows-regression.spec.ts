import { expect, test, type Page } from '@playwright/test';

import {
  EXISTING_FEEDBACK,
  TEST_CART,
  TRACKING_ORDER,
  clearStorage,
  mockFeedback,
  mockLatestOrder,
  mockMenu,
  seedCart,
  seedCustomer,
} from './helpers/ui-fixtures';

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

async function scanTableAndOpenCheckout(page: Page, tableId = 7) {
  await clearStorage(page);
  await seedCart(page, TEST_CART);
  await mockMenu(page);
  await page.goto(`/?tableId=${tableId}`);
  await expect(page.getByText(`Table #${tableId} connected`)).toBeVisible();
  await page.goto(`/checkout?tableId=${tableId}`);
  await expect(page.getByText('Finalize Order')).toBeVisible();
}

async function openTrackingForReview(page: Page, options?: { cancelled?: boolean; customer?: boolean; feedback?: typeof EXISTING_FEEDBACK | null }) {
  const order = options?.cancelled
    ? { ...TRACKING_ORDER, _id: 'cancelled-order', status: 'cancelled' as const, tableId: 7 }
    : TRACKING_ORDER;

  await clearStorage(page);
  if (options?.customer) {
    await seedCustomer(page);
  }
  await page.addInitScript(() => {
    localStorage.setItem('tableId', '7');
  });
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

  for (const tableId of modalTables) {
    test(`counter checkout success modal is shown for table ${tableId}`, async ({ page }) => {
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
            order: { ...TRACKING_ORDER, _id: `modal-${tableId}`, tableId },
          }),
        });
      });

      await scanTableAndOpenCheckout(page, tableId);
      await page.getByRole('button', { name: 'Counter' }).click();
      await page.getByRole('button', { name: /Place Order/ }).click();

      await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible();
      await expect(page.getByText(`Your order for Table #${tableId} has been sent to the kitchen.`)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Track Order' })).toBeVisible();
    });
  }

  test('cancelled order page shows cancelled status', async ({ page }) => {
    await openTrackingForReview(page, { cancelled: true });
    await expect(page.getByRole('heading', { name: 'Cancelled' })).toBeVisible();
  });

  test('cancelled order page shows cancellation banner', async ({ page }) => {
    await openTrackingForReview(page, { cancelled: true });
    await expect(page.getByText('The kitchen marked this order as cancelled.')).toBeVisible();
  });

  test('cancelled order page still shows order total', async ({ page }) => {
    await openTrackingForReview(page, { cancelled: true });
    await expect(page.getByText('Order total ₹640.00')).toBeVisible();
  });

  test('cancelled order page still shows item summary', async ({ page }) => {
    await openTrackingForReview(page, { cancelled: true });
    await expect(page.getByText('Red Velvet Latte x1, Chocolate Cake x1')).toBeVisible();
  });

  for (const rating of reviewRatings) {
    test(`customer can submit a ${rating} star review`, async ({ page }) => {
      let reviewPayload: Record<string, unknown> | null = null;

      await clearStorage(page);
      await seedCustomer(page);
      await page.addInitScript(() => {
        localStorage.setItem('tableId', '7');
      });
      await mockLatestOrder(page, TRACKING_ORDER);
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
