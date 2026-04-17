import { expect, test, type Page } from '@playwright/test';

import { clearStorage, seedAdmin } from './helpers/ui-fixtures';

const TABLES = Array.from({ length: 8 }, (_, index) => ({
  publicTableId: `table_public_${index + 1}`,
  slug: `table-${index + 1}`,
  accessKey: `table_access_${index + 1}`,
  label: `Table ${index + 1}`,
  tableNumber: index + 1,
}));

const RESTAURANT_RESPONSE = {
  brandName: 'Fuel Headquarters',
  slug: 'fuel-headquarters',
  accessKey: 'rest_access_fuel_headquarters',
  logoUrl: '',
  description: 'Protected QR ordering for Fuel Headquarters',
  publicRestaurantId: 'rest_fuel_headquarters',
  tables: TABLES,
};

async function installClipboardMock(page: Page) {
  await page.addInitScript(() => {
    const store = {
      copied: '',
    };

    Object.defineProperty(window, '__copiedText', {
      get() {
        return store.copied;
      },
      set(value) {
        store.copied = String(value || '');
      },
      configurable: true,
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText(text: string) {
          (window as typeof window & { __copiedText?: string }).__copiedText = text;
          return Promise.resolve();
        },
      },
      configurable: true,
    });
  });
}

async function mockRestaurantSettingsApis(page: Page, response = RESTAURANT_RESPONSE) {
  await page.route('**/api/admin/restaurant/me', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Restaurant branding updated successfully',
          restaurant: response,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

async function openSettings(page: Page, response = RESTAURANT_RESPONSE) {
  await clearStorage(page);
  await seedAdmin(page);
  await installClipboardMock(page);
  await mockRestaurantSettingsApis(page, response);
  await page.goto('/admin/settings');
}

test.describe('Admin Settings Protected Links', () => {
  for (const table of TABLES) {
    test(`table card ${table.tableNumber} shows the protected access link`, async ({ page }) => {
      await openSettings(page);
      const origin = new URL(page.url()).origin;
      await expect(
        page.getByText(`${origin}/access/${table.accessKey}`, { exact: true })
      ).toBeVisible();
    });
  }

  for (const table of TABLES) {
    test(`copy-all textarea includes table ${table.tableNumber} protected link`, async ({ page }) => {
      await openSettings(page);
      await expect(page.locator('textarea').last()).toHaveValue(new RegExp(table.accessKey));
    });
  }

  test('settings page uses the protected-link wording', async ({ page }) => {
    await openSettings(page);
    await expect(page.getByText('protected public table links used by the QR flow')).toBeVisible();
  });

  test('cafe public url uses the restaurant access key', async ({ page }) => {
    await openSettings(page);
    await expect(page.getByText('/access/restaurant/rest_access_fuel_headquarters')).toBeVisible();
  });

  test('copy cafe url button writes the protected cafe url', async ({ page }) => {
    await openSettings(page);
    await page.getByRole('button', { name: 'Copy Cafe URL' }).click();
    await expect(page.getByText('Public URL copied.')).toBeVisible();
  });

  test('open cafe url anchor points at the protected cafe link', async ({ page }) => {
    await openSettings(page);
    await expect(page.getByRole('link', { name: 'Open Cafe URL' })).toHaveAttribute(
      'href',
      /\/access\/restaurant\/rest_access_fuel_headquarters$/
    );
  });

  test('copy all urls button shows a success message', async ({ page }) => {
    await openSettings(page);
    await page.getByRole('button', { name: 'Copy All URLs' }).click();
    await expect(page.getByText('Public URL copied.')).toBeVisible();
  });

  test('brand name input is populated from the protected settings payload', async ({ page }) => {
    await openSettings(page);
    await expect(page.locator('input[type="text"]').nth(1)).toHaveValue('Fuel Headquarters');
  });

  test('restaurant image upload field is visible', async ({ page }) => {
    await openSettings(page);
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('save branding sends a patch request and shows success', async ({ page }) => {
    let patchCalls = 0;
    await clearStorage(page);
    await seedAdmin(page);
    await installClipboardMock(page);
    await page.route('**/api/admin/restaurant/me', async (route) => {
      if (route.request().method() === 'PATCH') {
        patchCalls += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Restaurant branding updated successfully',
            restaurant: {
              ...RESTAURANT_RESPONSE,
              brandName: 'Fuel HQ Updated',
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(RESTAURANT_RESPONSE),
      });
    });

    await page.goto('/admin/settings');
    await page.locator('input[type="text"]').nth(1).fill('Fuel HQ Updated');
    await page.getByRole('button', { name: 'Save Branding' }).click();
    await expect(page.getByText('Restaurant branding saved.')).toBeVisible();
    expect(patchCalls).toBe(1);
  });

  test('empty table state renders when no protected table urls exist', async ({ page }) => {
    await openSettings(page, { ...RESTAURANT_RESPONSE, tables: [] });
    await expect(page.getByText('No active tables found for this restaurant yet.')).toBeVisible();
  });
});
