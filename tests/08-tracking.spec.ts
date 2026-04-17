import { test, expect } from '@playwright/test';

import { TRACKING_ORDER, clearStorage, mockFeedback, mockLatestOrder, seedCustomer, seedTable } from './helpers/ui-fixtures';

test.describe('Order Tracking Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await seedTable(page, '7');
    await mockLatestOrder(page, { ...TRACKING_ORDER, status: 'pending' });
    await mockFeedback(page, null);
  });

  test('page loads and shows order tracking header', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('text=Order Tracking')).toBeVisible({ timeout: 5000 });
  });

  test('current status section renders', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('text=Current Status')).toBeVisible({ timeout: 5000 });
  });

  test('shows the active order total', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByText(/Order total ₹/)).toBeVisible();
  });

  test('feedback star rating buttons render', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('button[aria-label*="Rate"]')).toHaveCount(5, { timeout: 5000 });
  });

  test('feedback textarea renders', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('textarea[placeholder*="Tell us"]')).toBeVisible({ timeout: 5000 });
  });

  test('progress timeline has pending, preparing, ready steps', async ({ page }) => {
    await page.goto('/orders');
    const timeline = page.locator('main');
    await expect(timeline.getByText('Pending', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(timeline.getByText('Preparing', { exact: true }).last()).toBeVisible();
    await expect(timeline.getByText('Ready', { exact: true }).last()).toBeVisible();
  });

  test('back button navigates away from orders', async ({ page }) => {
    await page.goto('/orders');
    await page.locator('button').filter({ has: page.locator('svg.lucide-arrow-left') }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('logged-in customer sees review controls enabled', async ({ page }) => {
    await seedCustomer(page);
    await page.goto('/orders');
    await page.getByRole('button', { name: 'Rate 5 stars' }).click();
    await expect(page.getByRole('button', { name: 'Submit Review' })).toBeEnabled();
  });
});
