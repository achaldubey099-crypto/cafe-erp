import { Page, Route } from '@playwright/test';
import { PUBLIC_TEST_RESTAURANT, getProtectedTableUrl, getTableAccessKey, getTableLabel } from './public-access';

export interface MockProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
  category: string;
  isFeatured?: boolean;
}

export interface MockCartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

export interface MockOrder {
  _id: string;
  createdAt: string;
  items: Array<{
    itemId: string | number;
    name: string;
    price: number;
    quantity: number;
  }>;
  grandTotal: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  estimatedTime?: string;
  userId?: string;
  tableId?: number;
}

export interface MockFeedback {
  _id: string;
  orderId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockStaffMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  lastActive?: string;
  img?: string;
}

export interface MockAnalytics {
  todaysSales: number;
  totalOrders: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin?: number;
  periodTotals?: {
    month: { revenue: number; profit: number };
    year: { revenue: number; profit: number };
    allTime: { revenue: number; profit: number };
  };
  weeklySales: Record<string, number>;
  salesSeries7d?: Array<{ label: string; value: number }>;
  salesSeries30d?: Array<{ label: string; value: number }>;
  bestSellingProduct: { name: string; count: number };
  retentionRate: string | number;
  topSellingItems: Array<{ name: string; quantity: number }>;
  advice: string;
}

export const MOCK_CUSTOMER = {
  _id: 'test-customer-123',
  name: 'Test Customer',
  email: 'test@example.com',
  role: 'user' as const,
  avatar: '',
};

export const MENU_PRODUCTS: MockProduct[] = [
  {
    _id: 'coffee-1',
    name: 'Red Velvet Latte',
    description: 'Layered espresso with velvet foam.',
    price: 325,
    image: 'https://res.cloudinary.com/dacvso9mg/image/upload/v1776161638/WhatsApp_Image_2026-04-14_at_15.42.02_easn3i.jpg',
    category: 'Coffee',
    isFeatured: true,
  },
  {
    _id: 'coffee-2',
    name: 'Flat White',
    description: 'Microfoam and double espresso.',
    price: 280,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    category: 'Coffee',
  },
  {
    _id: 'snack-1',
    name: 'Burger',
    description: 'Smoky double patty burger.',
    price: 450,
    image: 'https://res.cloudinary.com/dacvso9mg/image/upload/v1776161638/WhatsApp_Image_2026-04-14_at_15.38.51_vfpwyw.jpg',
    category: 'Snacks',
  },
  {
    _id: 'snack-2',
    name: 'Falafel Period',
    description: 'Crisp falafel plate.',
    price: 325,
    image: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=800&q=80',
    category: 'Snacks',
  },
  {
    _id: 'dessert-1',
    name: 'Chocolate Cake',
    description: 'Dark sponge with cream topping.',
    price: 295,
    image: 'https://res.cloudinary.com/dacvso9mg/image/upload/v1776161638/WhatsApp_Image_2026-04-14_at_15.42.55_rz9d4a.jpg',
    category: 'Desserts',
  },
  {
    _id: 'dessert-2',
    name: 'Cheesecake Slice',
    description: 'Classic baked cheesecake.',
    price: 275,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
    category: 'Desserts',
  },
  {
    _id: 'tea-1',
    name: 'Masala Chai',
    description: 'Spiced tea with milk.',
    price: 180,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    category: 'Teas',
  },
  {
    _id: 'tea-2',
    name: 'Mint Tea',
    description: 'Fresh mint leaves and citrus.',
    price: 160,
    image: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&w=800&q=80',
    category: 'Teas',
  },
  {
    _id: 'seasonal-1',
    name: 'Mango Cooler',
    description: 'Chilled mango and soda.',
    price: 220,
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=800&q=80',
    category: 'Seasonal',
  },
  {
    _id: 'seasonal-2',
    name: 'Berry Fizz',
    description: 'Sparkling berry tonic.',
    price: 240,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    category: 'Seasonal',
  },
];

export const TEST_CART: MockCartItem[] = [
  {
    _id: 'coffee-1',
    name: 'Red Velvet Latte',
    price: 325,
    image: MENU_PRODUCTS[0].image,
    category: 'Coffee',
    quantity: 2,
  },
  {
    _id: 'snack-1',
    name: 'Burger',
    price: 450,
    image: MENU_PRODUCTS[2].image,
    category: 'Snacks',
    quantity: 1,
  },
];

export const ALT_CART: MockCartItem[] = [
  {
    _id: 'dessert-1',
    name: 'Chocolate Cake',
    price: 295,
    image: MENU_PRODUCTS[4].image,
    category: 'Desserts',
    quantity: 3,
  },
];

