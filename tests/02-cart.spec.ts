import { test, expect, Page } from '@playwright/test';

const CART_ITEMS = [
  { _id: 'test-item-1', name: 'Test Latte', price: 250, image: '', category: 'Coffee', quantity: 2 },
  { _id: 'test-item-2', name: 'Test Croissant', price: 150, image: '', category: 'Snacks', quantity: 1 },
];

/**
 * Navigate to cart with items pre-loaded.
 * The trick: set localStorage BEFORE the React app mounts by using addInitScript
 * which runs before any page JS, then navigate.
 */
async function gotoCartWithItems(page: Page, items: any[] = CART_ITEMS) {
  // addInitScript runs before any page JS on every navigation  
  await page.addInitScript((cartData: string) => {
    localStorage.setItem('cart', cartData);
  }, JSON.stringify(items));
  
  // Now navigate — the script will fire before React mounts
  await page.goto('/cart', { waitUntil: 'networkidle' });
}

test.describe('Cart Page', () => {
  test('empty cart shows "Your cart is empty" message', async ({ page }) => {
    // Clear everything then navigate
    await page.addInitScript(() => {
      localStorage.removeItem('cart');
    });
    await page.goto('/cart');
    await expect(page.locator('text=Your cart is empty')).toBeVisible({ timeout: 5000 });
  });

  test('cart shows injected items correctly', async ({ page }) => {
    await gotoCartWithItems(page);
    await expect(page.locator('text=Test Latte')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Test Croissant')).toBeVisible({ timeout: 5000 });
  });

  test('clear button empties the cart', async ({ page }) => {
    await gotoCartWithItems(page);
    
    await expect(page.locator('text=Test Latte')).toBeVisible({ timeout: 5000 });
    
    const clearButton = page.locator('button', { hasText: 'Clear' });
    await clearButton.click();
    
    await expect(page.locator('text=Your cart is empty')).toBeVisible({ timeout: 5000 });
  });

  test('checkout button exists when cart has items', async ({ page }) => {
    await gotoCartWithItems(page);
    
    const checkoutBtn = page.locator('button', { hasText: 'Checkout' });
    await expect(checkoutBtn).toBeVisible({ timeout: 5000 });
  });

  test('checkout button redirects guest to login', async ({ page }) => {
    await gotoCartWithItems(page);
    
    const checkoutBtn = page.locator('button', { hasText: 'Checkout' });
    await expect(checkoutBtn).toBeVisible({ timeout: 5000 });
    await checkoutBtn.click();
    
    await page.waitForURL('**/login**', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('total price displays correctly for injected items', async ({ page }) => {
    await gotoCartWithItems(page);
    
    // 2 * 250 + 1 * 150 = 650
    await expect(page.locator('text=₹650')).toBeVisible({ timeout: 5000 });
  });
});
