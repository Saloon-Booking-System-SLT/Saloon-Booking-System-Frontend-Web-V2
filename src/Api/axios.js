import axios from "axios";

// Determine the primary API URL based on environment variables or local host
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  const isDevelopment =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isDevelopment) {
    return "http://localhost:5000/api";
  }

  return "https://saloon-booking-system-backend-v2.onrender.com/api";
};

// Get list of backend URLs to try, with the primary one first
const getBackendUrlsToTry = () => {
  const urls = [getApiUrl()];
  const failovers = [
    "https://saloon-booking-system-backend-v2.onrender.com/api",
    "https://salon-backend-production.railway.app/api",
  ];

  for (const url of failovers) {
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }
  return urls;
};

// Test backend connectivity and switch to working URL
const findWorkingBackend = async () => {
  const urls = getBackendUrlsToTry();
  for (const url of urls) {
    try {
      console.log(`Testing backend: ${url}`);
      const healthUrl = url.endsWith("/api")
        ? url.replace(/\/api$/, "/health")
        : `${url}/health`;
      const response = await fetch(healthUrl, {
        method: "GET",
        mode: "cors",
        timeout: 10000,
      });

      if (response.ok) {
        console.log(`✅ Backend working: ${url}`);
        return url;
      }
    } catch (error) {
      console.log(`❌ Backend failed: ${url}`, error.message);
    }
  }

  // If all fail, return primary URL
  console.log("All backends failed, using primary URL");
  return urls[0];
};

// Initialize with primary backend
let workingBackendUrl = getApiUrl();

const instance = axios.create({
  baseURL: workingBackendUrl,
  withCredentials: false,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

console.log("Axios instance created with baseURL:", workingBackendUrl);

// Update instance baseURL when backend changes
const updateBackendUrl = async () => {
  const newUrl = await findWorkingBackend();
  if (newUrl !== workingBackendUrl) {
    workingBackendUrl = newUrl;
    instance.defaults.baseURL = newUrl;
    console.log("🔄 Backend URL updated to:", newUrl);
  }
};

// Add request interceptor to attach token automatically
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`,
    );
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor for better error handling with failover
instance.interceptors.response.use(
  (response) => {
    console.log(
      `✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`,
    );
    return response;
  },
  async (error) => {
    console.error("API Error:", error.response?.data || error.message);
    console.error("Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
    });

    // Handle CORS and network errors with automatic failover
    if (
      error.code === "ERR_NETWORK" ||
      error.message === "Network Error" ||
      error.message.includes("CORS") ||
      error.response?.status >= 500
    ) {
      console.error("❌ Backend Error - Attempting failover...");

      if (!error.config?._retry) {
        error.config._retry = true;

        // Try to find a working backend
        const newBackendUrl = await findWorkingBackend();

        // Update the config with new backend URL
        error.config.baseURL = newBackendUrl;
        instance.defaults.baseURL = newBackendUrl;

        console.log("🔄 Retrying request with new backend:", newBackendUrl);

        // Retry the original request
        return instance(error.config);
      }
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("salonUser");

      // Only redirect if we're not already on a login page
      if (!window.location.pathname.includes("Login")) {
        window.location.href = "/OwnerLogin";
      }
    }
    return Promise.reject(error);
  },
);

// Initialize backend connectivity check
updateBackendUrl();

export default instance;