export const PROFILE_ORDERS: MockOrder[] = [
  {
    _id: 'order-1',
    createdAt: '2026-04-14T08:30:00.000Z',
    items: [
      { itemId: 'coffee-1', name: 'Red Velvet Latte', price: 325, quantity: 2 },
      { itemId: 'snack-1', name: 'Burger', price: 450, quantity: 1 },
    ],
    grandTotal: 1150,
    status: 'completed',
    userId: MOCK_CUSTOMER._id,
    tableId: 7,
  },
  {
    _id: 'order-2',
    createdAt: '2026-04-13T12:15:00.000Z',
    items: [
      { itemId: 'dessert-1', name: 'Chocolate Cake', price: 295, quantity: 1 },
    ],
    grandTotal: 295,
    status: 'completed',
    userId: MOCK_CUSTOMER._id,
    tableId: 7,
  },
];

export const TRACKING_ORDER: MockOrder = {
  _id: 'tracking-order-1',
  createdAt: '2026-04-14T10:00:00.000Z',
  items: [
    { itemId: 'coffee-1', name: 'Red Velvet Latte', price: 325, quantity: 1 },
    { itemId: 'dessert-1', name: 'Chocolate Cake', price: 295, quantity: 1 },
  ],
  grandTotal: 640,
  status: 'completed',
  estimatedTime: '10 mins',
  userId: MOCK_CUSTOMER._id,
  tableId: 7,
};

export const PROFILE_FAVORITES = [
  {
    _id: 'favorite-1',
    itemId: {
      _id: 'dessert-1',
      name: 'Chocolate Cake',
      price: 295,
      image: MENU_PRODUCTS[4].image,
      category: 'Desserts',
    },
  },
  {
    _id: 'favorite-2',
    itemId: {
      _id: 'coffee-1',
      name: 'Red Velvet Latte',
      price: 325,
      image: MENU_PRODUCTS[0].image,
      category: 'Coffee',
    },
  },
];

export const EXISTING_FEEDBACK: MockFeedback = {
  _id: 'feedback-1',
  orderId: TRACKING_ORDER._id,
  userId: MOCK_CUSTOMER._id,
  rating: 4,
  comment: 'Loved the latte, cake was solid too.',
  createdAt: '2026-04-14T11:00:00.000Z',
  updatedAt: '2026-04-14T11:05:00.000Z',
};

export const ADMIN_ORDERS: MockOrder[] = [
  {
    _id: 'admin-order-1',
    createdAt: '2026-04-14T08:10:00.000Z',
    items: [
      { itemId: 1, name: 'Red Velvet Latte', price: 325, quantity: 2 },
      { itemId: 2, name: 'Burger', price: 450, quantity: 1 },
    ],
    grandTotal: 1100,
    status: 'pending',
    tableId: 3,
  },
  {
    _id: 'admin-order-2',
    createdAt: '2026-04-14T08:25:00.000Z',
    items: [
      { itemId: 5, name: 'Chocolate Cake', price: 295, quantity: 1 },
    ],
    grandTotal: 295,
    status: 'preparing',
    tableId: 5,
  },
  {
    _id: 'admin-order-3',
    createdAt: '2026-04-14T08:35:00.000Z',
    items: [
      { itemId: 7, name: 'Masala Chai', price: 180, quantity: 2 },
    ],
    grandTotal: 360,
    status: 'ready',
    tableId: 5,
  },
  {
    _id: 'admin-order-4',
    createdAt: '2026-04-14T07:50:00.000Z',
    items: [
      { itemId: 6, name: 'Cheesecake Slice', price: 275, quantity: 1 },
    ],
    grandTotal: 275,
    status: 'completed',
    tableId: 7,
  },
  {
    _id: 'admin-order-5',
    createdAt: '2026-04-14T07:40:00.000Z',
    items: [
      { itemId: 8, name: 'Mint Tea', price: 160, quantity: 1 },
    ],
    grandTotal: 160,
    status: 'cancelled',
    tableId: 8,
  },
];

export const STAFF_MEMBERS: MockStaffMember[] = [
  {
    _id: 'staff-1',
    name: 'Sarah Connor',
    email: 'sarah@artisan.coffee',
    role: 'manager',
    status: 'active',
    lastActive: '2 mins ago',
  },
  {
    _id: 'staff-2',
    name: 'Leo Park',
    email: 'leo@artisan.coffee',
    role: 'barista',
    status: 'active',
    lastActive: '15 mins ago',
  },
  {
    _id: 'staff-3',
    name: 'Aisha Khan',
    email: 'aisha@artisan.coffee',
    role: 'cashier',
    status: 'offline',
    lastActive: '1 hour ago',
  },
];

