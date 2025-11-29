import axios from "axios";

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
  
  // Fallback to the known backend URL
  return "https://saloon-booking-system-backend-v2.onrender.com/api";
};

const instance = axios.create({
  baseURL: getApiUrl(),
  withCredentials: false, // Set to false for hosted environments to avoid CORS issues
  timeout: 45000, // 45 second timeout for slow Render cold starts
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

console.log('Axios instance created with baseURL:', getApiUrl());

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
    
    // Handle CORS and network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('❌ Network Error - Backend might be sleeping or unreachable');
      
      // For Render, try to wake up the service with a simple request
      if (error.config?.url && !error.config?._retry) {
        console.log('🔄 Attempting to wake up backend service...');
        try {
          // Make a simple health check request to wake up Render
          await fetch(getApiUrl().replace('/api', '/health'), { 
            method: 'GET',
            mode: 'cors' 
          });
          
          // Retry the original request after a delay
          await new Promise(resolve => setTimeout(resolve, 3000));
          error.config._retry = true;
          return instance(error.config);
        } catch (wakeUpError) {
          console.error('Failed to wake up backend:', wakeUpError);
        }
      }
    }
    
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

export default instance;