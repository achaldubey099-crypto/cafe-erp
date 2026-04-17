import type { Page, Route } from '@playwright/test';

export const PUBLIC_TEST_RESTAURANT = {
  brandName: 'Fuel Headquarters',
  accessKey: 'rest_access_fuel_headquarters',
  slug: 'fuel-headquarters',
  publicRestaurantId: 'rest_fuel_headquarters',
};

export const getTableAccessKey = (tableNumber = 7) => `table_access_${tableNumber}`;
export const getTableLabel = (tableNumber = 7) => `Table ${tableNumber}`;
export const getProtectedCafeUrl = () => `/access/restaurant/${PUBLIC_TEST_RESTAURANT.accessKey}`;
export const getProtectedTableUrl = (tableNumber = 7) => `/access/${getTableAccessKey(tableNumber)}`;

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

const resolveTableNumberFromRequest = (requestUrl: string, headers: Record<string, string>) => {
  const url = new URL(requestUrl);
  const queryKey =
    url.searchParams.get('tableAccessKey') ||
    url.searchParams.get('accessKey') ||
    url.searchParams.get('key') ||
    '';
  const headerKey = headers['x-table-access-key'] || '';
  const fallback = queryKey || headerKey;
  const match = fallback.match(/(\d+)$/);
  return match ? Number(match[1]) : 7;
};

export async function seedProtectedAccess(page: Page, tableNumber = 7) {
  await page.addInitScript(
    ({ restaurantAccessKey, tableAccessKey }) => {
      localStorage.setItem('restaurantAccessKey', restaurantAccessKey);
      localStorage.setItem('tableAccessKey', tableAccessKey);
      localStorage.removeItem('restaurantPublicId');
      localStorage.removeItem('tablePublicId');
      localStorage.removeItem('restaurantSlug');
      localStorage.removeItem('tableSlug');
      localStorage.removeItem('sessionId');
    },
    {
      restaurantAccessKey: PUBLIC_TEST_RESTAURANT.accessKey,
      tableAccessKey: getTableAccessKey(tableNumber),
    }
  );
}

export async function mockProtectedMenuApis(
  page: Page,
  options?: {
    products?: Array<{ _id: string; name: string; price: number; image: string; category: string; isFeatured?: boolean }>;
    defaultTableNumber?: number;
    restaurantName?: string;
  }
) {
  const products =
    options?.products ||
    [
      {
        _id: 'coffee-1',
        name: 'Red Velvet Latte',
        price: 325,
        image: 'https://placehold.co/300x300/png',
        category: 'Coffee',
        isFeatured: true,
      },
    ];
  const restaurantName = options?.restaurantName || PUBLIC_TEST_RESTAURANT.brandName;
  const defaultTableNumber = options?.defaultTableNumber || 7;

  await page.route('**/api/menu/entry**', async (route) => {
    const firstTableNumber = defaultTableNumber;
    await json(route, {
      restaurant: {
        brandName: restaurantName,
        accessKey: PUBLIC_TEST_RESTAURANT.accessKey,
        slug: PUBLIC_TEST_RESTAURANT.slug,
      },
      firstTable: {
        label: getTableLabel(firstTableNumber),
        tableNumber: firstTableNumber,
        accessKey: getTableAccessKey(firstTableNumber),
        url: getProtectedTableUrl(firstTableNumber),
      },
      tables: Array.from({ length: 8 }, (_, index) => {
        const tableNumber = index + 1;
        return {
          label: getTableLabel(tableNumber),
          tableNumber,
          accessKey: getTableAccessKey(tableNumber),
          url: getProtectedTableUrl(tableNumber),
        };
      }),
    });
  });

  await page.route('**/api/menu/access**', async (route) => {
    const request = route.request();
    const tableNumber = resolveTableNumberFromRequest(request.url(), request.headers());
    await json(route, {
      restaurant: {
        brandName: restaurantName,
        accessKey: PUBLIC_TEST_RESTAURANT.accessKey,
        slug: PUBLIC_TEST_RESTAURANT.slug,
        publicRestaurantId: PUBLIC_TEST_RESTAURANT.publicRestaurantId,
      },
      table: {
        label: getTableLabel(tableNumber),
        tableNumber,
        accessKey: getTableAccessKey(tableNumber),
        publicTableId: `table_public_${tableNumber}`,
      },
      featuredItem: products.find((item) => item.isFeatured) || null,
      menu: products,
    });
  });

  await page.route('**/api/menu/featured**', async (route) => {
    await json(route, products.find((item) => item.isFeatured) || null);
  });
}

export async function mockProtectedOrderApis(page: Page, options?: { tableNumber?: number; orders?: unknown[] }) {
  const tableNumber = options?.tableNumber || 7;
  const orders =
    options?.orders ||
    [
      {
        _id: `tracking-order-${tableNumber}`,
        createdAt: '2026-04-14T10:00:00.000Z',
        items: [{ itemId: 'coffee-1', name: 'Red Velvet Latte', price: 325, quantity: 1 }],
        grandTotal: 325,
        status: 'pending',
        estimatedTime: '10 mins',
        tableId: tableNumber,
      },
    ];

  await page.route('**/api/orders/table**', async (route) => {
    await json(route, orders);
  });

  await page.route('**/api/orders/latest**', async (route) => {
    const latest = Array.isArray(orders) ? orders[0] || null : null;
    if (!latest) {
      await json(route, { message: 'No orders found' }, 404);
      return;
    }

    await json(route, latest);
  });
}

export async function openProtectedTable(page: Page, tableNumber = 7) {
  await page.goto(getProtectedTableUrl(tableNumber));
}
