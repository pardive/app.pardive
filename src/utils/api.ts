import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "/api", // talk only to Next.js APIs
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");

  // ✅ ONLY ONE HEADER, CLEAN
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