export const ANALYTICS_FIXTURE: MockAnalytics = {
  todaysSales: 8450,
  totalOrders: 37,
  totalRevenue: 124500,
  netProfit: 48250,
  profitMargin: 0.3876,
  periodTotals: {
    month: { revenue: 42350, profit: 16420.86 },
    year: { revenue: 124500, profit: 48250 },
    allTime: { revenue: 196000, profit: 75969.6 },
  },
  weeklySales: {
    Mon: 1400,
    Tue: 1100,
    Wed: 1800,
    Thu: 2200,
    Fri: 2600,
    Sat: 3200,
    Sun: 2900,
  },
  salesSeries7d: [
    { label: 'Mon', value: 1400 },
    { label: 'Tue', value: 1100 },
    { label: 'Wed', value: 1800 },
    { label: 'Thu', value: 2200 },
    { label: 'Fri', value: 2600 },
    { label: 'Sat', value: 3200 },
    { label: 'Sun', value: 2900 },
  ],
  salesSeries30d: [
    { label: '17 Mar', value: 0 },
    { label: '18 Mar', value: 0 },
    { label: '19 Mar', value: 0 },
    { label: '20 Mar', value: 350 },
    { label: '21 Mar', value: 0 },
    { label: '22 Mar', value: 0 },
    { label: '23 Mar', value: 420 },
    { label: '24 Mar', value: 0 },
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
  bestSellingProduct: {
    name: 'Red Velvet Latte',
    count: 42,
  },
  retentionRate: 68,
  topSellingItems: [
    { name: 'Red Velvet Latte', quantity: 42 },
    { name: 'Burger', quantity: 29 },
    { name: 'Chocolate Cake', quantity: 21 },
  ],
  advice: 'Push the featured latte during evening hours to lift average order value.',
};

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function clearStorage(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
  });
}

export async function seedCustomer(page: Page, user = MOCK_CUSTOMER) {
  await page.addInitScript((customer) => {
    localStorage.setItem('customerToken', 'playwright-customer-token');
    localStorage.setItem('customerUser', JSON.stringify(customer));
  }, user);
}

export async function seedAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'playwright-admin-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        _id: 'admin-user-1',
        name: 'Playwright Admin',
        email: 'admin@cafe.com',
        role: 'admin',
      })
    );
  });
}

export async function seedCart(page: Page, cart = TEST_CART) {
  await page.addInitScript(({ items, restaurantAccessKey, tableAccessKey }) => {
    localStorage.setItem('cart', JSON.stringify(items));
    localStorage.setItem('restaurantAccessKey', restaurantAccessKey);
    localStorage.setItem('tableAccessKey', tableAccessKey);
  }, {
    items: cart,
    restaurantAccessKey: PUBLIC_TEST_RESTAURANT.accessKey,
    tableAccessKey: getTableAccessKey(7),
  });
}

export async function seedTable(page: Page, tableId = '7') {
  await page.addInitScript(({ restaurantAccessKey, tableAccessKey }) => {
    localStorage.setItem('restaurantAccessKey', restaurantAccessKey);
    localStorage.setItem('tableAccessKey', tableAccessKey);
  }, {
    restaurantAccessKey: PUBLIC_TEST_RESTAURANT.accessKey,
    tableAccessKey: getTableAccessKey(Number(tableId)),
  });
}

