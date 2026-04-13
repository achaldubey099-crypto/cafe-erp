/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import Tracking from "./pages/Tracking";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";

import BottomNav from "./components/BottomNav";

// 🔥 AUTH
import ProtectedRoute from "./app/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

// 🔥 ADMIN
import Dashboard from "./admin/AdminDashboard";
import Inventory from "./admin/AdminInventory";
import POS from "./admin/AdminPOS";
import Staff from "./admin/AdminStaff";
import Analytics from "./admin/AdminAnalytics";
import Settings from "./admin/AdminSettings";
import Orders from "./admin/AdminOrders";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminLayout from "./components/AdminLayout";

export default function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>

          {/* ================= CUSTOMER ================= */}
          <Route path="/" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Tracking />} />
          <Route path="/profile" element={<Profile />} />

          {/* ================= ADMIN LOGIN (FIXED) ================= */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ================= ADMIN ================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
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

        </Routes>

        {/* 🔥 SHOW NAV ON NON-ADMIN PAGES (visible to public and customers).
            Use pathname so persisted admin user in localStorage doesn't hide nav on public pages. */}
        {(() => {
          function NavByPath() {
            const { pathname } = useLocation();
            if (pathname.startsWith("/admin")) return null;
            return <BottomNav />;
          }

          return <NavByPath />;
        })()}
      </div>
    </Router>
  );
}