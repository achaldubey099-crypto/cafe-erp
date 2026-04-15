import { expect, test, type Page } from '@playwright/test';

import {
  ADMIN_ORDERS,
  MENU_PRODUCTS,
  clearStorage,
  mockAdminOrders,
  mockMenu,
  mockOrders,
  mockStaff,
  seedAdmin,
} from './helpers/ui-fixtures';

type FinancialScope = 'month' | 'year' | 'allTime';

type AnalyticsFixture = {
  todaysSales: number;
  totalOrders: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  periodTotals: Record<FinancialScope, { revenue: number; profit: number }>;
  weeklySales: Record<string, number>;
  salesSeries7d: Array<{ label: string; value: number }>;
  salesSeries30d: Array<{ label: string; value: number }>;
  bestSellingProduct: { name: string; count: number };
  retentionRate: string | number;
  topSellingItems: Array<{ name: string; quantity: number }>;
  advice: string;
  recentOrders: Array<{
    _id: string;
    tableId?: number;
    status: string;
    grandTotal: number;
    createdAt: string;
    paymentMethod?: string;
  }>;
};

const ADMIN_ANALYTICS: AnalyticsFixture = {
  todaysSales: 9303,
  totalOrders: 11,
  totalRevenue: 10677,
  netProfit: 2135.4,
  profitMargin: 0.2,
  periodTotals: {
    month: { revenue: 7240, profit: 1448 },
    year: { revenue: 10677, profit: 2135.4 },
    allTime: { revenue: 18420, profit: 3684 },
  },
  weeklySales: {
    Mon: 580,
    Tue: 640,
    Wed: 1220,
    Thu: 890,
    Fri: 1100,
    Sat: 1800,
    Sun: 2075,
  },
  salesSeries7d: [
    { label: 'Mon', value: 580 },
    { label: 'Tue', value: 640 },
    { label: 'Wed', value: 1220 },
    { label: 'Thu', value: 890 },
    { label: 'Fri', value: 1100 },
    { label: 'Sat', value: 1800 },
    { label: 'Sun', value: 2075 },
  ],
  salesSeries30d: [
    { label: '17 Mar', value: 0 },
    { label: '18 Mar', value: 0 },
    { label: '19 Mar', value: 225 },
    { label: '20 Mar', value: 0 },
    { label: '21 Mar', value: 350 },
    { label: '22 Mar', value: 0 },
    { label: '23 Mar', value: 0 },
    { label: '24 Mar', value: 420 },
    { label: '25 Mar', value: 0 },
    { label: '26 Mar', value: 0 },
    { label: '27 Mar', value: 610 },
    { label: '28 Mar', value: 0 },
    { label: '29 Mar', value: 0 },
    { label: '30 Mar', value: 0 },
    { label: '31 Mar', value: 0 },
    { label: '1 Apr', value: 520 },
    { label: '2 Apr', value: 0 },
    { label: '3 Apr', value: 0 },
    { label: '4 Apr', value: 0 },
    { label: '5 Apr', value: 0 },
    { label: '6 Apr', value: 880 },
    { label: '7 Apr', value: 0 },
    { label: '8 Apr', value: 0 },
    { label: '9 Apr', value: 0 },
    { label: '10 Apr', value: 0 },
    { label: '11 Apr', value: 1100 },
    { label: '12 Apr', value: 0 },
    { label: '13 Apr', value: 0 },
    { label: '14 Apr', value: 0 },
    { label: '15 Apr', value: 2075 },
  ],
  bestSellingProduct: { name: 'Hummus Hustle', count: 16 },
  retentionRate: 66.7,
  topSellingItems: [
    { name: 'Hummus Hustle', quantity: 16 },
    { name: 'Burger', quantity: 11 },
    { name: 'Masala Chai', quantity: 7 },
  ],
  advice: 'Hummus Hustle is leading sales. Keep it stocked and featured on the menu.',
  recentOrders: ADMIN_ORDERS.slice(0, 5).map((order) => ({
    _id: order._id,
    tableId: order.tableId,
    status: order.status,
    grandTotal: order.grandTotal,
    createdAt: order.createdAt,
    paymentMethod: 'Counter',
  })),
};

