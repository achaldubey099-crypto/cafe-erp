# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-cart.spec.ts >> Cart Page >> cart shows injected items correctly
- Location: tests/02-cart.spec.ts:33:7

# Error details

```
Error: page.goto: Test ended.
Call log:
  - navigating to "http://localhost:3000/cart", waiting until "networkidle"

```

# Test source

```ts
  1  | import { test, expect, Page } from '@playwright/test';
  2  | 
  3  | const CART_ITEMS = [
  4  |   { _id: 'test-item-1', name: 'Test Latte', price: 250, image: '', category: 'Coffee', quantity: 2 },
  5  |   { _id: 'test-item-2', name: 'Test Croissant', price: 150, image: '', category: 'Snacks', quantity: 1 },
  6  | ];
  7  | 
  8  | /**
  9  |  * Navigate to cart with items pre-loaded.
  10 |  * The trick: set localStorage BEFORE the React app mounts by using addInitScript
  11 |  * which runs before any page JS, then navigate.
  12 |  */
  13 | async function gotoCartWithItems(page: Page, items: any[] = CART_ITEMS) {
  14 |   // addInitScript runs before any page JS on every navigation  
  15 |   await page.addInitScript((cartData: string) => {
  16 |     localStorage.setItem('cart', cartData);
  17 |   }, JSON.stringify(items));
  18 |   
  19 |   // Now navigate — the script will fire before React mounts
> 20 |   await page.goto('/cart', { waitUntil: 'networkidle' });
     |              ^ Error: page.goto: Test ended.
  21 | }
  22 | 
  23 | test.describe('Cart Page', () => {
  24 |   test('empty cart shows "Your cart is empty" message', async ({ page }) => {
  25 |     // Clear everything then navigate
  26 |     await page.addInitScript(() => {
  27 |       localStorage.removeItem('cart');
  28 |     });
  29 |     await page.goto('/cart');
  30 |     await expect(page.locator('text=Your cart is empty')).toBeVisible({ timeout: 5000 });
  31 |   });
  32 | 
  33 |   test('cart shows injected items correctly', async ({ page }) => {
  34 |     await gotoCartWithItems(page);
  35 |     await expect(page.locator('text=Test Latte')).toBeVisible({ timeout: 5000 });
  36 |     await expect(page.locator('text=Test Croissant')).toBeVisible({ timeout: 5000 });
  37 |   });
  38 | 
  39 |   test('clear button empties the cart', async ({ page }) => {
  40 |     await gotoCartWithItems(page);
  41 |     
  42 |     await expect(page.locator('text=Test Latte')).toBeVisible({ timeout: 5000 });
  43 |     
  44 |     const clearButton = page.locator('button', { hasText: 'Clear' });
  45 |     await clearButton.click();
  46 |     
  47 |     await expect(page.locator('text=Your cart is empty')).toBeVisible({ timeout: 5000 });
  48 |   });
  49 | 
  50 |   test('checkout button exists when cart has items', async ({ page }) => {
  51 |     await gotoCartWithItems(page);
  52 |     
  53 |     const checkoutBtn = page.locator('button', { hasText: 'Checkout' });
  54 |     await expect(checkoutBtn).toBeVisible({ timeout: 5000 });
  55 |   });
  56 | 
  57 |   test('checkout button takes guest to checkout', async ({ page }) => {
  58 |     await gotoCartWithItems(page);
  59 |     
  60 |     const checkoutBtn = page.locator('button', { hasText: 'Checkout' });
  61 |     await expect(checkoutBtn).toBeVisible({ timeout: 5000 });
  62 |     await checkoutBtn.click();
  63 |     
  64 |     await page.waitForURL('**/checkout**', { timeout: 5000 });
  65 |     expect(page.url()).toContain('/checkout');
  66 |   });
  67 | 
  68 |   test('total price displays correctly for injected items', async ({ page }) => {
  69 |     await gotoCartWithItems(page);
  70 |     
  71 |     // 2 * 250 + 1 * 150 = 650
  72 |     await expect(page.locator('text=₹650')).toBeVisible({ timeout: 5000 });
  73 |   });
  74 | });
  75 | 
```