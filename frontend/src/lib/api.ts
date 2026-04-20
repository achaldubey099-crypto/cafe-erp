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
  : "";

const API = axios.create({
  baseURL: normalizedApiOrigin ? `${normalizedApiOrigin}/api` : "/api",
  withCredentials: true,
});

const ADMIN_PATH_PATTERN = /^\/?(admin|admin-orders|staff|analytics|inventory|superadmin)\b/;
const ADMIN_SHARED_PATHS = [/^\/?menu\b/, /^\/?orders\b/];

const isAdminShellPath = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return /^\/(admin|superadmin)(\/|$)/.test(window.location.pathname);
};

const shouldUseAdminSession = (url: string) => {
  if (ADMIN_PATH_PATTERN.test(url)) {
    return true;
  }

  return isAdminShellPath() && ADMIN_SHARED_PATHS.some((pattern) => pattern.test(url));
};

API.interceptors.request.use(
  (req: any) => {
    const url = req.url || "";
    const useAdminSession = shouldUseAdminSession(url);
    const token = useAdminSession
      ? localStorage.getItem("token")
      : localStorage.getItem("customerToken") || localStorage.getItem("token");

    if (token && req.headers) {
      req.headers.Authorization = `Bearer ${token}`;
    }

    if (!useAdminSession && req.headers) {
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

API.interceptors.response.use(
  (response) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      const useAdminSession = shouldUseAdminSession(url);

      if (useAdminSession) {
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