export async function mockMenu(page: Page, products = MENU_PRODUCTS) {
  await page.route('**/api/menu**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname.endsWith('/menu/entry') && request.method() === 'GET') {
      await json(route, {
        restaurant: {
          brandName: PUBLIC_TEST_RESTAURANT.brandName,
          accessKey: PUBLIC_TEST_RESTAURANT.accessKey,
          slug: PUBLIC_TEST_RESTAURANT.slug,
        },
        firstTable: {
          label: getTableLabel(7),
          tableNumber: 7,
          accessKey: getTableAccessKey(7),
          url: getProtectedTableUrl(7),
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
      return;
    }

    if (url.pathname.endsWith('/menu/access') && request.method() === 'GET') {
      const tableAccessKey =
        request.headers()['x-table-access-key'] ||
        url.searchParams.get('tableAccessKey') ||
        url.searchParams.get('accessKey') ||
        '';
      const match = tableAccessKey.match(/(\d+)$/);
      const tableNumber = match ? Number(match[1]) : 7;

      await json(route, {
        restaurant: {
          brandName: PUBLIC_TEST_RESTAURANT.brandName,
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
      return;
    }

    if (request.method() === 'GET') {
      await json(route, products);
      return;
    }

    if (request.method() === 'POST') {
      await json(route, {
        item: {
          _id: `menu-${products.length + 1}`,
          name: 'Playwright Special',
          price: 199,
          category: 'Coffee',
          image: MENU_PRODUCTS[0].image,
          isFeatured: false,
        },
      }, 201);
      return;
    }

    await json(route, {});
  });
}

export async function mockFavorites(page: Page, favorites = PROFILE_FAVORITES) {
  await page.route('**/api/favorites**', async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      await json(route, favorites);
      return;
    }

    const payload = request.postDataJSON?.() || {};
    const itemId = payload.itemId;
    const favorite = favorites.find((entry) => entry.itemId?._id === itemId);

    await json(route, {
      message: 'Added to favorites',
      favorite:
        favorite || {
          _id: `favorite-${itemId}`,
          itemId: {
            _id: itemId,
            name: payload.name,
            price: payload.price,
            image: payload.image,
            category: payload.category || '',
          },
        },
    });
  });
}

export async function mockOrders(page: Page, orders = PROFILE_ORDERS) {
  await page.route('**/api/orders**', async (route) => {
    const request = route.request();

    if (request.method() === 'PUT') {
      const payload = request.postDataJSON?.() || {};
      const orderId = request.url().split('/').pop() || 'order-updated';
      await json(route, {
        order: {
          _id: orderId,
          status: payload.status || 'pending',
        },
      });
      return;
    }

    if (request.method() !== 'GET') {
      await route.continue();
      return;
    }

    const url = new URL(request.url());
    if (url.pathname.endsWith('/orders/latest')) {
      await route.continue();
      return;
    }

    await json(route, orders);
  });
}

export async function mockLatestOrder(page: Page, order: MockOrder | null = TRACKING_ORDER) {
  await page.route('**/api/orders/table**', async (route) => {
    if (!order) {
      await json(route, []);
      return;
    }

    await json(route, [order]);
  });

  await page.route('**/api/orders/latest**', async (route) => {
    if (!order) {
      await json(route, { message: 'No orders found' }, 404);
      return;
    }

    await json(route, order);
  });
}

export async function mockFeedback(page: Page, feedback: MockFeedback | null = EXISTING_FEEDBACK) {
  await page.route('**/api/feedback/order/**', async (route) => {
    await json(route, { feedback });
  });

  await page.route('**/api/feedback', async (route) => {
    const payload = route.request().postDataJSON?.() || {};
    const nextFeedback = {
      ...(feedback || EXISTING_FEEDBACK),
      rating: payload.rating ?? feedback?.rating ?? 5,
      comment: payload.comment ?? feedback?.comment ?? '',
      updatedAt: new Date().toISOString(),
    };

    await json(route, {
      message: 'Review saved',
      feedback: nextFeedback,
    }, 201);
  });
}

export async function mockOrderSubmission(page: Page, responseOrder = TRACKING_ORDER) {
  await page.route('**/api/orders', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    await json(route, {
      message: 'Order placed successfully',
      order: responseOrder,
    }, 201);
  });
}

export async function mockPaymentCreateOrder(
  page: Page,
  order = {
    id: 'order_playwright_1',
    amount: 117500,
    currency: 'INR',
  }
) {
  await page.route('**/api/payment/create-order', async (route) => {
    await json(route, order);
  });
}

export async function mockPaymentVerify(
  page: Page,
  response: Record<string, unknown> = { success: true },
  status = 200
) {
  await page.route('**/api/payment/verify', async (route) => {
    await json(route, response, status);
  });
}

export async function installMockRazorpay(
  page: Page,
  config?: {
    autoResolve?: boolean;
    throwOnConstruct?: boolean;
    response?: {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };
  }
) {
  const mockConfig = config || {};
  const script = `
    (() => {
      const mockConfig = ${JSON.stringify(mockConfig)};
      const defaultResponse = {
        razorpay_order_id: 'order_playwright_1',
        razorpay_payment_id: 'pay_playwright_1',
        razorpay_signature: 'sig_playwright_1',
      };

      window.__razorpayOpenCount = 0;
      window.__razorpayOptionsHistory = [];

      class MockRazorpay {
        constructor(options) {
          if (mockConfig.throwOnConstruct) {
            throw new Error('Mock Razorpay constructor failure');
          }

          this.options = options;
          window.__razorpayOptionsHistory.push(options);
        }

        open() {
          window.__razorpayOpenCount = (window.__razorpayOpenCount || 0) + 1;

          if (mockConfig.autoResolve && typeof this.options?.handler === 'function') {
            const response = { ...defaultResponse, ...(mockConfig.response || {}) };
            setTimeout(() => this.options.handler(response), 0);
          }
        }
      }

      window.Razorpay = MockRazorpay;
    })();
  `;

  await page.route('https://checkout.razorpay.com/v1/checkout.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: script,
    });
  });
}

