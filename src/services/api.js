import axios from '../Api/axios';

export { axios };

// ========== DASHBOARD ==========
export const getDashboardStats = async () => {
  const response = await axios.get('/admin/dashboard/stats');
  return response.data;
};

// ========== CUSTOMERS ==========
export const getCustomers = async () => {
  const response = await axios.get('/admin/customers');
  return response.data;
};

// ========== APPOINTMENTS ==========
export const getAppointments = async (date = null) => {
  const url = date ? `/admin/appointments?date=${date}` : '/admin/appointments';
  const response = await axios.get(url);
  return response.data;
};

// ========== FEEDBACK ==========
export const getFeedbacks = async () => {
  const response = await axios.get('/admin/feedbacks');
  return response.data;
};

export const updateFeedbackStatus = async (feedbackId, status) => {
  const response = await axios.patch(`/admin/feedbacks/${feedbackId}/status`, { status });
  return response.data;
};

// ========== PROMOTIONS ==========
export const getPromotions = async () => {
  const response = await axios.get('/promotions');
  return response.data;
};

export const createPromotion = async (promotionData) => {
  const response = await axios.post('/promotions', promotionData);
  return response.data;
};

export const updatePromotion = async (promotionId, promotionData) => {
  const response = await axios.put(`/promotions/${promotionId}`, promotionData);
  return response.data;
};

export const deletePromotion = async (promotionId) => {
  const response = await axios.delete(`/promotions/${promotionId}`);
  return response.data;
};

// ========== LOYALTY ==========
export const getLoyaltyConfig = async () => {
  const response = await axios.get('/loyalty/config');
  return response.data;
};

export const updateLoyaltyConfig = async (configData) => {
  const response = await axios.post('/loyalty/config', configData);
  return response.data;
};

export const getLoyaltyStats = async () => {
  const response = await axios.get('/loyalty/stats');
  return response.data;
};

export const getTopLoyaltyCustomers = async () => {
  const response = await axios.get('/loyalty/customers/top');
  return response.data;
};

export const managePoints = async (email, points, action) => {
  const response = await axios.post('/loyalty/points', { email, points, action });
  return response.data;
};

// ========== PAYMENTS ==========
export const getPayments = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`/payments?${params}`);
  return response.data;
};

export const getPaymentStats = async () => {
  const response = await axios.get('/payments/stats');
  return response.data;
};

export const createPayment = async (paymentData) => {
  const response = await axios.post('/payments', paymentData);
  return response.data;
};

export const updatePaymentStatus = async (paymentId, status) => {
  const response = await axios.patch(`/payments/${paymentId}/status`, { status });
  return response.data;
};

// ========== PAYHERE ==========
export const initiatePayHerePayment = async (paymentData) => {
  const response = await axios.post('/payments/payhere/initiate', paymentData);
  return response.data;
};