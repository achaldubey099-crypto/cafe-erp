import { expect, test, type Page } from '@playwright/test';

import {
  TEST_CART,
  TRACKING_ORDER,
  clearStorage,
  installMockRazorpay,
  mockAdminPageApis,
  mockFeedback,
  mockLatestOrder,
  mockPaymentCreateOrder,
  mockPaymentVerify,
  seedAdmin,
  seedCart,
  seedCustomer,
  seedTable,
} from './helpers/ui-fixtures';

async function openCheckout(page: Page) {
  await clearStorage(page);
  await seedCustomer(page);
  await seedCart(page, TEST_CART);
  await seedTable(page, '7');
  await page.goto('/checkout');
}

async function openAdmin(page: Page, path = '/admin') {
  await clearStorage(page);
  await seedAdmin(page);
  await mockAdminPageApis(page);
  await page.goto(path);
}

async function stubAlerts(page: Page) {
  await page.addInitScript(() => {
    (window as typeof window & { __lastAlert?: string }).__lastAlert = '';
    window.alert = (message?: string) => {
      (window as typeof window & { __lastAlert?: string }).__lastAlert = String(message ?? '');
    };
  });
}

async function waitForMockRazorpay(page: Page) {
  await page.waitForFunction(() => typeof (window as typeof window & { Razorpay?: unknown }).Razorpay === 'function');
}

function staffRow(page: Page, name: string) {
  return page.locator('tr').filter({ has: page.getByText(name) }).first();
}

function orderTableRow(page: Page, text: string) {
  return page.locator('tr').filter({ has: page.getByText(text) }).first();
}

function posCard(page: Page, text: string) {
  return page.locator('article').filter({ has: page.getByText(text) }).first();
}

test.describe('Razorpay Checkout Flows', () => {
  test('UPI creates a Razorpay order with the correct amount and opens checkout', async ({ page }) => {
    let createOrderPayload: Record<string, unknown> | null = null;

    await installMockRazorpay(page);
    await page.route('**/api/payment/create-order', async (route) => {
      createOrderPayload = route.request().postDataJSON?.() || null;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'order_rzp_upi_1',
          amount: 117500,
          currency: 'INR',
        }),
      });
    });

    await openCheckout(page);
    await waitForMockRazorpay(page);
    await page.getByRole('button', { name: /Place Order/ }).click();

    await expect.poll(() => createOrderPayload?.amount).toBe(1175);
    await expect
      .poll(() =>
        page.evaluate(() => ({
          openCount: (window as typeof window & { __razorpayOpenCount?: number }).__razorpayOpenCount || 0,
          options: ((window as typeof window & { __razorpayOptionsHistory?: any[] }).__razorpayOptionsHistory || [])[0],
        }))
      )
      .toMatchObject({
        openCount: 1,
        options: {
          order_id: 'order_rzp_upi_1',
          amount: 117500,
          currency: 'INR',
          name: 'Cafe ERP',
        },
      });

    const snapshot = await page.evaluate(() => ({
      openCount: (window as typeof window & { __razorpayOpenCount?: number }).__razorpayOpenCount || 0,
      options: ((window as typeof window & { __razorpayOptionsHistory?: any[] }).__razorpayOptionsHistory || [])[0],
    }));

    expect(snapshot.options.order_id).toBe('order_rzp_upi_1');
    expect(snapshot.options.amount).toBe(117500);
    expect(snapshot.options.currency).toBe('INR');
    expect(snapshot.options.name).toBe('Cafe ERP');
  });

  test('Card payment verifies Razorpay response and submits the order', async ({ page }) => {
    let verifyPayload: Record<string, unknown> | null = null;
    let orderPayload: Record<string, any> | null = null;

    await stubAlerts(page);
    await installMockRazorpay(page, {
      autoResolve: true,
      response: {
        razorpay_order_id: 'order_rzp_card_1',
        razorpay_payment_id: 'pay_card_1',
        razorpay_signature: 'sig_card_1',
      },
    });

    await page.route('**/api/payment/create-order', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'order_rzp_card_1',
          amount: 117500,
          currency: 'INR',
        }),
      });
    });

    await page.route('**/api/payment/verify', async (route) => {
      verifyPayload = route.request().postDataJSON?.() || null;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

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
          order: TRACKING_ORDER,
        }),
      });
    });

    await mockLatestOrder(page, TRACKING_ORDER);
    await mockFeedback(page, null);

    await openCheckout(page);
    await waitForMockRazorpay(page);
    await page.getByRole('button', { name: 'Card' }).click();
    await page.getByRole('button', { name: /Place Order/ }).click();

    await expect.poll(() => verifyPayload?.razorpay_payment_id).toBe('pay_card_1');
    await expect.poll(() => orderPayload?.paymentMethod).toBe('Card');
    await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible();
    await page.getByRole('button', { name: 'Track Order' }).click();
    await expect(page).toHaveURL(/\/orders$/);

    const state = await page.evaluate(() => ({
      cart: JSON.parse(localStorage.getItem('cart') || '[]'),
    }));

    expect(state.cart).toEqual([]);
  });

  test('Counter checkout bypasses Razorpay and posts the order directly', async ({ page }) => {
    let createOrderCalls = 0;
    let orderPayload: Record<string, any> | null = null;

    await stubAlerts(page);
    await page.route('**/api/payment/create-order', async (route) => {
      createOrderCalls += 1;
      await route.abort();
    });

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
          order: TRACKING_ORDER,
        }),
      });
    });

    await mockLatestOrder(page, TRACKING_ORDER);
    await mockFeedback(page, null);

    await openCheckout(page);
    await page.getByRole('button', { name: 'Counter' }).click();
    await page.getByRole('button', { name: /Place Order/ }).click();

    await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible();
    expect(createOrderCalls).toBe(0);
    expect(orderPayload?.paymentMethod).toBe('Counter');
  });

  test('payment-init failure shows the fallback alert and does not submit an order', async ({ page }) => {
    let orderCalls = 0;

    await stubAlerts(page);
    await installMockRazorpay(page);
    await page.route('**/api/payment/create-order', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'gateway down' }),
      });
    });

    await page.route('**/api/orders', async (route) => {
      orderCalls += 1;
      await route.abort();
    });

    await openCheckout(page);
    await page.getByRole('button', { name: /Place Order/ }).click();

    await expect(page.getByRole('heading', { name: 'Payment Failed' })).toBeVisible();

    expect(orderCalls).toBe(0);
  });

  test('Razorpay constructor failure is surfaced to the customer', async ({ page }) => {
    await stubAlerts(page);
    await installMockRazorpay(page, { throwOnConstruct: true });
    await mockPaymentCreateOrder(page, {
      id: 'order_rzp_throw_1',
      amount: 117500,
      currency: 'INR',
    });
    await mockPaymentVerify(page);

    await openCheckout(page);
    await waitForMockRazorpay(page);
    await page.getByRole('button', { name: /Place Order/ }).click();

    await expect(page.getByRole('heading', { name: 'Payment Failed' })).toBeVisible();
  });
});