export async function mockAdminLogin(page: Page) {
  await page.route('**/api/auth/admin/login', async (route) => {
    const payload = route.request().postDataJSON?.() || {};

    await json(route, {
      token: 'playwright-admin-token',
      user: {
        id: 'admin-user-1',
        _id: 'admin-user-1',
        name: payload.email ? 'Playwright Admin' : 'Admin User',
        email: payload.email || 'admin@artisan.coffee',
        role: 'admin',
      },
    });
  });
}

export async function mockStaff(page: Page, staff = STAFF_MEMBERS) {
  await page.route('**/api/staff**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      await json(route, { staff });
      return;
    }

    if (request.method() === 'POST') {
      const payload = request.postDataJSON?.() || {};
      await json(route, {
        _id: `staff-${staff.length + 1}`,
        status: 'active',
        lastActive: 'just now',
        ...payload,
      });
      return;
    }

    if (request.method() === 'PUT') {
      const payload = request.postDataJSON?.() || {};
      const currentId = route.request().url().split('/').pop() || 'staff-updated';
      await json(route, {
        _id: currentId,
        status: 'active',
        lastActive: 'just now',
        ...payload,
      });
      return;
    }

    await json(route, {});
  });
}

export async function mockAdminOrders(page: Page, orders = ADMIN_ORDERS) {
  await page.route('**/api/admin-orders/**', async (route) => {
    const request = route.request();
    if (request.method() === 'DELETE') {
      await json(route, { success: true });
      return;
    }

    await json(route, { success: true, status: request.postDataJSON?.().status || 'completed' });
  });
}

export async function mockAnalytics(page: Page, analytics = ANALYTICS_FIXTURE) {
  await page.route('**/api/analytics**', async (route) => {
    if (route.request().method() === 'PATCH') {
      const payload = route.request().postDataJSON?.() || {};
      const profitMargin = Number(payload.profitMargin ?? analytics.profitMargin ?? 0.4);
      const periodTotals = analytics.periodTotals || {
        month: { revenue: analytics.totalRevenue, profit: analytics.totalRevenue * profitMargin },
        year: { revenue: analytics.totalRevenue, profit: analytics.totalRevenue * profitMargin },
        allTime: { revenue: analytics.totalRevenue, profit: analytics.totalRevenue * profitMargin },
      };

      const updated = {
        ...analytics,
        profitMargin,
        netProfit: periodTotals.year.revenue * profitMargin,
        periodTotals: {
          month: {
            revenue: periodTotals.month.revenue,
            profit: Number((periodTotals.month.revenue * profitMargin).toFixed(2)),
          },
          year: {
            revenue: periodTotals.year.revenue,
            profit: Number((periodTotals.year.revenue * profitMargin).toFixed(2)),
          },
          allTime: {
            revenue: periodTotals.allTime.revenue,
            profit: Number((periodTotals.allTime.revenue * profitMargin).toFixed(2)),
          },
        },
      };

      await json(route, updated);
      return;
    }

    await json(route, analytics);
  });
}

export async function mockAdminPageApis(page: Page) {
  await mockAnalytics(page);
  await mockStaff(page);
  await mockAdminOrders(page);
  await mockOrders(page, ADMIN_ORDERS);
  await mockMenu(page);
  await page.route('**/api/admin/orders/active**', async (route) => {
    await json(
      route,
      ADMIN_ORDERS.filter((order) => ['pending', 'preparing', 'ready'].includes(order.status))
    );
  });
  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/admin/restaurant/me')) {
      await json(route, {
        brandName: PUBLIC_TEST_RESTAURANT.brandName,
        slug: PUBLIC_TEST_RESTAURANT.slug,
        accessKey: PUBLIC_TEST_RESTAURANT.accessKey,
        logoUrl: '',
        description: 'Protected QR ordering for Fuel Headquarters',
        publicRestaurantId: PUBLIC_TEST_RESTAURANT.publicRestaurantId,
        tables: Array.from({ length: 8 }, (_, index) => {
          const tableNumber = index + 1;
          return {
            publicTableId: `table_public_${tableNumber}`,
            slug: `table-${tableNumber}`,
            accessKey: getTableAccessKey(tableNumber),
            label: getTableLabel(tableNumber),
            tableNumber,
          };
        }),
      });
      return;
    }

    await json(route, {});
  });
}
