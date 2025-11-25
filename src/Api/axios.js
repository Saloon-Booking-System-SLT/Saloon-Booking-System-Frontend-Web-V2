import axios from "axios";

const instance = axios.create({
  // Replace localhost with your hosted backend URL
  baseURL: "https://saloon-booking-system-backend-v2.onrender.com/api", 
  withCredentials: true,
});

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
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin-login';
    }
    return Promise.reject(error);
  }
);

export default instance;