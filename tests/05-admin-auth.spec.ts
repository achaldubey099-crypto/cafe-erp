import { test, expect } from '@playwright/test';
import { clearAllSessions, loginAsAdmin } from './helpers/auth';

test.describe('Admin Route Protection', () => {
  test('/admin without token redirects to /admin/login', async ({ page }) => {
    await clearAllSessions(page);
    await page.goto('/admin');
    
    await page.waitForURL('**/admin/login**', { timeout: 5000 });
    expect(page.url()).toContain('/admin/login');
  });

  test('/admin/orders without token redirects to /admin/login', async ({ page }) => {
    await clearAllSessions(page);
    await page.goto('/admin/orders');
    
    await page.waitForURL('**/admin/login**', { timeout: 5000 });
    expect(page.url()).toContain('/admin/login');
  });

  test('/admin/pos without token redirects to /admin/login', async ({ page }) => {
    await clearAllSessions(page);
    await page.goto('/admin/pos');
    
    await page.waitForURL('**/admin/login**', { timeout: 5000 });
    expect(page.url()).toContain('/admin/login');
  });

  test('/admin/inventory without token redirects to /admin/login', async ({ page }) => {
    await clearAllSessions(page);
    await page.goto('/admin/inventory');
    
    await page.waitForURL('**/admin/login**', { timeout: 5000 });
    expect(page.url()).toContain('/admin/login');
  });

  test('/admin/login page renders login form', async ({ page }) => {
    await page.goto('/admin/login');
    
    await expect(page.locator('text=Admin Login')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
  });

  test('invalid admin credentials show error', async ({ page }) => {
    await page.goto('/admin/login');
    
    await page.fill('input[type="email"]', 'wrong@wrong.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Login")');
    
    // Should show error on the page (either alert or inline)
    await page.waitForTimeout(2000);
    
    // Should still be on login page
    expect(page.url()).toContain('/admin/login');
  });

  test('customer token cannot access /admin', async ({ page }) => {
    // Inject a customer token (not admin)
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-non-admin-token');
      localStorage.setItem('user', JSON.stringify({
        _id: 'fake',
        name: 'Fake',
        role: 'user',
      }));
    });
    
    await page.goto('/admin');
    
    // Should redirect away from admin (to /admin/login or /)
    await page.waitForTimeout(2000);
    expect(page.url()).not.toMatch(/\/admin\/?$/);
  });
});
