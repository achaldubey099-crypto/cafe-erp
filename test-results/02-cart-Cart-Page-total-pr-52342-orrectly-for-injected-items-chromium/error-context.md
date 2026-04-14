# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-cart.spec.ts >> Cart Page >> total price displays correctly for injected items
- Location: tests/02-cart.spec.ts:68:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=₹650')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=₹650')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - banner [ref=e5]:
      - generic [ref=e6]:
        - button [ref=e7]:
          - img [ref=e8]
        - heading "Your Cart (0)" [level=1] [ref=e10]
        - button "Clear" [ref=e11]
    - main [ref=e12]:
      - generic [ref=e13]:
        - img [ref=e15]
        - generic [ref=e19]:
          - heading "Your cart is empty" [level=2] [ref=e20]
          - paragraph [ref=e21]: Looks like you haven't added any brews yet.
        - button "Browse Menu" [ref=e22]
  - navigation [ref=e23]:
    - link "Menu" [ref=e24] [cursor=pointer]:
      - /url: /
      - img [ref=e25]
      - generic [ref=e27]: Menu
    - link "Checkout" [ref=e28] [cursor=pointer]:
      - /url: /checkout
      - img [ref=e29]
      - generic [ref=e33]: Checkout
    - link "Orders" [ref=e34] [cursor=pointer]:
      - /url: /orders
      - img [ref=e35]
      - generic [ref=e38]: Orders
    - link "Profile" [ref=e39] [cursor=pointer]:
      - /url: /profile
      - img [ref=e40]
      - generic [ref=e43]: Profile
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
  20 |   await page.goto('/cart', { waitUntil: 'networkidle' });
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
  57 |   test('checkout button redirects guest to login', async ({ page }) => {
  58 |     await gotoCartWithItems(page);
  59 |     
  60 |     const checkoutBtn = page.locator('button', { hasText: 'Checkout' });
  61 |     await expect(checkoutBtn).toBeVisible({ timeout: 5000 });
  62 |     await checkoutBtn.click();
  63 |     
  64 |     await page.waitForURL('**/login**', { timeout: 5000 });
  65 |     expect(page.url()).toContain('/login');
  66 |   });
  67 | 
  68 |   test('total price displays correctly for injected items', async ({ page }) => {
  69 |     await gotoCartWithItems(page);
  70 |     
  71 |     // 2 * 250 + 1 * 150 = 650
> 72 |     await expect(page.locator('text=₹650')).toBeVisible({ timeout: 5000 });
     |                                             ^ Error: expect(locator).toBeVisible() failed
  73 |   });
  74 | });
  75 | 
```