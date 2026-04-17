import { Page } from '@playwright/test';
import { PUBLIC_TEST_RESTAURANT, getTableAccessKey } from './public-access';

const API_BASE = 'http://127.0.0.1:5001/api';

/**
 * Login as admin via the real API and inject tokens into localStorage.
 */
export async function loginAsAdmin(page: Page) {
  // Hit the real login endpoint
  const res = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@cafe.com', password: 'admin123' },
  });

  if (!res.ok()) {
    throw new Error(`Admin login failed: ${res.status()} ${await res.text()}`);
  }

  const data = await res.json();

  // Inject into localStorage before navigating
  await page.addInitScript((loginData) => {
    localStorage.setItem('token', loginData.token);
    localStorage.setItem('user', JSON.stringify(loginData.user));
  }, data);
}

/**
 * Inject a fake customer session into localStorage.
 * Uses a dummy token and user for pages that only check presence.
 */
export async function injectFakeCustomerSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('customerToken', 'fake-customer-token-for-testing');
    localStorage.setItem(
      'customerUser',
      JSON.stringify({
        _id: 'test-customer-123',
        name: 'Test Customer',
        email: 'test@example.com',
        role: 'user',
      })
    );
  });
}

/**
 * Inject cart items into localStorage for testing Cart/Checkout pages.
 */
export async function injectCartItems(page: Page) {
  await page.addInitScript(({ restaurantAccessKey, tableAccessKey }) => {
    localStorage.setItem(
      'cart',
      JSON.stringify([
        {
          _id: 'test-item-1',
          name: 'Test Latte',
          price: 250,
          image: '',
          category: 'Coffee',
          quantity: 2,
        },
        {
          _id: 'test-item-2',
          name: 'Test Croissant',
          price: 150,
          image: '',
          category: 'Snacks',
          quantity: 1,
        },
      ])
    );
    localStorage.setItem('restaurantAccessKey', restaurantAccessKey);
    localStorage.setItem('tableAccessKey', tableAccessKey);
  }, {
    restaurantAccessKey: PUBLIC_TEST_RESTAURANT.accessKey,
    tableAccessKey: getTableAccessKey(7),
  });
}

/**
 * Clear all auth/cart data from localStorage.
 */
export async function clearAllSessions(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
  });
}
