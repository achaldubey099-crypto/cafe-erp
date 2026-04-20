import { expect, test } from '@playwright/test';

import {
  EXISTING_FEEDBACK,
  MOCK_CUSTOMER,
  PROFILE_FAVORITES,
  PROFILE_ORDERS,
  TRACKING_ORDER,
  clearStorage,
  mockFavorites,
  mockFeedback,
  mockLatestOrder,
  mockOrders,
  seedCustomer,
  seedTable,
} from './helpers/ui-fixtures';
import { getProtectedTableUrl } from './helpers/public-access';

async function openProfile(
  page: Parameters<typeof test>[0]['page'],
  options?: { customer?: boolean }
) {
  await clearStorage(page);
  await seedTable(page, '7');

  if (options?.customer) {
    await seedCustomer(page);
    await mockOrders(page, PROFILE_ORDERS);
    await mockFavorites(page, PROFILE_FAVORITES);
  }

  await page.goto('/profile');
}

async function openTracking(
  page: Parameters<typeof test>[0]['page'],
  options?: { customer?: boolean; order?: typeof TRACKING_ORDER | null; feedback?: typeof EXISTING_FEEDBACK | null }
) {
  await clearStorage(page);
  await seedTable(page, '7');
  await mockLatestOrder(
    page,
    options?.order === undefined ? { ...TRACKING_ORDER, status: 'pending' } : options.order
  );
  await mockFeedback(page, options?.feedback === undefined ? EXISTING_FEEDBACK : options.feedback);

  if (options?.customer) {
    await seedCustomer(page);
  }

  await page.goto('/orders');
}

function favoritesSection(page: Parameters<typeof test>[0]['page']) {
  return page.locator('section').filter({ has: page.getByRole('heading', { name: 'Favorites' }) });
}

const profileFavoriteNames = PROFILE_FAVORITES.map((favorite) => favorite.itemId.name);
const orderStatuses = ['pending', 'preparing', 'ready', 'completed'] as const;

