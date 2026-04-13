/// <reference types="vite/client" />
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true, // 🔥 important for CORS & cookies (future-ready)
});

// 🔐 Attach token automatically
API.interceptors.request.use(
  (req: any) => {
    const token = localStorage.getItem("token");

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

      // remove invalid token
      localStorage.removeItem("token");

      // optional: redirect to login
      window.location.href = "/admin/login";
    }

    return Promise.reject(error);
  }
);

export default API;