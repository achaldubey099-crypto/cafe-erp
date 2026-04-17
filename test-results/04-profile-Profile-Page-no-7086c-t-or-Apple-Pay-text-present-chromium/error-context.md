# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-profile.spec.ts >> Profile Page >> no "Default Payment" or "Apple Pay" text present
- Location: tests/04-profile.spec.ts:20:7

# Error details

```
Error: page.goto: Test ended.
Call log:
  - navigating to "http://localhost:3000/profile", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { injectFakeCustomerSession, clearAllSessions } from './helpers/auth';
  3  | 
  4  | test.describe('Profile Page', () => {
  5  |   test('profile page loads for guest', async ({ page }) => {
  6  |     await clearAllSessions(page);
  7  |     await page.goto('/profile');
  8  |     
  9  |     await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 5000 });
  10 |   });
  11 | 
  12 |   test('guest sees login button on profile', async ({ page }) => {
  13 |     await clearAllSessions(page);
  14 |     await page.goto('/profile');
  15 |     
  16 |     const loginBtn = page.locator('button', { hasText: 'Login' });
  17 |     await expect(loginBtn.first()).toBeVisible({ timeout: 5000 });
  18 |   });
  19 | 
  20 |   test('no "Default Payment" or "Apple Pay" text present', async ({ page }) => {
  21 |     await injectFakeCustomerSession(page);
> 22 |     await page.goto('/profile');
     |                ^ Error: page.goto: Test ended.
  23 |     
  24 |     await page.waitForTimeout(1000);
  25 |     
  26 |     // Verify the removed payment method is NOT shown
  27 |     const defaultPayment = page.locator('text=Default Payment');
  28 |     await expect(defaultPayment).toHaveCount(0);
  29 |     
  30 |     const applePay = page.locator('text=Apple Pay');
  31 |     await expect(applePay).toHaveCount(0);
  32 |   });
  33 | 
  34 |   test('Account Settings section exists', async ({ page }) => {
  35 |     await injectFakeCustomerSession(page);
  36 |     await page.goto('/profile');
  37 |     
  38 |     await expect(page.locator('text=Account Settings')).toBeVisible({ timeout: 5000 });
  39 |   });
  40 | 
  41 |   test('loyalty card section displays', async ({ page }) => {
  42 |     await injectFakeCustomerSession(page);
  43 |     await page.goto('/profile');
  44 |     
  45 |     await expect(page.locator('text=Current Balance')).toBeVisible({ timeout: 5000 });
  46 |     await expect(page.locator('text=/Points Earned/')).toBeVisible();
  47 |   });
  48 | });
  49 | 
```