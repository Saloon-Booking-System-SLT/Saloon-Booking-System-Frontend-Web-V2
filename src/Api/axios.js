//
import axios from "axios";

// Use environment variable or fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:10000/api";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

console.log("Axios instance created with baseURL:", API_URL);

// Add request interceptor to attach token automatically
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `API Request: ${config.method?.toUpperCase()} ${config.url}`,
    );
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor for better error handling
instance.interceptors.response.use(
  (response) => {
    console.log(
      `API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`,
    );
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    console.error("Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
    });

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("salonUser");

      const currentPath = window.location.pathname.toLowerCase();

      // Only redirect if we're not already on a login page
      if (!currentPath.includes("login")) {
        if (currentPath.includes("admin")) {
          window.location.href = "/admin-login";
        } else if (currentPath.includes("dashboard") || currentPath.includes("services") || currentPath.includes("professionals") || currentPath.includes("calendar")) {
          window.location.href = "/OwnerLogin";
        } else {
          window.location.href = "/login/customer";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default instance;
