import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// consumer pages
import Menu from "../pages/Menu";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";

// admin pages (you will create these)
import Dashboard from "../admin/pages/Dashboard";
import Orders from "../admin/pages/Orders";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* CUSTOMER */}
        <Route
          path="/"
          element={
            <ProtectedRoute role="customer">
              <Menu />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute role="customer">
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute role="customer">
              <Checkout />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute role="admin">
              <Orders />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}