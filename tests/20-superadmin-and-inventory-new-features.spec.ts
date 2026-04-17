import { expect, test, type Page } from '@playwright/test';

import { MENU_PRODUCTS, clearStorage, seedAdmin } from './helpers/ui-fixtures';

const ADMIN_ROWS = [
  {
    _id: 'admin-1',
    name: 'Nina Verma',
    email: 'nina@fuelhq.com',
    role: 'admin',
    status: 'active',
    cafeId: 'cafe-1',
    cafeName: 'Fuel HQ',
    restaurantName: 'Fuel Headquarters',
    authProvider: 'local',
    createdAt: '2026-04-10T00:00:00.000Z',
  },
  {
    _id: 'owner-1',
    name: 'Rohit Singh',
    email: 'rohit@demo.com',
    role: 'owner',
    status: 'suspended',
    cafeId: 'cafe-2',
    cafeName: 'Demo Cafe',
    restaurantName: 'Demo Cafe',
    authProvider: 'local',
    createdAt: '2026-04-11T00:00:00.000Z',
  },
] as const;

const CAFES = [
  { _id: 'cafe-1', name: 'Fuel HQ', ownerName: 'Nina', email: 'nina@fuelhq.com' },
  { _id: 'cafe-2', name: 'Demo Cafe', ownerName: 'Rohit', email: 'rohit@demo.com' },
];

const RESTAURANTS = [
  {
    _id: 'rest-1',
    brandName: 'Fuel Headquarters',
    slug: 'fuel-headquarters',
    accessKey: 'rest_access_fuel_headquarters',
    publicRestaurantId: 'rest_fuel_hq',
    logoUrl: '',
    owner: { _id: 'owner-1', name: 'Nina Verma', email: 'nina@fuelhq.com', status: 'active' as const },
  },
  {
    _id: 'rest-2',
    brandName: 'Demo Cafe',
    slug: 'demo-cafe',
    accessKey: 'rest_access_demo_cafe',
    publicRestaurantId: 'rest_demo',
    logoUrl: '',
    owner: { _id: 'owner-2', name: 'Rohit Singh', email: 'rohit@demo.com', status: 'suspended' as const },
  },
];

async function seedSuperadmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'playwright-superadmin-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        _id: 'superadmin-1',
        name: 'Cafes Platform Superadmin',
        email: 'superadmin@cafes.local',
        role: 'superadmin',
      })
    );
  });
}

async function mockSuperadminApis(page: Page) {
  await page.route('**/api/superadmin/admins', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Admin created successfully' }),
      });
      return;
    }

    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Admin account deleted successfully' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        admins: ADMIN_ROWS,
        summary: {
          total: ADMIN_ROWS.length,
          admins: ADMIN_ROWS.filter((entry) => entry.role === 'admin').length,
          owners: ADMIN_ROWS.filter((entry) => entry.role === 'owner').length,
          cafes: CAFES.length,
        },
      }),
    });
  });

  await page.route('**/api/superadmin/cafes', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(CAFES),
    });
  });

  await page.route('**/api/superadmin/restaurants/*/owner/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Owner credentials updated' }),
    });
  });

  await page.route('**/api/superadmin/restaurants/*/owner', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Owner credentials deleted', restaurant: null }),
    });
  });

  await page.route('**/api/superadmin/restaurants', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Cafe and owner credentials created successfully.' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(RESTAURANTS),
    });
  });
}

async function mockInventoryApis(page: Page) {
  await page.route('**/api/menu/bulk-upload', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Menu uploaded successfully', count: 2 }),
    });
  });

  await page.route('**/api/menu/*', async (route) => {
    const method = route.request().method();
    if (method === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Menu item updated successfully',
          item: { ...MENU_PRODUCTS[0], name: 'Updated Latte' },
        }),
      });
      return;
    }

    if (method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Menu item deleted successfully' }),
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/api/menu', async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Menu item created successfully',
          item: { ...MENU_PRODUCTS[0], _id: 'created-item', name: 'Created Latte' },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MENU_PRODUCTS),
    });
  });
}

