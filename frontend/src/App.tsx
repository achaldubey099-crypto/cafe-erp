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
import Feedback from "./admin/AdminFeedback";
import PaymentLogs from "./admin/AdminPaymentLogs";
import AdminLogin from "./admin/pages/AdminLogin";
import SuperAdminLogin from "./admin/pages/SuperAdminLogin";
import SuperAdminRestaurants from "./admin/SuperAdminRestaurants";
import SuperAdminAccess from "./admin/SuperAdminAccess";
import AdminLayout from "./components/AdminLayout";
import { syncTenantFromLocation } from "./lib/tenant";

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
  return <div className="min-h-screen bg-background" />;
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
            <Route path="feedback" element={<Feedback />} />
            <Route path="payments" element={<PaymentLogs />} />
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