const dashboardScopes: Array<{ scope: FinancialScope; label: string; revenue: string; profit: string }> = [
  { scope: 'month', label: 'Month', revenue: '₹7240.00', profit: '₹1448.00' },
  { scope: 'year', label: 'Year', revenue: '₹10677.00', profit: '₹2135.40' },
  { scope: 'allTime', label: 'All Time', revenue: '₹18420.00', profit: '₹3684.00' },
];

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthTickDays = ['17', '22', '27', '1', '6'];
const marginValues = [0, 10, 20, 35, 60, 75, 100];

async function json(pageRoute: any, body: unknown, status = 200) {
  await pageRoute.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockAdminAnalyticsApis(page: Page, fixture: AnalyticsFixture = ADMIN_ANALYTICS) {
  let current = JSON.parse(JSON.stringify(fixture)) as AnalyticsFixture;
  const patchPayloads: Array<{ profitMargin: number }> = [];

  await page.route('**/api/analytics/profit-margin', async (route) => {
    const payload = route.request().postDataJSON?.() || {};
    const profitMargin = Number(payload.profitMargin ?? current.profitMargin);
    patchPayloads.push({ profitMargin });

    current = {
      ...current,
      profitMargin,
      netProfit: Number((current.periodTotals.year.revenue * profitMargin).toFixed(2)),
      periodTotals: {
        month: {
          revenue: current.periodTotals.month.revenue,
          profit: Number((current.periodTotals.month.revenue * profitMargin).toFixed(2)),
        },
        year: {
          revenue: current.periodTotals.year.revenue,
          profit: Number((current.periodTotals.year.revenue * profitMargin).toFixed(2)),
        },
        allTime: {
          revenue: current.periodTotals.allTime.revenue,
          profit: Number((current.periodTotals.allTime.revenue * profitMargin).toFixed(2)),
        },
      },
    };

    await json(route, current);
  });

  await page.route('**/api/analytics', async (route) => {
    await json(route, current);
  });

  await mockStaff(page);
  await mockAdminOrders(page);
  await mockOrders(page, ADMIN_ORDERS);
  await mockMenu(page, MENU_PRODUCTS);
  await page.route('**/api/admin/**', async (route) => {
    await json(route, {});
  });

  return {
    patchPayloads,
    getCurrent: () => current,
  };
}

async function openAdminDashboard(page: Page, fixture: AnalyticsFixture = ADMIN_ANALYTICS) {
  await clearStorage(page);
  await seedAdmin(page);
  await mockAdminAnalyticsApis(page, fixture);
  await page.goto('/admin');
}

async function openAdminAnalytics(page: Page, fixture: AnalyticsFixture = ADMIN_ANALYTICS) {
  await clearStorage(page);
  await seedAdmin(page);
  const controller = await mockAdminAnalyticsApis(page, fixture);
  await page.goto('/admin/analytics');
  return controller;
}

function dashboardChartCard(page: Page) {
  return page.locator('div').filter({ has: page.getByRole('heading', { name: /Sales Performance/ }) }).first();
}

function analyticsChartCard(page: Page) {
  return page.locator('div').filter({ has: page.getByRole('heading', { name: /Sales Trend/ }) }).first();
}

function dashboardRevenueCard(page: Page, label: string) {
  return page.locator('div').filter({ hasText: `${label} Revenue` }).first();
}

function dashboardProfitCard(page: Page, label: string) {
  return page.locator('div').filter({ hasText: `${label} Net Profit` }).first();
}

function analyticsRevenueCard(page: Page, label: string) {
  return page.locator('div').filter({ hasText: `${label} Revenue` }).first();
}

function analyticsProfitCard(page: Page, label: string) {
  return page.locator('div').filter({ hasText: `${label} Net Profit` }).first();
}

test.describe('Admin Financial Scope Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  for (const entry of dashboardScopes) {
    test(`dashboard shows ${entry.label.toLowerCase()} revenue card`, async ({ page }) => {
      await openAdminDashboard(page);
      await page.getByRole('button', { name: entry.label }).click();
      await expect(dashboardRevenueCard(page, entry.label)).toContainText(`${entry.label} Revenue`);
      await expect(dashboardRevenueCard(page, entry.label)).toContainText(entry.revenue);
    });
  }

  for (const entry of dashboardScopes) {
    test(`dashboard shows ${entry.label.toLowerCase()} profit card`, async ({ page }) => {
      await openAdminDashboard(page);
      await page.getByRole('button', { name: entry.label }).click();
      await expect(dashboardProfitCard(page, entry.label)).toContainText(`${entry.label} Net Profit`);
      await expect(dashboardProfitCard(page, entry.label)).toContainText(entry.profit);
    });
  }

  for (const entry of dashboardScopes) {
    test(`analytics page shows ${entry.label.toLowerCase()} revenue card`, async ({ page }) => {
      await openAdminAnalytics(page);
      await page.getByRole('button', { name: entry.label }).click();
      await expect(analyticsRevenueCard(page, entry.label)).toContainText(`${entry.label} Revenue`);
      await expect(analyticsRevenueCard(page, entry.label)).toContainText(entry.revenue);
    });
  }

  for (const entry of dashboardScopes) {
    test(`analytics page shows ${entry.label.toLowerCase()} profit card`, async ({ page }) => {
      await openAdminAnalytics(page);
      await page.getByRole('button', { name: entry.label }).click();
      await expect(analyticsProfitCard(page, entry.label)).toContainText(`${entry.label} Net Profit`);
      await expect(analyticsProfitCard(page, entry.label)).toContainText(entry.profit);
    });
  }

  for (const entry of dashboardScopes) {
    test(`dashboard scope pill ${entry.label} switches the revenue label`, async ({ page }) => {
      await openAdminDashboard(page);
      await page.getByRole('button', { name: entry.label }).click();
      await expect(dashboardRevenueCard(page, entry.label)).toContainText(`${entry.label} Revenue`);
    });
  }

  for (const entry of dashboardScopes) {
    test(`analytics scope pill ${entry.label} switches the profit label`, async ({ page }) => {
      await openAdminAnalytics(page);
      await page.getByRole('button', { name: entry.label }).click();
      await expect(analyticsProfitCard(page, entry.label)).toContainText(`${entry.label} Net Profit`);
    });
  }

  for (const marginValue of marginValues) {
    test(`analytics saves ${marginValue}% profit margin and updates year profit`, async ({ page }) => {
      const controller = await openAdminAnalytics(page);

      await page.getByRole('button', { name: 'Year' }).click();
      await page.locator('input[type="number"]').fill(String(marginValue));
      await page.getByRole('button', { name: 'Save Margin' }).click();

      const expectedProfit = `₹${(ADMIN_ANALYTICS.periodTotals.year.revenue * (marginValue / 100)).toFixed(2)}`;
      await expect(page.getByText('Profit margin updated.')).toBeVisible();
      await expect(analyticsProfitCard(page, 'Year')).toContainText(expectedProfit);
      expect(controller.patchPayloads[controller.patchPayloads.length - 1]?.profitMargin).toBe(marginValue / 100);
    });
  }

  for (const day of weekdays) {
    test(`dashboard 7 day chart shows ${day} label`, async ({ page }) => {
      await openAdminDashboard(page);
      await expect(dashboardChartCard(page).getByText(day, { exact: true })).toBeVisible();
    });
  }

  for (const day of weekdays) {
    test(`analytics 7 day chart shows ${day} label`, async ({ page }) => {
      await openAdminAnalytics(page);
      await expect(analyticsChartCard(page).getByText(day, { exact: true })).toBeVisible();
    });
  }

  for (const day of monthTickDays) {
    test(`dashboard 30 day chart shows condensed tick ${day}`, async ({ page }) => {
      await openAdminDashboard(page);
      await page.getByRole('button', { name: '30 Days' }).click();
      await expect(dashboardChartCard(page).getByText(new RegExp(`^${day}$`))).toBeVisible();
    });
  }

  for (const day of monthTickDays) {
    test(`analytics 30 day chart shows condensed tick ${day}`, async ({ page }) => {
      await openAdminAnalytics(page);
      await page.getByRole('button', { name: '30 Days' }).click();
      await expect(analyticsChartCard(page).getByText(new RegExp(`^${day}$`))).toBeVisible();
    });
  }
});