test.describe('Superadmin And Inventory New Features', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('superadmin access page heading is visible', async ({ page }) => {
    await seedSuperadmin(page);
    await mockSuperadminApis(page);
    await page.goto('/superadmin/access');
    await expect(page.getByRole('heading', { name: 'Admin Access Monitor' })).toBeVisible();
  });

  test('superadmin access table shows a delete action for admin rows', async ({ page }) => {
    await seedSuperadmin(page);
    await mockSuperadminApis(page);
    await page.goto('/superadmin/access');
    await expect(page.getByRole('button', { name: 'Delete admin Nina Verma' })).toBeVisible();
  });

  for (const label of ['Total Admin Accounts', 'Admin Logins', 'Owner Logins', 'Cafes Covered'] as const) {
    test(`superadmin summary card ${label} is visible`, async ({ page }) => {
      await seedSuperadmin(page);
      await mockSuperadminApis(page);
      await page.goto('/superadmin/access');
      await expect(page.getByText(label)).toBeVisible();
    });
  }

  test('superadmin access table shows the admin account row', async ({ page }) => {
    await seedSuperadmin(page);
    await mockSuperadminApis(page);
    await page.goto('/superadmin/access');
    await expect(page.getByText('Nina Verma')).toBeVisible();
  });

  test('superadmin access table shows the owner account row', async ({ page }) => {
    await seedSuperadmin(page);
    await mockSuperadminApis(page);
    await page.goto('/superadmin/access');
    await expect(page.getByText('Rohit Singh')).toBeVisible();
  });

  test('superadmin access form defaults the password to admin123', async ({ page }) => {
    await seedSuperadmin(page);
    await mockSuperadminApis(page);
    await page.goto('/superadmin/access');
    await expect(page.getByPlaceholder('admin123')).toHaveValue('admin123');
  });

  test('deleting an admin account calls the delete endpoint', async ({ page }) => {
    let deleteCalls = 0;
    await seedSuperadmin(page);
    await page.addInitScript(() => {
      window.confirm = () => true;
    });
    await page.route('**/api/superadmin/admins', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          admins: ADMIN_ROWS,
          summary: { total: 2, admins: 1, owners: 1, cafes: 2 },
        }),
      });
    });
    await page.route('**/api/superadmin/admins/*', async (route) => {
      deleteCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Admin account deleted successfully' }),
      });
    });
    await page.route('**/api/superadmin/cafes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CAFES),
      });
    });
    await page.goto('/superadmin/access');
    await page.getByRole('button', { name: 'Delete admin Nina Verma' }).click();
    expect(deleteCalls).toBe(1);
  });

  test('creating an admin account posts the admin role', async ({ page }) => {
    let payload: Record<string, unknown> | null = null;
    await seedSuperadmin(page);
    await page.route('**/api/superadmin/admins', async (route) => {
      if (route.request().method() === 'POST') {
        payload = route.request().postDataJSON?.() || null;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Admin created successfully' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          admins: ADMIN_ROWS,
          summary: { total: 2, admins: 1, owners: 1, cafes: 2 },
        }),
      });
    });
    await page.route('**/api/superadmin/cafes', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CAFES) });
    });
    await page.goto('/superadmin/access');
    await page.getByPlaceholder('e.g. Nina Verma').fill('Aarav Kapoor');
    await page.getByPlaceholder('e.g. admin@yourcafe.com').fill('aarav@fuelhq.com');
    await page.getByRole('button', { name: 'Create Admin Login' }).click();
    await expect.poll(() => payload?.role).toBe('admin');
  });

  test('creating an owner account posts the owner role', async ({ page }) => {
    let payload: Record<string, unknown> | null = null;
    await seedSuperadmin(page);
    await page.route('**/api/superadmin/admins', async (route) => {
      if (route.request().method() === 'POST') {
        payload = route.request().postDataJSON?.() || null;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Admin created successfully' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          admins: ADMIN_ROWS,
          summary: { total: 2, admins: 1, owners: 1, cafes: 2 },
        }),
      });
    });
    await page.route('**/api/superadmin/cafes', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CAFES) });
    });
    await page.goto('/superadmin/access');
    await page.locator('select').first().selectOption('owner');
    await page.getByPlaceholder('e.g. Nina Verma').fill('Owner Two');
    await page.getByPlaceholder('e.g. admin@yourcafe.com').fill('owner2@fuelhq.com');
    await page.getByRole('button', { name: 'Create Owner Login' }).click();
    await expect.poll(() => payload?.role).toBe('owner');
  });

  test('creating admin credentials shows a success banner', async ({ page }) => {
    await seedSuperadmin(page);
    await mockSuperadminApis(page);
    await page.goto('/superadmin/access');
    await page.getByPlaceholder('e.g. Nina Verma').fill('Aarav Kapoor');
    await page.getByPlaceholder('e.g. admin@yourcafe.com').fill('aarav@fuelhq.com');
    await page.getByRole('button', { name: 'Create Admin Login' }).click();
    await expect(page.getByText(/Admin created successfully/i)).toBeVisible();
  });

  test('restaurants page shows the protected public cafe url', async ({ page }) => {
    await seedSuperadmin(page);
    await mockSuperadminApis(page);
    await page.goto('/superadmin/restaurants');
    await expect(page.getByText('/access/restaurant/rest_access_fuel_headquarters')).toBeVisible();
  });

  test('suspending an owner sends the suspended status payload', async ({ page }) => {
    let payload: Record<string, unknown> | null = null;
    await seedSuperadmin(page);
    await page.route('**/api/superadmin/restaurants/*/owner/status', async (route) => {
      payload = route.request().postDataJSON?.() || null;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'updated' }) });
    });
    await page.route('**/api/superadmin/restaurants', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RESTAURANTS) });
    });
    await page.goto('/superadmin/restaurants');
    await page.getByRole('button', { name: 'Suspend Owner' }).first().click();
    await expect.poll(() => payload?.status).toBe('suspended');
  });

  test('reactivating an owner sends the active status payload', async ({ page }) => {
    let payload: Record<string, unknown> | null = null;
    await seedSuperadmin(page);
    await page.route('**/api/superadmin/restaurants/*/owner/status', async (route) => {
      payload = route.request().postDataJSON?.() || null;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'updated' }) });
    });
    await page.route('**/api/superadmin/restaurants', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          RESTAURANTS[1],
          { ...RESTAURANTS[0], owner: { ...RESTAURANTS[0].owner, status: 'suspended' } },
        ]),
      });
    });
    await page.goto('/superadmin/restaurants');
    await page.getByRole('button', { name: 'Reactivate Owner' }).first().click();
    await expect.poll(() => payload?.status).toBe('active');
  });

  test('deleting an owner calls the delete endpoint', async ({ page }) => {
    let deleteCalls = 0;
    await seedSuperadmin(page);
    await page.addInitScript(() => {
      window.confirm = () => true;
    });
    await page.route('**/api/superadmin/restaurants/*/owner', async (route) => {
      deleteCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Owner credentials deleted', restaurant: null }),
      });
    });
    await page.route('**/api/superadmin/restaurants', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RESTAURANTS) });
    });
    await page.goto('/superadmin/restaurants');
    await page.getByRole('button', { name: 'Delete Owner' }).first().click();
    expect(deleteCalls).toBe(1);
  });

  test('creating a new cafe posts the numeric table count', async ({ page }) => {
    let payload: Record<string, unknown> | null = null;
    await seedSuperadmin(page);
    await page.route('**/api/superadmin/restaurants', async (route) => {
      if (route.request().method() === 'POST') {
        payload = route.request().postDataJSON?.() || null;
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ message: 'created' }) });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RESTAURANTS) });
    });
    await page.goto('/superadmin/restaurants');
    await page.getByPlaceholder('Cafe brand name').fill('Third Wave');
    await page.getByPlaceholder('Owner name').fill('Owner Name');
    await page.getByPlaceholder('Owner email').fill('owner@thirdwave.com');
    await page.getByPlaceholder('Owner password').fill('admin123');
    await page.getByPlaceholder('Table count').fill('12');
    await page.getByRole('button', { name: 'Create Cafe + Owner' }).click();
    await expect.poll(() => payload?.tableCount).toBe(12);
  });

  test('creating a new cafe shows a success banner', async ({ page }) => {
    await seedSuperadmin(page);
    await mockSuperadminApis(page);
    await page.goto('/superadmin/restaurants');
    await page.getByPlaceholder('Cafe brand name').fill('Third Wave');
    await page.getByPlaceholder('Owner name').fill('Owner Name');
    await page.getByPlaceholder('Owner email').fill('owner@thirdwave.com');
    await page.getByPlaceholder('Owner password').fill('admin123');
    await page.getByPlaceholder('Table count').fill('12');
    await page.getByRole('button', { name: 'Create Cafe + Owner' }).click();
    await expect(page.getByText(/created successfully/i)).toBeVisible();
  });

  test('inventory page shows the add new item control', async ({ page }) => {
    await clearStorage(page);
    await seedAdmin(page);
    await mockInventoryApis(page);
    await page.goto('/admin/inventory');
    await expect(page.getByRole('button', { name: 'Add New Item' })).toBeVisible();
  });

  test('inventory row shows one edit icon action', async ({ page }) => {
    await clearStorage(page);
    await seedAdmin(page);
    await mockInventoryApis(page);
    await page.goto('/admin/inventory');
    await expect(page.getByLabel(`Edit ${MENU_PRODUCTS[0].name}`)).toBeVisible();
  });

  test('inventory row shows one delete icon action', async ({ page }) => {
    await clearStorage(page);
    await seedAdmin(page);
    await mockInventoryApis(page);
    await page.goto('/admin/inventory');
    await expect(page.getByLabel(`Delete ${MENU_PRODUCTS[0].name}`)).toBeVisible();
  });

  test('inventory delete action calls the delete endpoint', async ({ page }) => {
    let deleteCalls = 0;
    await clearStorage(page);
    await seedAdmin(page);
    await page.addInitScript(() => {
      window.confirm = () => true;
    });
    await page.route('**/api/menu/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalls += 1;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'deleted' }) });
        return;
      }
      await route.continue();
    });
    await page.route('**/api/menu', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MENU_PRODUCTS) });
    });
    await page.goto('/admin/inventory');
    await page.getByLabel(`Delete ${MENU_PRODUCTS[0].name}`).click();
    expect(deleteCalls).toBe(1);
  });

  test('inventory csv uploader shows the image_url helper text', async ({ page }) => {
    await clearStorage(page);
    await seedAdmin(page);
    await mockInventoryApis(page);
    await page.goto('/admin/inventory');
    await expect(page.getByText('`name`, `price`, `category`, `image`, `imageUrl`, or `image_url`, optional `isFeatured`')).toBeVisible();
  });

  test('inventory csv upload posts the bulk import request', async ({ page }) => {
    let uploadCalls = 0;
    await clearStorage(page);
    await seedAdmin(page);
    await page.route('**/api/menu/bulk-upload', async (route) => {
      uploadCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Menu uploaded successfully', count: 2 }),
      });
    });
    await page.route('**/api/menu', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MENU_PRODUCTS),
      });
    });
    await page.goto('/admin/inventory', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Import CSV to Cafe' })).toBeVisible();
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'menu.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,price,category\nLatte,100,Coffee'),
    });
    await page.getByRole('button', { name: 'Import CSV to Cafe' }).click();
    await expect.poll(() => uploadCalls).toBe(1);
  });

  test('inventory create modal posts a new menu item', async ({ page }) => {
    let createCalls = 0;
    await clearStorage(page);
    await seedAdmin(page);
    await page.route('**/api/menu', async (route) => {
      if (route.request().method() === 'POST') {
        createCalls += 1;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ item: { ...MENU_PRODUCTS[0], _id: 'created-item', name: 'Created Latte' } }),
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MENU_PRODUCTS) });
    });
    await page.goto('/admin/inventory');
    await page.getByRole('button', { name: 'Add New Item' }).click();
    await page.getByPlaceholder('e.g. Iced Latte').fill('Created Latte');
    await page.getByPlaceholder('e.g. 180').fill('180');
    await page.getByRole('button', { name: 'Save Item' }).click();
    expect(createCalls).toBe(1);
  });

  test('inventory edit modal posts an update', async ({ page }) => {
    let updateCalls = 0;
    await clearStorage(page);
    await seedAdmin(page);
    await page.route('**/api/menu/*', async (route) => {
      if (route.request().method() === 'PUT') {
        updateCalls += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ item: { ...MENU_PRODUCTS[0], name: 'Updated Latte' } }),
        });
        return;
      }
      await route.continue();
    });
    await page.route('**/api/menu', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MENU_PRODUCTS) });
    });
    await page.goto('/admin/inventory');
    await page.getByLabel(`Edit ${MENU_PRODUCTS[0].name}`).click();
    await page.getByPlaceholder('e.g. Iced Latte').fill('Updated Latte');
    await page.getByRole('button', { name: 'Update Item' }).click();
    expect(updateCalls).toBe(1);
  });
});
