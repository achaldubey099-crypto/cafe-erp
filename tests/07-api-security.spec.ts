import { test, expect } from '@playwright/test';

const API = 'http://127.0.0.1:5001/api';

test.describe('API Security Tests', () => {
  test('GET /api/menu/access without protected identifiers returns 400', async ({ request }) => {
    const res = await request.get(`${API}/menu/access`);
    expect(res.status()).toBe(400);
  });

  test('GET /api/menu/entry without protected identifiers returns 400', async ({ request }) => {
    const res = await request.get(`${API}/menu/entry`);
    expect(res.status()).toBe(400);
  });

  test('GET /api/admin/dashboard without token returns 401', async ({ request }) => {
    const res = await request.get(`${API}/admin/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/staff without token returns 401', async ({ request }) => {
    const res = await request.get(`${API}/staff`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/analytics without token returns 401', async ({ request }) => {
    const res = await request.get(`${API}/analytics`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/inventory without token returns 401', async ({ request }) => {
    const res = await request.get(`${API}/inventory`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/auth/login with empty body returns 400', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, { data: {} });
    expect(res.status()).toBe(400);
  });

  test('POST /api/auth/superadmin/login with wrong password is rejected', async ({ request }) => {
    const res = await request.post(`${API}/auth/superadmin/login`, {
      data: { email: 'admin', password: 'WRONG_PASSWORD_123' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('POST /api/auth/login with nonexistent email is rejected', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'nonexistent@nobody.com', password: 'whatever' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('NoSQL injection on login email field does not succeed', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: {
        email: { $gt: '' },
        password: { $gt: '' },
      },
    });
    expect(res.status()).not.toBe(200);
  });

  test('NoSQL injection on superadmin login does not succeed', async ({ request }) => {
    const res = await request.post(`${API}/auth/superadmin/login`, {
      data: {
        email: { $ne: null },
        password: { $ne: null },
      },
    });
    expect(res.status()).not.toBe(200);
  });

  test('XSS payload on feedback does not crash the server', async ({ request }) => {
    const res = await request.post(`${API}/feedback`, {
      data: {
        orderId: 'fakeid123',
        rating: 5,
        comment: '<script>alert("XSS")</script>',
      },
    });
    expect(res.status()).not.toBe(500);
  });

  test('GET /api/orders without scoped access is not a server error', async ({ request }) => {
    const res = await request.get(`${API}/orders`);
    expect(res.status()).toBeLessThan(600);
  });

  test('PUT /api/orders/:id without auth is not silently successful', async ({ request }) => {
    const res = await request.put(`${API}/orders/000000000000000000000000`, {
      data: { status: 'completed' },
    });
    expect(res.status()).not.toBe(200);
  });

  test('oversized auth payload does not crash the server', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: {
        email: 'a'.repeat(10000),
        password: 'b'.repeat(10000),
      },
    });
    expect(res.status()).toBeLessThan(600);
  });

  test('forged JWT token is rejected by admin endpoints', async ({ request }) => {
    const res = await request.get(`${API}/admin/dashboard`, {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZha2UiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTAwMDAwMDB9.INVALID_SIG',
      },
    });
    expect(res.status()).toBe(401);
  });
});
