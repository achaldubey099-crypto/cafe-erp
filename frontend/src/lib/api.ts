/// <reference types="vite/client" />
import axios from "axios";
import {
  getPublicRestaurantId,
  getPublicTableId,
  getRestaurantAccessKey,
  getRestaurantSlug,
  getTableAccessKey,
  getTableSlug,
} from "./tenant";

const rawEnvApi =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined);

const normalizedApiOrigin = rawEnvApi
  ? rawEnvApi.replace(/\/$/, "").replace(/\/api$/, "")
  : import.meta.env.PROD
    ? "https://cafe-erp-backend.onrender.com"
    : "";

const API = axios.create({
  baseURL: normalizedApiOrigin ? `${normalizedApiOrigin}/api` : "/api",
  withCredentials: true, // 🔥 important for CORS & cookies (future-ready)
});

// 🔐 Attach token automatically
API.interceptors.request.use(
  (req: any) => {
    const url = req.url || "";
    const adminPath = /^\/?(admin|admin-orders|staff|analytics|inventory|superadmin)\b/.test(url);
    const token = adminPath
      ? localStorage.getItem("token")
      : localStorage.getItem("customerToken") || localStorage.getItem("token");

    if (token && req.headers) {
      req.headers.Authorization = `Bearer ${token}`;
    }

    if (!adminPath && req.headers) {
      const restaurantAccessKey = getRestaurantAccessKey();
      const tableAccessKey = getTableAccessKey();
      const restaurantSlug = getRestaurantSlug();
      const tableSlug = getTableSlug();
      const restaurant = getPublicRestaurantId();
      const table = getPublicTableId();
      if (restaurantAccessKey) req.headers["x-restaurant-access-key"] = restaurantAccessKey;
      if (tableAccessKey) req.headers["x-table-access-key"] = tableAccessKey;
      if (restaurantSlug) req.headers["x-restaurant-slug"] = restaurantSlug;
      if (tableSlug) req.headers["x-table-slug"] = tableSlug;
      if (restaurant) req.headers["x-restaurant-id"] = restaurant;
      if (table) req.headers["x-table-id"] = table;
    }

    return req;
  },
  (error) => Promise.reject(error)
);

// ⚠️ Global response error handler
API.interceptors.response.use(
  (response) => response,
  (error: any) => {
    // Handle unauthorized (token expired, etc.)
    if (error.response?.status === 401) {
      console.warn("Unauthorized - logging out");

      const url = error.config?.url || "";
      const adminPath = /^\/?(admin|admin-orders|staff|analytics|inventory|superadmin)\b/.test(url);

      if (adminPath) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/admin/login";
      } else {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerUser");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;
