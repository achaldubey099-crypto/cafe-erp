import { expect, test } from '@playwright/test';

import {
  ADMIN_ORDERS,
  ANALYTICS_FIXTURE,
  MENU_PRODUCTS,
  STAFF_MEMBERS,
  clearStorage,
  mockAdminLogin,
  mockAdminPageApis,
  seedAdmin,
  seedCustomer,
} from './helpers/ui-fixtures';

async function openAdmin(
  page: Parameters<typeof test>[0]['page'],
  path = '/admin'
) {
  await clearStorage(page);
  await seedAdmin(page);
  await mockAdminPageApis(page);
  await page.goto(path);
}

const adminProtectedPaths = [
  '/admin',
  '/admin/orders',
  '/admin/pos',
  '/admin/inventory',
  '/admin/staff',
  '/admin/analytics',
  '/admin/settings',
] as const;

const sidebarLabels = ['Dashboard', 'POS', 'Orders', 'Inventory', 'Staff', 'Analytics', 'Settings', 'Logout'] as const;
const orderFilters = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'] as const;
const settingsTabs = ['General', 'Notifications', 'Security', 'Localization', 'Appearance'] as const;
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

test.describe('Admin Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  for (const path of adminProtectedPaths) {
    test(`guest is redirected away from ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login/);
    });
  }

  test('customer session cannot access admin', async ({ page }) => {
    await clearStorage(page);
    await seedCustomer(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('admin login heading is visible', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();
  });

  test('admin login email field is visible', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByPlaceholder('Email')).toBeVisible();
  });

  test('admin login password field is visible', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('admin login button is visible', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('admin login submits and routes to dashboard', async ({ page }) => {
    await clearStorage(page);
    await mockAdminLogin(page);
    await mockAdminPageApis(page);
    await page.goto('/admin/login');
    await page.getByPlaceholder('Email').fill('admin@artisan.coffee');
    await page.getByPlaceholder('Password').fill('secret123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('dashboard heading is visible for admin', async ({ page }) => {
    await openAdmin(page, '/admin');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  for (const label of sidebarLabels) {
    test(`sidebar shows ${label}`, async ({ page }) => {
      await openAdmin(page, '/admin');
      const target =
        label === 'Logout'
          ? page.getByRole('button', { name: label })
          : page.getByRole('link', { name: label });
      await expect(target).toBeVisible();
    });
  }

  test('admin top search is visible', async ({ page }) => {
    await openAdmin(page, '/admin');
    await expect(page.getByPlaceholder('Search everything...')).toBeVisible();
  });

  test('dashboard shows todays sales card', async ({ page }) => {
    await openAdmin(page, '/admin');
    await expect(page.getByText("Today's Sales")).toBeVisible();
  });

  test('dashboard shows total orders card', async ({ page }) => {
    await openAdmin(page, '/admin');
    await expect(page.getByText('Total Orders')).toBeVisible();
  });

  test('dashboard shows net profit card', async ({ page }) => {
    await openAdmin(page, '/admin');
    await expect(page.getByText(/Net Profit/)).toBeVisible();
  });

  test('dashboard shows weekly sales performance block', async ({ page }) => {
    await openAdmin(page, '/admin');
    await expect(page.getByText('Weekly Sales Performance')).toBeVisible();
  });

  test('dashboard shows top sellers block', async ({ page }) => {
    await openAdmin(page, '/admin');
    await expect(page.getByText('Top Sellers')).toBeVisible();
  });

  test('dashboard shows recent orders block', async ({ page }) => {
    await openAdmin(page, '/admin');
    await expect(page.getByText('Recent Orders')).toBeVisible();
  });

  test('dashboard shows mocked top seller item', async ({ page }) => {
    await openAdmin(page, '/admin');
    await expect(page.getByRole('heading', { name: 'Top Sellers' }).locator('xpath=ancestor::div[1]').getByText('Red Velvet Latte').first()).toBeVisible();
  });

  test('dashboard shows mocked todays sales value', async ({ page }) => {
    await openAdmin(page, '/admin');
    await expect(page.getByText(`₹${ANALYTICS_FIXTURE.todaysSales.toFixed(2)}`)).toBeVisible();
  });

  test('dashboard shows mocked order count value', async ({ page }) => {
    await openAdmin(page, '/admin');
    await expect(page.getByText(String(ANALYTICS_FIXTURE.totalOrders))).toBeVisible();
  });

  test('orders page heading is visible', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await expect(page.getByRole('heading', { name: 'Order Management' })).toBeVisible();
  });

  test('orders page search input is visible', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await expect(page.getByPlaceholder('Search by order, table, item...')).toBeVisible();
  });

  test('orders page export button is visible', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await expect(page.getByRole('button', { name: /Export/ })).toBeVisible();
  });

  test('orders page refresh feed button is visible', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await expect(page.getByRole('button', { name: 'Refresh Feed' })).toBeVisible();
  });

  for (const filter of orderFilters) {
    test(`orders page shows ${filter} filter`, async ({ page }) => {
      await openAdmin(page, '/admin/orders');
      await expect(page.getByRole('button', { name: filter })).toBeVisible();
    });
  }

  test('orders table shows pending order table number', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await expect(page.getByText('Table 3')).toBeVisible();
  });

  test('orders table shows preparing order table number', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await expect(page.getByText('Table 5').first()).toBeVisible();
  });

  test('orders table shows completed order total', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await expect(page.getByText('₹275.00')).toBeVisible();
  });

  test('orders search can find burger order', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await page.getByPlaceholder('Search by order, table, item...').fill('burger');
    await expect(page.getByText('Burger x1')).toBeVisible();
  });

  test('orders search can find by table', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await page.getByPlaceholder('Search by order, table, item...').fill('table 3');
    await expect(page.getByText('Table 3')).toBeVisible();
  });

  test('orders completed filter shows completed row', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await page.getByRole('button', { name: 'Completed' }).click();
    await expect(page.getByText('₹275.00')).toBeVisible();
  });

  test('orders cancelled filter shows cancelled row', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await page.getByRole('button', { name: 'Cancelled' }).click();
    await expect(page.getByText('₹160.00')).toBeVisible();
  });

  test('orders pending row has status select', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('orders completed row is locked', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    await expect(page.getByText('Locked').first()).toBeVisible();
  });

  test('pos page heading is visible', async ({ page }) => {
    await openAdmin(page, '/admin/pos');
    await expect(page.getByRole('heading', { name: 'POS Tables' })).toBeVisible();
  });

  test('pos page refresh button is visible', async ({ page }) => {
    await openAdmin(page, '/admin/pos');
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
  });

  test('pos page lists table 3', async ({ page }) => {
    await openAdmin(page, '/admin/pos');
    await expect(page.getByRole('button', { name: /Table 3/ })).toBeVisible();
  });

  test('pos page lists table 5', async ({ page }) => {
    await openAdmin(page, '/admin/pos');
    await expect(page.getByRole('button', { name: /Table 5/ })).toBeVisible();
  });

  test('pos page hides completed-only table 7', async ({ page }) => {
    await openAdmin(page, '/admin/pos');
    await expect(page.getByText('Table 7')).toHaveCount(0);
  });

  test('pos page shows selected table orders title', async ({ page }) => {
    await openAdmin(page, '/admin/pos');
    await expect(page.getByRole('heading', { name: 'Table 3 Orders' })).toBeVisible();
  });

  test('pos page shows active count', async ({ page }) => {
    await openAdmin(page, '/admin/pos');
    await expect(page.getByText('1 Active')).toBeVisible();
  });

  test('pos page shows complete button', async ({ page }) => {
    await openAdmin(page, '/admin/pos');
    await expect(page.getByRole('button', { name: 'Complete' })).toBeVisible();
  });

  test('pos page shows cancel button', async ({ page }) => {
    await openAdmin(page, '/admin/pos');
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('pos page can switch to table 5 orders', async ({ page }) => {
    await openAdmin(page, '/admin/pos');
    await page.getByRole('button', { name: /Table 5/ }).click();
    await expect(page.getByRole('heading', { name: 'Table 5 Orders' })).toBeVisible();
  });

  test('inventory page heading is visible', async ({ page }) => {
    await openAdmin(page, '/admin/inventory');
    await expect(page.getByRole('heading', { name: 'Inventory Management' })).toBeVisible();
  });

  test('inventory shows add new item button', async ({ page }) => {
    await openAdmin(page, '/admin/inventory');
    await expect(page.getByRole('button', { name: 'Add New Item' })).toBeVisible();
  });

  test('inventory shows menu items stat', async ({ page }) => {
    await openAdmin(page, '/admin/inventory');
    await expect(page.getByText('Menu Items')).toBeVisible();
  });

  test('inventory renders burger item row', async ({ page }) => {
    await openAdmin(page, '/admin/inventory');
    await expect(page.getByText('Burger')).toBeVisible();
  });

  test('inventory renders chocolate cake item row', async ({ page }) => {
    await openAdmin(page, '/admin/inventory');
    await expect(page.getByText('Chocolate Cake')).toBeVisible();
  });

  test('inventory modal opens', async ({ page }) => {
    await openAdmin(page, '/admin/inventory');
    await page.getByRole('button', { name: 'Add New Item' }).click();
    await expect(page.getByRole('heading', { name: 'Add New Item' })).toBeVisible();
  });

  test('inventory modal shows file input', async ({ page }) => {
    await openAdmin(page, '/admin/inventory');
    await page.getByRole('button', { name: 'Add New Item' }).click();
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('inventory modal can save a new item', async ({ page }) => {
    await openAdmin(page, '/admin/inventory');
    await page.getByRole('button', { name: 'Add New Item' }).click();
    await page.getByPlaceholder('e.g. Iced Latte').fill('Playwright Special');
    await page.getByPlaceholder('e.g. 180').fill('199');
    await page.getByRole('button', { name: 'Save Item' }).click();
    await expect(page.getByText('Playwright Special')).toBeVisible();
  });

  test('staff page heading is visible', async ({ page }) => {
    await openAdmin(page, '/admin/staff');
    await expect(page.getByRole('heading', { name: 'Staff Management' })).toBeVisible();
  });

  test('staff page add button is visible', async ({ page }) => {
    await openAdmin(page, '/admin/staff');
    await expect(page.getByRole('button', { name: 'Add New Staff' })).toBeVisible();
  });

  for (const member of STAFF_MEMBERS) {
    test(`staff page renders ${member.name}`, async ({ page }) => {
      await openAdmin(page, '/admin/staff');
      await expect(page.getByText(member.name)).toBeVisible();
    });
  }

  test('staff page create modal opens', async ({ page }) => {
    await openAdmin(page, '/admin/staff');
    await page.getByRole('button', { name: 'Add New Staff' }).click();
    await expect(page.getByRole('heading', { name: 'Add New Staff' })).toBeVisible();
  });

  test('staff page edit modal opens', async ({ page }) => {
    await openAdmin(page, '/admin/staff');
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page.getByRole('heading', { name: 'Edit Staff' })).toBeVisible();
  });

  test('staff page can create a staff member', async ({ page }) => {
    await openAdmin(page, '/admin/staff');
    await page.getByRole('button', { name: 'Add New Staff' }).click();
    await page.getByPlaceholder('e.g. Sarah Connor').fill('New Hire');
    await page.getByPlaceholder('e.g. sarah@artisan.coffee').fill('new@artisan.coffee');
    await page.getByRole('button', { name: 'Create Profile' }).click();
    await expect(page.getByText('New Hire')).toBeVisible();
  });

  test('analytics page heading is visible', async ({ page }) => {
    await openAdmin(page, '/admin/analytics');
    await expect(page.getByRole('heading', { name: 'Business Analytics' })).toBeVisible();
  });

  test('analytics page shows todays sales summary', async ({ page }) => {
    await openAdmin(page, '/admin/analytics');
    await expect(page.getByText("Today's Sales")).toBeVisible();
  });

  test('analytics page shows total revenue summary', async ({ page }) => {
    await openAdmin(page, '/admin/analytics');
    await expect(page.getByText('Total Revenue').first()).toBeVisible();
  });

  test('analytics page shows net profit card', async ({ page }) => {
    await openAdmin(page, '/admin/analytics');
    await expect(page.getByText('Month Net Profit')).toBeVisible();
  });

  test('analytics page shows best seller insight', async ({ page }) => {
    await openAdmin(page, '/admin/analytics');
    await expect(page.getByText('Best Seller')).toBeVisible();
  });

  test('analytics page shows retention insight', async ({ page }) => {
    await openAdmin(page, '/admin/analytics');
    await expect(page.getByText('Retention')).toBeVisible();
  });

  test('analytics page shows smart advice copy', async ({ page }) => {
    await openAdmin(page, '/admin/analytics');
    await expect(page.getByText(ANALYTICS_FIXTURE.advice)).toBeVisible();
  });

  for (const day of dayLabels) {
    test(`analytics page shows ${day} label`, async ({ page }) => {
      await openAdmin(page, '/admin/analytics');
      await expect(page.getByText(new RegExp(`^${day}$`))).toBeVisible();
    });
  }

  test('settings page heading is visible', async ({ page }) => {
    await openAdmin(page, '/admin/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  for (const tab of settingsTabs) {
    test(`settings page shows ${tab} tab`, async ({ page }) => {
      await openAdmin(page, '/admin/settings');
      await expect(page.getByRole('button', { name: tab })).toBeVisible();
    });
  }

  test('settings page shows store name input', async ({ page }) => {
    await openAdmin(page, '/admin/settings');
    await expect(page.locator('label:has-text("Store Name") + input')).toHaveValue('Artisan Coffee House');
  });

  test('settings page shows store email input', async ({ page }) => {
    await openAdmin(page, '/admin/settings');
    await expect(page.locator('label:has-text("Store Email") + input')).toHaveValue('hello@artisan.coffee');
  });

  test('settings page shows save changes button', async ({ page }) => {
    await openAdmin(page, '/admin/settings');
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
  });

  test('settings page shows danger zone block', async ({ page }) => {
    await openAdmin(page, '/admin/settings');
    await expect(page.getByText('Danger Zone')).toBeVisible();
  });

  test('sidebar logout returns to admin login', async ({ page }) => {
    await openAdmin(page, '/admin');
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('inventory page lists the featured menu item', async ({ page }) => {
    await openAdmin(page, '/admin/inventory');
    await expect(page.getByText(MENU_PRODUCTS.find((item) => item.isFeatured)?.name || '')).toBeVisible();
  });

  test('orders page renders all mocked statuses somewhere in the table', async ({ page }) => {
    await openAdmin(page, '/admin/orders');
    for (const order of ADMIN_ORDERS) {
      await expect(page.getByText(order.status.charAt(0).toUpperCase() + order.status.slice(1)).first()).toBeVisible();
    }
  });
});
