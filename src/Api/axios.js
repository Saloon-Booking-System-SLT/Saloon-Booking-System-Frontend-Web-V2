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
  timeout: 30000, // 30 second timeout
});

console.log('Axios instance created with baseURL:', getApiUrl());

// Add request interceptor to attach token automatically
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
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