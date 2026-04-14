import { expect, test } from '@playwright/test';

import { clearStorage, mockAdminPageApis, seedAdmin } from './helpers/ui-fixtures';

async function openAdmin(page: Parameters<typeof test>[0]['page'], path = '/admin') {
  await clearStorage(page);
  await seedAdmin(page);
  await mockAdminPageApis(page);
  await page.goto(path);
}

test.describe('Admin Pages (Authenticated)', () => {
  test('dashboard loads after admin login', async ({ page }) => {
    await openAdmin(page, '/admin');
    expect(page.url()).not.toContain('/admin/login');
    await expect(page.getByText('Artisan Admin')).toBeVisible({ timeout: 5000 });
  });

  test('sidebar navigation — POS link works', async ({ page }) => {
    await openAdmin(page, '/admin');
    await page.locator('a[href="/admin/pos"]').click();
    await page.waitForURL('**/admin/pos**', { timeout: 5000 });
    expect(page.url()).toContain('/admin/pos');
  });

  test('sidebar navigation — Orders link works', async ({ page }) => {
    await openAdmin(page, '/admin');
    await page.locator('a[href="/admin/orders"]').click();
    await page.waitForURL('**/admin/orders**', { timeout: 5000 });
    expect(page.url()).toContain('/admin/orders');
  });

  test('sidebar navigation — Inventory link works', async ({ page }) => {
    await openAdmin(page, '/admin');
    await page.locator('a[href="/admin/inventory"]').click();
    await page.waitForURL('**/admin/inventory**', { timeout: 5000 });
    expect(page.url()).toContain('/admin/inventory');
  });

  test('sidebar navigation — Analytics link works', async ({ page }) => {
    await openAdmin(page, '/admin');
    await page.locator('a[href="/admin/analytics"]').click();
    await page.waitForURL('**/admin/analytics**', { timeout: 5000 });
    expect(page.url()).toContain('/admin/analytics');
  });

  test('logout button clears session and redirects to /admin/login', async ({ page }) => {
    await openAdmin(page, '/admin');
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/admin/login**', { timeout: 5000 });
    expect(page.url()).toContain('/admin/login');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});
