import axios from "axios";

// Backend URL - SLT VMS
const PRODUCTION_BACKEND_URL = "https://dpdlab1.slt.lk:8447/salon-api/api";

// Determine the API URL based on environment
const getApiUrl = () => {
  // Check if we're in development (localhost)
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    return "http://localhost:5000/api";
  }
  
  // For production/hosted environments
  // Check if REACT_APP_API_URL is set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Return SLT VMS backend URL
  return PRODUCTION_BACKEND_URL;
};

// Test backend connectivity
const testBackend = async (url) => {
  try {
    console.log(`Testing backend: ${url}`);
    const response = await fetch(url.replace('/api', '/health'), {
      method: 'GET',
      mode: 'cors',
      timeout: 10000
    });
    
    if (response.ok) {
      console.log(`✅ Backend working: ${url}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Backend failed: ${url}`, error.message);
  }
  return false;
};

// Initialize with working backend
let workingBackendUrl = getApiUrl();

const instance = axios.create({
  baseURL: workingBackendUrl,
  withCredentials: false,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

console.log('Axios instance created with baseURL:', workingBackendUrl);

// Test backend connectivity on initialization (only in production)
const initializeBackend = async () => {
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  if (!isDevelopment) {
    await testBackend(PRODUCTION_BACKEND_URL);
  }
};

// Add request interceptor to attach token automatically
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
instance.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('salonUser');
      
      // Only redirect if we're not already on a login page
      if (!window.location.pathname.includes('Login')) {
        window.location.href = '/OwnerLogin';
      }
    }
    return Promise.reject(error);
  }
);

// Initialize backend connectivity check (only in production)
initializeBackend();

export default instance;