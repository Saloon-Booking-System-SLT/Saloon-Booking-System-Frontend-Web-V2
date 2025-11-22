// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const UPLOADS_URL = process.env.REACT_APP_API_URL?.replace('/api', '/uploads') || 'http://localhost:5000/uploads';
export const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';