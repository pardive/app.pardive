import axios from "axios";
import Cookies from "js-cookie";

// Dynamically choose base URL based on env
const getBaseUrl = () => {
  const env = process.env.NEXT_PUBLIC_APP_ENV;

  if (env === "production") {
    return "https://pi.saltifysaas.com";
  }

  // Default to staging
  return "https://pi.demo.saltifysaas.com";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // ✅ allows sending cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Attach JWT from cookies
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
