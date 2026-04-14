import { test, expect } from '@playwright/test';
import { injectFakeCustomerSession, clearAllSessions } from './helpers/auth';

test.describe('Profile Page', () => {
  test('profile page loads for guest', async ({ page }) => {
    await clearAllSessions(page);
    await page.goto('/profile');
    
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 5000 });
  });

  test('guest sees login button on profile', async ({ page }) => {
    await clearAllSessions(page);
    await page.goto('/profile');
    
    const loginBtn = page.locator('button', { hasText: 'Login' });
    await expect(loginBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('no "Default Payment" or "Apple Pay" text present', async ({ page }) => {
    await injectFakeCustomerSession(page);
    await page.goto('/profile');
    
    await page.waitForTimeout(1000);
    
    // Verify the removed payment method is NOT shown
    const defaultPayment = page.locator('text=Default Payment');
    await expect(defaultPayment).toHaveCount(0);
    
    const applePay = page.locator('text=Apple Pay');
    await expect(applePay).toHaveCount(0);
  });

  test('Account Settings section exists', async ({ page }) => {
    await injectFakeCustomerSession(page);
    await page.goto('/profile');
    
    await expect(page.locator('text=Account Settings')).toBeVisible({ timeout: 5000 });
  });

  test('loyalty card section displays', async ({ page }) => {
    await injectFakeCustomerSession(page);
    await page.goto('/profile');
    
    await expect(page.locator('text=Current Balance')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Points Earned/')).toBeVisible();
  });
});
