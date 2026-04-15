/// <reference types="vite/client" />
import axios from "axios";

const envApi = import.meta.env.VITE_API_URL as string | undefined;
let baseURL: string;

if (envApi && envApi.length) {
  baseURL = envApi.replace(/\/$/, "") + "/api";
} else if (typeof window !== "undefined") {
  const hostname = window.location.hostname || "localhost";
  const protocol = window.location.protocol && window.location.protocol.startsWith("https") ? "https" : "http";
  baseURL = `${protocol}://${hostname}:5001/api`;
} else {
  baseURL = "http://localhost:5001/api";
}

const API = axios.create({
  baseURL,
  withCredentials: true, // 🔥 important for CORS & cookies (future-ready)
});

// 🔐 Attach token automatically
API.interceptors.request.use(
  (req: any) => {
    const url = req.url || "";
    const adminPath = /^\/?(admin|admin-orders|staff|analytics|inventory)\b/.test(url);
    const token = adminPath
      ? localStorage.getItem("token")
      : localStorage.getItem("customerToken") || localStorage.getItem("token");

    if (token && req.headers) {
      req.headers.Authorization = `Bearer ${token}`;
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
      const adminPath = /^\/?(admin|admin-orders|staff|analytics|inventory)\b/.test(url);

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
