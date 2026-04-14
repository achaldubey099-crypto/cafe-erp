import { test, expect } from '@playwright/test';

test.describe('Order Tracking Page', () => {
  test('page loads and shows Order Tracking header', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('text=Order Tracking')).toBeVisible({ timeout: 5000 });
  });

  test('current status section renders', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('text=Current Status')).toBeVisible({ timeout: 5000 });
  });

  test('shows order info or "No active order" message', async ({ page }) => {
    await page.goto('/orders');
    
    await page.waitForTimeout(3000);
    
    // Should show either an order total or "No active order found"
    const hasOrderTotal = await page.locator('text=/Order total/').isVisible().catch(() => false);
    const hasNoOrder = await page.locator('text=No active order found').isVisible().catch(() => false);
    
    expect(hasOrderTotal || hasNoOrder).toBe(true);
  });

  test('feedback star rating buttons render', async ({ page }) => {
    await page.goto('/orders');
    
    // 5 star buttons should be present
    const starButtons = page.locator('button[aria-label*="Rate"]');
    await expect(starButtons).toHaveCount(5, { timeout: 5000 });
  });

  test('feedback textarea renders', async ({ page }) => {
    await page.goto('/orders');
    
    const textarea = page.locator('textarea[placeholder*="Tell us"]');
    await expect(textarea).toBeVisible({ timeout: 5000 });
  });

  test('progress timeline has 3 steps', async ({ page }) => {
    await page.goto('/orders');
    
    await expect(page.locator('text=Pending')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Preparing')).toBeVisible();
    await expect(page.getByText('Ready', { exact: true })).toBeVisible();
  });

  test('back button navigates to home', async ({ page }) => {
    await page.goto('/orders');
    
    const backBtn = page.locator('button').filter({ has: page.locator('svg.lucide-arrow-left') }).first();
    await backBtn.click();
    
    await page.waitForURL('**/', { timeout: 5000 });
    expect(page.url().endsWith('/') || page.url().endsWith(':3000')).toBe(true);
  });
});
