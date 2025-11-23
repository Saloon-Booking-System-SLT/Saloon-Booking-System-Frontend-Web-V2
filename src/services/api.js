const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export { API_BASE_URL };

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// ========== DASHBOARD ==========
export const getDashboardStats = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json();
};

// ========== CUSTOMERS ==========
export const getCustomers = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/customers`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
};

// ========== APPOINTMENTS ==========
export const getAppointments = async (date = null) => {
  const url = date 
    ? `${API_BASE_URL}/admin/appointments?date=${date}`
    : `${API_BASE_URL}/admin/appointments`;
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch appointments');
  return response.json();
};

// ========== FEEDBACK ==========
export const getFeedbacks = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/feedbacks`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch feedbacks');
  return response.json();
};

export const updateFeedbackStatus = async (feedbackId, status) => {
  const response = await fetch(`${API_BASE_URL}/admin/feedbacks/${feedbackId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to update feedback status');
  return response.json();
};

// ========== PROMOTIONS ==========
export const getPromotions = async () => {
  const response = await fetch(`${API_BASE_URL}/promotions`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch promotions');
  return response.json();
};

export const createPromotion = async (promotionData) => {
  const response = await fetch(`${API_BASE_URL}/promotions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(promotionData)
  });
  if (!response.ok) throw new Error('Failed to create promotion');
  return response.json();
};

export const updatePromotion = async (promotionId, promotionData) => {
  const response = await fetch(`${API_BASE_URL}/promotions/${promotionId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(promotionData)
  });
  if (!response.ok) throw new Error('Failed to update promotion');
  return response.json();
};

export const deletePromotion = async (promotionId) => {
  const response = await fetch(`${API_BASE_URL}/promotions/${promotionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete promotion');
  return response.json();
};

// ========== LOYALTY ==========
export const getLoyaltyConfig = async () => {
  const response = await fetch(`${API_BASE_URL}/loyalty/config`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch loyalty config');
  return response.json();
};

export const updateLoyaltyConfig = async (configData) => {
  const response = await fetch(`${API_BASE_URL}/loyalty/config`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(configData)
  });
  if (!response.ok) throw new Error('Failed to update loyalty config');
  return response.json();
};

export const getLoyaltyStats = async () => {
  const response = await fetch(`${API_BASE_URL}/loyalty/stats`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch loyalty stats');
  return response.json();
};

export const getTopLoyaltyCustomers = async () => {
  const response = await fetch(`${API_BASE_URL}/loyalty/customers/top`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch top customers');
  return response.json();
};

export const managePoints = async (email, points, action) => {
  const response = await fetch(`${API_BASE_URL}/loyalty/points`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, points, action })
  });
  if (!response.ok) throw new Error('Failed to manage points');
  return response.json();
};

// ========== PAYMENTS ==========
export const getPayments = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE_URL}/payments?${params}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch payments');
  return response.json();
};

export const getPaymentStats = async () => {
  const response = await fetch(`${API_BASE_URL}/payments/stats`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch payment stats');
  return response.json();
};

export const createPayment = async (paymentData) => {
  const response = await fetch(`${API_BASE_URL}/payments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(paymentData)
  });
  if (!response.ok) throw new Error('Failed to create payment');
  return response.json();
};

export const updatePaymentStatus = async (paymentId, status) => {
  const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to update payment status');
  return response.json();
};