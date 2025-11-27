// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://saloon-booking-system-backend-v2.onrender.com/api';
export const UPLOADS_URL = process.env.REACT_APP_API_URL?.replace('/api', '/uploads') || 'https://saloon-booking-system-backend-v2.onrender.com/uploads';
export const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://saloon-booking-system-backend-v2.onrender.com';