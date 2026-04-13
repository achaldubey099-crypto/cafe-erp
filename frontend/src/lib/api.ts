import axios, { InternalAxiosRequestConfig } from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach token
API.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");

  if (token && req.headers) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;