test.describe('Admin Control Flows', () => {
  test('orders status dropdown sends the selected status update', async ({ page }) => {
    let updatePayload: Record<string, unknown> | null = null;

    await clearStorage(page);
    await seedAdmin(page);
    await mockAdminPageApis(page);
    await page.route('**/api/orders/**', async (route) => {
      const request = route.request();
      if (request.method() === 'PUT') {
        updatePayload = request.postDataJSON?.() || null;
        const orderId = request.url().split('/').pop() || 'admin-order-1';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            order: {
              _id: orderId,
              status: updatePayload?.status || 'preparing',
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/admin/orders');
    const row = orderTableRow(page, 'Table 3');
    const select = row.locator('select').first();
    await select.selectOption('ready');

    await expect(select).toHaveValue('ready');
    expect(updatePayload).toEqual({ status: 'ready' });
  });

  test('orders export control produces a CSV download', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^orders-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  test('POS complete control removes the finished table from the queue', async ({ page }) => {
    await openAdmin(page, '/admin/pos');
    await expect(page.getByRole('button', { name: /Table 3/ })).toBeVisible();

    await posCard(page, 'Burger x1').getByRole('button', { name: 'Complete' }).click();

    await expect(page.getByRole('button', { name: /Table 3/ })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Table 5 Orders' })).toBeVisible();
  });

  test('POS delete control removes the selected order card', async ({ page }) => {
    await openAdmin(page, '/admin/pos');
    const card = posCard(page, 'Burger x1');
    await expect(card).toBeVisible();

    await card.getByRole('button', { name: 'Delete' }).click();

    await expect(card).toHaveCount(0);
  });

  test('staff create control adds a new team member to the roster', async ({ page }) => {
    await openAdmin(page, '/admin/staff');
    await page.getByRole('button', { name: 'Add New Staff' }).click();
    await page.getByPlaceholder('e.g. Sarah Connor').fill('Nina Patel');
    await page.getByPlaceholder('e.g. sarah@artisan.coffee').fill('nina@artisan.coffee');
    await page.locator('select').nth(0).selectOption('manager');
    await page.getByRole('button', { name: 'Create Profile' }).click();

    await expect(staffRow(page, 'Nina Patel')).toBeVisible();
    await expect(staffRow(page, 'Nina Patel').getByText('manager', { exact: false })).toBeVisible();
  });

  test('staff edit control updates the existing member row', async ({ page }) => {
    await openAdmin(page, '/admin/staff');
    const row = staffRow(page, 'Sarah Connor');
    await row.getByRole('button', { name: 'Edit' }).click();

    await page.getByPlaceholder('e.g. Sarah Connor').fill('Sarah Updated');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(staffRow(page, 'Sarah Updated')).toBeVisible();
    await expect(staffRow(page, 'Sarah Connor')).toHaveCount(0);
  });

  test('staff delete control removes the member after confirmation', async ({ page }) => {
    await page.addInitScript(() => {
      window.confirm = () => true;
    });

    await openAdmin(page, '/admin/staff');
    const row = staffRow(page, 'Leo Park');
    await row.getByRole('button', { name: 'Delete' }).click();

    await expect(staffRow(page, 'Leo Park')).toHaveCount(0);
  });

  test('inventory add-item control creates a new menu row', async ({ page }) => {
    await openAdmin(page, '/admin/inventory');
    await page.getByRole('button', { name: 'Add New Item' }).click();

    await page.getByPlaceholder('e.g. Iced Latte').fill('Playwright Pour Over');
    await page.getByPlaceholder('e.g. 180').fill('199');
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Save Item' }).click();

    await expect(page.getByText('Playwright Special')).toBeVisible();
  });

  test('analytics range control switches from 7 days to 30 days', async ({ page }) => {
    await openAdmin(page, '/admin/analytics');
    const toggle = page.getByRole('button', { name: '30 Days' });

    await toggle.click();

    await expect(toggle).toHaveClass(/bg-white/);
    await expect(page.getByText('Payment Breakdown')).toBeVisible();
  });

  test('settings controls keep the general form accessible', async ({ page }) => {
    await openAdmin(page, '/admin/settings');

    await expect(page.getByRole('button', { name: 'Save Branding' })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.locator('input[type="text"]').nth(1)).toHaveValue('Fuel Headquarters');
  });
});