test.describe('Profile And Tracking Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('guest profile page heading is visible', async ({ page }) => {
    await openProfile(page);
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  });

  test('guest profile shows login button in header', async ({ page }) => {
    await openProfile(page);
    await expect(page.getByRole('button', { name: 'Login' }).first()).toBeVisible();
  });

  test('guest profile shows main login with google button', async ({ page }) => {
    await openProfile(page);
    await expect(page.getByRole('button', { name: 'Login with Google' })).toBeVisible();
  });

  test('guest profile shows guest user name', async ({ page }) => {
    await openProfile(page);
    await expect(page.getByRole('heading', { name: 'Guest User' })).toBeVisible();
  });

  test('guest profile shows default table number', async ({ page }) => {
    await openProfile(page);
    await expect(page.getByText('Table #7')).toBeVisible();
  });

  test('guest profile shows loyalty balance card', async ({ page }) => {
    await openProfile(page);
    await expect(page.getByText('Current Balance')).toBeVisible();
  });

  test('guest profile hides favorites section', async ({ page }) => {
    await openProfile(page);
    await expect(page.getByText('Favorites')).toHaveCount(0);
  });

  test('guest profile hides past orders section', async ({ page }) => {
    await openProfile(page);
    await expect(page.getByText('Past Orders')).toHaveCount(0);
  });

  test('guest profile shows account settings tile', async ({ page }) => {
    await openProfile(page);
    await expect(page.getByText('Account Settings')).toBeVisible();
  });

  test('guest header login button routes to login', async ({ page }) => {
    await openProfile(page);
    await page.getByRole('button', { name: 'Login' }).first().click();
    await expect(page).toHaveURL(/\/login\?returnTo=\/profile/);
  });

  test('guest main login button routes to login', async ({ page }) => {
    await openProfile(page);
    await page.getByRole('button', { name: 'Login with Google' }).click();
    await expect(page).toHaveURL(/\/login\?returnTo=\/profile/);
  });

  test('login page shows rewards-focused sign-in heading', async ({ page }) => {
    await openProfile(page);
    await page.getByRole('button', { name: 'Login with Google' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in to unlock exciting rewards' })).toBeVisible();
  });

  test('guest back button returns to menu', async ({ page }) => {
    await openProfile(page);
    await page.locator('button').first().click();
    await expect(page).toHaveURL(new RegExp(`${getProtectedTableUrl(7)}$`));
  });

  test('logged-in profile shows customer name', async ({ page }) => {
    await openProfile(page, { customer: true });
    await expect(page.getByRole('heading', { name: MOCK_CUSTOMER.name })).toBeVisible();
  });

  test('logged-in profile shows logout button in header', async ({ page }) => {
    await openProfile(page, { customer: true });
    await expect(page.getByRole('button', { name: 'Logout' }).first()).toBeVisible();
  });

  test('logged-in profile shows favorites heading', async ({ page }) => {
    await openProfile(page, { customer: true });
    await expect(page.getByText('Favorites')).toBeVisible();
  });

  test('logged-in profile shows past orders heading', async ({ page }) => {
    await openProfile(page, { customer: true });
    await expect(page.getByText('Past Orders')).toBeVisible();
  });

  test('logged-in profile shows total spent text', async ({ page }) => {
    await openProfile(page, { customer: true });
    await expect(page.getByText('₹1445.00 spent')).toBeVisible();
  });

  test('logged-in profile shows points earned text', async ({ page }) => {
    await openProfile(page, { customer: true });
    await expect(page.getByText('144 Points Earned')).toBeVisible();
  });

  for (const favoriteName of profileFavoriteNames) {
    test(`favorite ${favoriteName} is rendered`, async ({ page }) => {
      await openProfile(page, { customer: true });
      await expect(favoritesSection(page).getByText(favoriteName, { exact: true })).toBeVisible();
    });
  }

  test('favorite price for chocolate cake is visible', async ({ page }) => {
    await openProfile(page, { customer: true });
    await expect(favoritesSection(page).getByText(/^₹295$/)).toBeVisible();
  });

  test('favorite price for red velvet latte is visible', async ({ page }) => {
    await openProfile(page, { customer: true });
    await expect(page.getByText('₹325')).toBeVisible();
  });

  test('logged-in profile lets customers order a favorite directly', async ({ page }) => {
    await openProfile(page, { customer: true });
    await page.getByRole('button', { name: 'Order now' }).first().click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText('Chocolate Cake')).toBeVisible();
  });

  test('past order row for first order is visible', async ({ page }) => {
    await openProfile(page, { customer: true });
    await expect(page.getByText('Order #order-1')).toBeVisible();
  });

  test('past order row for second order is visible', async ({ page }) => {
    await openProfile(page, { customer: true });
    await expect(page.getByText('Order #order-2')).toBeVisible();
  });

  test('past order shows completed status pills', async ({ page }) => {
    await openProfile(page, { customer: true });
    await expect(page.getByText('completed').first()).toBeVisible();
  });

  test('logged-in profile logout clears back to guest state', async ({ page }) => {
    await openProfile(page, { customer: true });
    await page.getByRole('button', { name: 'Logout' }).first().click();
    await page.waitForFunction(() => !localStorage.getItem('customerToken'));
    await expect(page).toHaveURL(new RegExp(`${getProtectedTableUrl(7)}$`));
  });

  test('logged-in profile removes favorites after logout', async ({ page }) => {
    await openProfile(page, { customer: true });
    await page.getByRole('button', { name: 'Logout' }).first().click();
    await expect(page.getByText('Favorites')).toHaveCount(0);
  });

  test('profile error message renders when orders fail', async ({ page }) => {
    await clearStorage(page);
    await seedCustomer(page);
    await seedTable(page, '7');
    await page.route('**/api/orders**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'boom' }),
      });
    });
    await page.route('**/api/favorites**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.goto('/profile');
    await expect(page.getByText('Failed to load profile data')).toBeVisible();
  });

  test('tracking page heading is visible', async ({ page }) => {
    await openTracking(page);
    await expect(page.getByRole('heading', { name: 'Order Tracking' })).toBeVisible();
  });

  test('tracking page shows current status label', async ({ page }) => {
    await openTracking(page);
    await expect(page.getByText('Current Status')).toBeVisible();
  });

  test('tracking page shows order total banner', async ({ page }) => {
    await openTracking(page);
    await expect(page.getByText(/Order total ₹/)).toBeVisible();
  });

  test('tracking page shows order item summary', async ({ page }) => {
    await openTracking(page);
    await expect(page.getByText('Red Velvet Latte x1, Chocolate Cake x1')).toBeVisible();
  });

  test('tracking page shows five rating buttons', async ({ page }) => {
    await openTracking(page);
    await expect(page.locator('button[aria-label^="Rate"]')).toHaveCount(5);
  });

  test('tracking page shows feedback textarea', async ({ page }) => {
    await openTracking(page);
    await expect(page.getByPlaceholder('Tell us about your coffee...')).toBeVisible();
  });

  test('guest tracking shows login to review button', async ({ page }) => {
    await openTracking(page);
    await expect(page.getByRole('button', { name: 'Login to Review' })).toBeVisible();
  });

  test('guest tracking login button routes to login', async ({ page }) => {
    await openTracking(page);
    await page.getByRole('button', { name: 'Login to Review' }).click();
    await expect(page).toHaveURL(/\/login\?returnTo=\/orders/);
  });

  test('tracking back button returns to menu', async ({ page }) => {
    await openTracking(page);
    await page.locator('button').first().click();
    await expect(page).toHaveURL(new RegExp(`${getProtectedTableUrl(7)}$`));
  });

  for (const status of orderStatuses) {
    test(`tracking renders ${status} order status state`, async ({ page }) => {
      await openTracking(page, {
        order: {
          ...TRACKING_ORDER,
          status,
        },
        feedback: null,
      });
      const expectedText =
        status === 'ready'
          ? 'Ready for Pickup'
          : status === 'completed'
            ? 'No Active Order'
            : status.charAt(0).toUpperCase() + status.slice(1);
      await expect(page.getByRole('heading', { name: expectedText })).toBeVisible();
    });
  }

  test('tracking shows existing review heading for logged-in customer', async ({ page }) => {
    await openTracking(page, { customer: true });
    await expect(page.getByText('Your review')).toBeVisible();
  });

  test('tracking preloads existing feedback comment', async ({ page }) => {
    await openTracking(page, { customer: true });
    await expect(page.getByPlaceholder('Tell us about your coffee...')).toHaveValue(EXISTING_FEEDBACK.comment);
  });

  test('tracking shows update review button when feedback exists', async ({ page }) => {
    await openTracking(page, { customer: true });
    await expect(page.getByRole('button', { name: 'Update Review' })).toBeVisible();
  });

  test('tracking lets logged-in user choose a rating', async ({ page }) => {
    await openTracking(page, { customer: true, feedback: null });
    await page.getByRole('button', { name: 'Rate 5 stars' }).click();
    await expect(page.getByRole('button', { name: 'Submit Review' })).toBeEnabled();
  });

  test('tracking keeps submit review disabled without rating', async ({ page }) => {
    await openTracking(page, { customer: true, feedback: null });
    await expect(page.getByRole('button', { name: 'Submit Review' })).toBeDisabled();
  });

  test('tracking submits new review successfully', async ({ page }) => {
    await openTracking(page, { customer: true, feedback: null });
    await page.getByRole('button', { name: 'Rate 5 stars' }).click();
    await page.getByPlaceholder('Tell us about your coffee...').fill('Everything tasted great.');
    await page.getByRole('button', { name: 'Submit Review' }).click();
    await expect(page.getByText('Review submitted. Thank you.')).toBeVisible();
  });

  test('tracking updates existing review successfully', async ({ page }) => {
    await openTracking(page, { customer: true });
    await page.getByPlaceholder('Tell us about your coffee...').fill('Updated thoughts from the test suite.');
    await page.getByRole('button', { name: 'Update Review' }).click();
    await expect(page.getByText('Review updated. Thank you.')).toBeVisible();
  });

  test('tracking shows no order message when latest order is missing', async ({ page }) => {
    await openTracking(page, { order: null, feedback: null });
    await expect(page.getByText('No pending, preparing, or ready orders right now.')).toBeVisible();
  });

  test('tracking shows no order item fallback when there is no latest order', async ({ page }) => {
    await openTracking(page, { order: null, feedback: null });
    await expect(page.getByText('No order items yet')).toBeVisible();
  });

  test('tracking disables review controls when there is no order', async ({ page }) => {
    await openTracking(page, { order: null, feedback: null });
    await expect(page.getByPlaceholder('Tell us about your coffee...')).toBeDisabled();
  });

  test('tracking shows place-order-first guidance with no order', async ({ page }) => {
    await openTracking(page, { order: null, feedback: null });
    await expect(page.getByText('Place an order first, then come back here to review it.')).toBeVisible();
  });

  test('tracking shows pending stage label', async ({ page }) => {
    await openTracking(page);
    await expect(page.locator('main').getByText('Pending', { exact: true }).first()).toBeVisible();
  });

  test('tracking shows preparing stage label', async ({ page }) => {
    await openTracking(page);
    await expect(page.getByText('Preparing')).toBeVisible();
  });

  test('tracking shows ready stage label', async ({ page }) => {
    await openTracking(page);
    await expect(page.getByText('Ready', { exact: true })).toBeVisible();
  });
});
