import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// consumer pages
import Menu from "../pages/Menu";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Login from "../pages/Login";

// admin pages
import Dashboard from "../admin/AdminDashboard";
import Orders from "../admin/AdminOrders";
import AdminLogin from "../admin/pages/AdminLogin";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Menu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute roles={["user"]}>
              <Checkout />
            </ProtectedRoute>
          }
        />

        {/* 🔐 ADMIN LOGIN (IMPORTANT - NOT PROTECTED) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* 🔐 ADMIN PROTECTED ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin", "owner"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute roles={["admin", "owner"]}>
              <Orders />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
