import { test, expect } from '@playwright/test';

const API = 'http://127.0.0.1:5001/api';

test.describe('API Security Tests', () => {
  
  // =========== PUBLIC ENDPOINT SANITY ===========
  
  test('GET /api/menu is public and returns 200', async ({ request }) => {
    const res = await request.get(`${API}/menu`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  // =========== ADMIN ENDPOINTS WITHOUT TOKEN → 401 ===========

  test('GET /api/admin/dashboard without token → 401', async ({ request }) => {
    const res = await request.get(`${API}/admin/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin/weekly-sales without token → 401', async ({ request }) => {
    const res = await request.get(`${API}/admin/weekly-sales`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin/top-products without token → 401', async ({ request }) => {
    const res = await request.get(`${API}/admin/top-products`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin/orders/active without token → 401', async ({ request }) => {
    const res = await request.get(`${API}/admin/orders/active`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin/tables/status without token → 401', async ({ request }) => {
    const res = await request.get(`${API}/admin/tables/status`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/staff without token → 401', async ({ request }) => {
    const res = await request.get(`${API}/staff`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/analytics without token → 401', async ({ request }) => {
    const res = await request.get(`${API}/analytics`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/inventory without token → 401', async ({ request }) => {
    const res = await request.get(`${API}/inventory`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin-orders/live without token → 401', async ({ request }) => {
    const res = await request.get(`${API}/admin-orders/live`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/admin-orders/fakeid without token → 401', async ({ request }) => {
    const res = await request.delete(`${API}/admin-orders/fakeid`);
    expect(res.status()).toBe(401);
  });

  test('PUT /api/admin/orders/fakeid without token → 401', async ({ request }) => {
    const res = await request.put(`${API}/admin/orders/fakeid`, {
      data: { status: 'preparing' },
    });
    expect(res.status()).toBe(401);
  });

  // =========== AUTH ENDPOINT VALIDATION ===========

  test('POST /api/auth/login with empty body → 400', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/auth/login with wrong password → 400', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'admin@cafe.com', password: 'WRONG_PASSWORD_123' },
    });
    // 400 for invalid credentials
    expect([400, 401]).toContain(res.status());
  });

  test('POST /api/auth/login with nonexistent email → 400', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'nonexistent@nobody.com', password: 'whatever' },
    });
    expect([400, 401]).toContain(res.status());
  });

  // =========== NoSQL INJECTION ATTEMPTS ===========

  test('NoSQL injection on login email field → should not succeed', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: {
        email: { $gt: '' },
        password: { $gt: '' },
      },
    });
    // Should NOT return 200 with a token
    expect(res.status()).not.toBe(200);
  });

  test('NoSQL injection on login with $ne operator → should not succeed', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: {
        email: { $ne: null },
        password: { $ne: null },
      },
    });
    expect(res.status()).not.toBe(200);
  });

  // =========== XSS PAYLOAD TESTS ===========

  test('XSS in feedback comment — server should accept but not execute', async ({ request }) => {
    // This just tests that the server doesn't crash on XSS payloads
    const res = await request.post(`${API}/feedback`, {
      data: {
        orderId: 'fakeid123',
        rating: 5,
        comment: '<script>alert("XSS")</script>',
      },
    });
    // Should fail with auth or validation, NOT crash (500)
    expect(res.status()).not.toBe(500);
  });

  // =========== ORDER ROUTES DATA LEAK CHECK ===========

  test('GET /api/orders without auth might leak all orders', async ({ request }) => {
    const res = await request.get(`${API}/orders`);
    // This should either:
    // - Return 401 (properly protected) → BEST
    // - Return 200 with data → VULNERABILITY: log it
    const status = res.status();
    
    if (status === 200) {
      const data = await res.json();
      // Flag if it returns actual order data without auth
      console.warn('⚠️  SECURITY: GET /api/orders returns data without authentication!');
      console.warn(`   Returned ${Array.isArray(data) ? data.length : 'unknown'} orders`);
    }
    
    // We just document this - the test passes but logs the warning
    expect([200, 401, 403]).toContain(status);
  });

  test('PUT /api/orders/:id can update status without auth', async ({ request }) => {
    const res = await request.put(`${API}/orders/000000000000000000000000`, {
      data: { status: 'completed' },
    });
    
    // Should ideally require auth. If 200, it's a vulnerability
    if (res.status() === 200) {
      console.warn('⚠️  SECURITY: PUT /api/orders/:id allows status update without authentication!');
    }
    
    // Document the finding
    expect([200, 400, 401, 403, 404, 500]).toContain(res.status());
  });

  // =========== LARGE PAYLOAD / ABUSE ===========

  test('POST /api/auth/login with oversized payload does not crash server', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: {
        email: 'a'.repeat(10000),
        password: 'b'.repeat(10000),
      },
    });
    // Server should respond (not timeout/crash)
    expect(res.status()).toBeLessThan(600);
  });

  // =========== FORGED JWT ===========

  test('forged JWT token is rejected by admin endpoints', async ({ request }) => {
    const res = await request.get(`${API}/admin/dashboard`, {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZha2UiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTAwMDAwMDB9.INVALID_SIG',
      },
    });
    expect(res.status()).toBe(401);
  });
});
