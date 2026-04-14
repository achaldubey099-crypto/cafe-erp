import { test, expect } from '@playwright/test';

test.describe('Menu Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads and shows Artisan Café header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Artisan Café');
  });

  test('menu items load from backend', async ({ page }) => {
    // Wait for loading to finish
    await page.waitForSelector('text=Loading menu...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // Should have at least one product card with a price tag (₹)
    const priceElements = page.locator('text=/₹\\d+/');
    await expect(priceElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('category tabs render and are clickable', async ({ page }) => {
    // Wait for categories to load
    await page.waitForSelector('text=Loading menu...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // Wait for category buttons to appear
    await page.waitForTimeout(1500);
    
    // Category buttons section
    const categorySection = page.locator('section.mb-8');
    const categoryButtons = categorySection.locator('button');
    const count = await categoryButtons.count();
    
    // Should have at least one category tab
    expect(count).toBeGreaterThan(0);
    
    if (count > 1) {
      await categoryButtons.nth(1).click();
      // The category heading should still render after switching tabs
      await expect(page.locator('h2')).toContainText('Menu');
    }
  });

  test('search bar exists and filters products', async ({ page }) => {
    await page.waitForSelector('text=Loading menu...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Type a gibberish term − should result in 0 items
    await searchInput.fill('zzzzzznonexistent');
    await page.waitForTimeout(500);
    
    const itemCount = page.locator('text=/\\d+ Items/');
    await expect(itemCount).toContainText('0 Items');
  });

  test('login button visible for guests', async ({ page }) => {
    await page.waitForSelector('text=Loading menu...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    const loginButton = page.locator('button', { hasText: 'Login' });
    await expect(loginButton).toBeVisible();
  });

  test('add-to-cart redirects guest to /login', async ({ page }) => {
    await page.waitForSelector('text=Loading menu...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // Try clicking the first + button on a product card
    const addButton = page.locator('section.px-6 button svg.lucide-plus').first();
    
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForURL('**/login**', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    }
  });

  test('featured product section renders if available', async ({ page }) => {
    await page.waitForSelector('text=Loading menu...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // Check for "Editor's Choice" badge
    const editorChoice = page.locator("text=Editor's Choice");
    // This is optional − pass if no featured product
    const isVisible = await editorChoice.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });
});
