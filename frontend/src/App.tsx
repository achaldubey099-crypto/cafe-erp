/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";

import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import Tracking from "./pages/Tracking";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Login from "./pages/Login";

import BottomNav from "./components/BottomNav";

// 🔥 AUTH
import ProtectedRoute from "./app/ProtectedRoute";

// 🔥 ADMIN
import Dashboard from "./admin/AdminDashboard";
import Inventory from "./admin/AdminInventory";
import POS from "./admin/AdminPOS.tsx";
import Staff from "./admin/AdminStaff";
import Analytics from "./admin/AdminAnalytics";
import Settings from "./admin/AdminSettings";
import Orders from "./admin/AdminOrders.tsx";
import AdminLogin from "./admin/pages/AdminLogin";
import SuperAdminLogin from "./admin/pages/SuperAdminLogin";
import SuperAdminRestaurants from "./admin/SuperAdminRestaurants";
import SuperAdminAccess from "./admin/SuperAdminAccess";
import AdminLayout from "./components/AdminLayout";
import { syncTenantFromLocation } from "./lib/tenant";
import { useAuth } from "./context/AuthContext";

function TableSessionBinder() {
  const location = useLocation();

  useEffect(() => {
    syncTenantFromLocation(location.pathname, location.hash);
  }, [location.pathname, location.hash]);

  return null;
}

function CustomerBottomNav() {
  const { pathname } = useLocation();

  if (pathname === "/" || pathname.startsWith("/admin") || pathname.startsWith("/superadmin")) {
    return null;
  }

  return <BottomNav />;
}

function RootEntry() {
  const { user, customer } = useAuth();

  if (user?.role === "superadmin") {
    return <Navigate to="/superadmin/access" replace />;
  }

  if (user?.role === "admin" || user?.role === "owner") {
    return <Navigate to="/admin" replace />;
  }

  if (customer) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_0.9fr]">
          <section className="rounded-[2rem] border border-primary/10 bg-white p-8 shadow-xl shadow-black/5 lg:p-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-secondary">Cafe ERP</p>
            <h1 className="mt-4 font-headline text-4xl font-extrabold leading-tight text-primary lg:text-5xl">
              Production is live. Use your login or scan a table QR to open the customer menu.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-secondary">
              The customer menu is now protected table-wise, so the main site URL is an entry point instead of a public menu page.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/admin/login"
                className="rounded-2xl bg-primary px-6 py-3 font-headline font-bold text-white"
              >
                Cafe Owner Login
              </a>
              <a
                href="/superadmin/login"
                className="rounded-2xl border border-outline/20 px-6 py-3 font-headline font-bold text-on-surface"
              >
                Superadmin Login
              </a>
              <a
                href="/login"
                className="rounded-2xl border border-outline/20 px-6 py-3 font-headline font-bold text-on-surface"
              >
                Customer Login
              </a>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-primary/10 bg-primary/5 p-8 shadow-lg shadow-primary/10">
            <h2 className="font-headline text-2xl font-extrabold text-primary">Customer Access</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              Customers should open the restaurant using the protected QR or table URL shared from the admin panel.
            </p>
            <div className="mt-6 rounded-3xl bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-secondary">Expected format</p>
              <code className="mt-3 block break-all text-sm font-semibold text-primary">
                /access/&lt;tableAccessKey&gt;
              </code>
            </div>
            <div className="mt-4 rounded-3xl bg-white p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-secondary">Cafe entry format</p>
              <code className="mt-3 block break-all text-sm font-semibold text-primary">
                /access/restaurant/&lt;restaurantAccessKey&gt;
              </code>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <TableSessionBinder />
        <Routes>

          {/* ================= CUSTOMER ================= */}
          <Route path="/" element={<RootEntry />} />
          <Route path="/access/restaurant/:restaurantAccessKey" element={<Menu />} />
          <Route path="/access/:tableAccessKey" element={<Menu />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Tracking />} />
          <Route path="/profile" element={<Profile />} />

          {/* ================= ADMIN LOGIN (FIXED) ================= */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/superadmin/login" element={<SuperAdminLogin />} />

          {/* ================= ADMIN ================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin", "owner"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route index element={<Dashboard />} />

            {/* Admin Pages */}
            <Route path="orders" element={<Orders />} />
            <Route path="pos" element={<POS />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="staff" element={<Staff />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route
            path="/superadmin"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="access" replace />} />
            <Route path="access" element={<SuperAdminAccess />} />
            <Route path="restaurants" element={<SuperAdminRestaurants />} />
          </Route>

        </Routes>

        {/* 🔥 SHOW NAV ON NON-ADMIN PAGES (visible to public and customers).
            Use pathname so persisted admin user in localStorage doesn't hide nav on public pages. */}
        <CustomerBottomNav />
      </div>
    </Router>
  );
}
