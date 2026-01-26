// Test utilities and mock functions for unit testing
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

/**
 * Custom render function that wraps components with necessary providers
 * This is essential for testing components that use React Router and AuthContext
 */
export const renderWithProviders = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Render with just Router (for components that don't need AuthContext)
 */
export const renderWithRouter = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Mock user data for customer tests
 */
export const mockCustomerUser = {
  _id: 'customer123',
  id: 'customer123',
  name: 'Test Customer',
  email: 'customer@test.com',
  phone: '+94771234567',
  photoURL: 'https://example.com/photo.jpg',
  role: 'customer',
  gender: 'male'
};

/**
 * Mock user data for owner tests
 */
export const mockOwnerUser = {
  _id: 'owner123',
  id: 'owner123',
  salonName: 'Test Salon',
  email: 'owner@test.com',
  phone: '+94777654321',
  role: 'owner',
  approvalStatus: 'approved',
  workingHours: '09:00 - 18:00',
  location: {
    district: 'Colombo',
    address: '123 Test Street'
  }
};

/**
 * Mock salon data for testing
 */
export const mockSalon = {
  _id: 'salon123',
  salonName: 'Premium Salon',
  email: 'salon@test.com',
  location: {
    district: 'Colombo',
    address: '456 Salon Street',
    coordinates: { lat: 6.9271, lng: 79.8612 }
  },
  coverImage: 'https://example.com/salon.jpg',
  rating: 4.5,
  reviewCount: 100,
  genderType: 'unisex',
  services: [
    { _id: 'service1', name: 'Haircut', price: 500, duration: 30 },
    { _id: 'service2', name: 'Shave', price: 200, duration: 15 }
  ]
};

/**
 * Mock appointment data
 */
export const mockAppointment = {
  _id: 'appointment123',
  salon: mockSalon,
  customer: mockCustomerUser,
  services: [{ name: 'Haircut', price: 500 }],
  date: '2025-12-20',
  startTime: '10:00',
  endTime: '10:30',
  status: 'confirmed',
  totalPrice: 500
};

/**
 * Setup localStorage mock
 */
export const setupLocalStorage = (userData = null, token = null) => {
  const localStorageMock = {
    store: {},
    getItem: jest.fn((key) => localStorageMock.store[key] || null),
    setItem: jest.fn((key, value) => {
      localStorageMock.store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete localStorageMock.store[key];
    }),
    clear: jest.fn(() => {
      localStorageMock.store = {};
    })
  };

  if (userData) {
    localStorageMock.store.user = JSON.stringify(userData);
  }
  if (token) {
    localStorageMock.store.token = token;
  }

  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  return localStorageMock;
};

/**
 * Mock fetch function
 */
export const mockFetch = (response, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
    })
  );
};

/**
 * Mock failed fetch function
 */
export const mockFetchError = (errorMessage = 'Network error') => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error(errorMessage))
  );
};

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Mock window.alert
 */
export const mockAlert = () => {
  window.alert = jest.fn();
  return window.alert;
};

/**
 * Mock window.confirm
 */
export const mockConfirm = (returnValue = true) => {
  window.confirm = jest.fn(() => returnValue);
  return window.confirm;
};

export default {
  renderWithProviders,
  renderWithRouter,
  mockCustomerUser,
  mockOwnerUser,
  mockSalon,
  mockAppointment,
  setupLocalStorage,
  mockFetch,
  mockFetchError,
  waitForAsync,
  mockAlert,
  mockConfirm
};
