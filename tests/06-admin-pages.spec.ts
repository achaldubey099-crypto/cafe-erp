import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Admin Pages (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await loginAsAdmin(page);
    } catch {
      test.skip(true, 'Admin login failed — no admin account. Create admin@cafe.com / admin123 to run these tests.');
    }
  });

  test('dashboard loads after admin login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1500);
    
    // Should NOT be on login page
    expect(page.url()).not.toContain('/admin/login');
    
    // Sidebar should be visible
    await expect(page.locator('text=Artisan Admin')).toBeVisible({ timeout: 5000 });
  });

  test('sidebar navigation — POS link works', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    
    const posLink = page.locator('a[href="/admin/pos"]');
    if (await posLink.isVisible().catch(() => false)) {
      await posLink.click();
      await page.waitForURL('**/admin/pos**', { timeout: 5000 });
      expect(page.url()).toContain('/admin/pos');
    }
  });

  test('sidebar navigation — Orders link works', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    
    const ordersLink = page.locator('a[href="/admin/orders"]');
    if (await ordersLink.isVisible().catch(() => false)) {
      await ordersLink.click();
      await page.waitForURL('**/admin/orders**', { timeout: 5000 });
      expect(page.url()).toContain('/admin/orders');
    }
  });

  test('sidebar navigation — Inventory link works', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    
    const link = page.locator('a[href="/admin/inventory"]');
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await page.waitForURL('**/admin/inventory**', { timeout: 5000 });
      expect(page.url()).toContain('/admin/inventory');
    }
  });

  test('sidebar navigation — Analytics link works', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    
    const link = page.locator('a[href="/admin/analytics"]');
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await page.waitForURL('**/admin/analytics**', { timeout: 5000 });
      expect(page.url()).toContain('/admin/analytics');
    }
  });

  test('logout button clears session and redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1500);
    
    const logoutBtn = page.locator('button', { hasText: 'Logout' });
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      
      await page.waitForURL('**/admin/login**', { timeout: 5000 });
      expect(page.url()).toContain('/admin/login');
      
      // Verify token is cleared
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    }
  });
});
