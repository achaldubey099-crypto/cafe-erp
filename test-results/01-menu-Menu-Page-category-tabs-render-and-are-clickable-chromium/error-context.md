# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-menu.spec.ts >> Menu Page >> category tabs render and are clickable
- Location: tests/01-menu.spec.ts:20:7

# Error details

```
Error: page.goto: Test ended.
Call log:
  - navigating to "http://localhost:3000/access/table_access_7", waiting until "load"

```

# Test source

```ts
  61  | ) {
  62  |   const products =
  63  |     options?.products ||
  64  |     [
  65  |       {
  66  |         _id: 'coffee-1',
  67  |         name: 'Red Velvet Latte',
  68  |         price: 325,
  69  |         image: 'https://placehold.co/300x300/png',
  70  |         category: 'Coffee',
  71  |         isFeatured: true,
  72  |       },
  73  |     ];
  74  |   const restaurantName = options?.restaurantName || PUBLIC_TEST_RESTAURANT.brandName;
  75  |   const defaultTableNumber = options?.defaultTableNumber || 7;
  76  | 
  77  |   await page.route('**/api/menu/entry**', async (route) => {
  78  |     const firstTableNumber = defaultTableNumber;
  79  |     await json(route, {
  80  |       restaurant: {
  81  |         brandName: restaurantName,
  82  |         accessKey: PUBLIC_TEST_RESTAURANT.accessKey,
  83  |         slug: PUBLIC_TEST_RESTAURANT.slug,
  84  |       },
  85  |       firstTable: {
  86  |         label: getTableLabel(firstTableNumber),
  87  |         tableNumber: firstTableNumber,
  88  |         accessKey: getTableAccessKey(firstTableNumber),
  89  |         url: getProtectedTableUrl(firstTableNumber),
  90  |       },
  91  |       tables: Array.from({ length: 8 }, (_, index) => {
  92  |         const tableNumber = index + 1;
  93  |         return {
  94  |           label: getTableLabel(tableNumber),
  95  |           tableNumber,
  96  |           accessKey: getTableAccessKey(tableNumber),
  97  |           url: getProtectedTableUrl(tableNumber),
  98  |         };
  99  |       }),
  100 |     });
  101 |   });
  102 | 
  103 |   await page.route('**/api/menu/access**', async (route) => {
  104 |     const request = route.request();
  105 |     const tableNumber = resolveTableNumberFromRequest(request.url(), request.headers());
  106 |     await json(route, {
  107 |       restaurant: {
  108 |         brandName: restaurantName,
  109 |         accessKey: PUBLIC_TEST_RESTAURANT.accessKey,
  110 |         slug: PUBLIC_TEST_RESTAURANT.slug,
  111 |         publicRestaurantId: PUBLIC_TEST_RESTAURANT.publicRestaurantId,
  112 |       },
  113 |       table: {
  114 |         label: getTableLabel(tableNumber),
  115 |         tableNumber,
  116 |         accessKey: getTableAccessKey(tableNumber),
  117 |         publicTableId: `table_public_${tableNumber}`,
  118 |       },
  119 |       featuredItem: products.find((item) => item.isFeatured) || null,
  120 |       menu: products,
  121 |     });
  122 |   });
  123 | 
  124 |   await page.route('**/api/menu/featured**', async (route) => {
  125 |     await json(route, products.find((item) => item.isFeatured) || null);
  126 |   });
  127 | }
  128 | 
  129 | export async function mockProtectedOrderApis(page: Page, options?: { tableNumber?: number; orders?: unknown[] }) {
  130 |   const tableNumber = options?.tableNumber || 7;
  131 |   const orders =
  132 |     options?.orders ||
  133 |     [
  134 |       {
  135 |         _id: `tracking-order-${tableNumber}`,
  136 |         createdAt: '2026-04-14T10:00:00.000Z',
  137 |         items: [{ itemId: 'coffee-1', name: 'Red Velvet Latte', price: 325, quantity: 1 }],
  138 |         grandTotal: 325,
  139 |         status: 'pending',
  140 |         estimatedTime: '10 mins',
  141 |         tableId: tableNumber,
  142 |       },
  143 |     ];
  144 | 
  145 |   await page.route('**/api/orders/table**', async (route) => {
  146 |     await json(route, orders);
  147 |   });
  148 | 
  149 |   await page.route('**/api/orders/latest**', async (route) => {
  150 |     const latest = Array.isArray(orders) ? orders[0] || null : null;
  151 |     if (!latest) {
  152 |       await json(route, { message: 'No orders found' }, 404);
  153 |       return;
  154 |     }
  155 | 
  156 |     await json(route, latest);
  157 |   });
  158 | }
  159 | 
  160 | export async function openProtectedTable(page: Page, tableNumber = 7) {
> 161 |   await page.goto(getProtectedTableUrl(tableNumber));
      |              ^ Error: page.goto: Test ended.
  162 | }
  163 | 
```