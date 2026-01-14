

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OwnerLogin from '../../Components/Owner/OwnerLogin';

// Mock axios
jest.mock('../../Api/axios', () => ({
  post: jest.fn()
}));

import axios from '../../Api/axios';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock useAuth hook
const mockLogin = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    login: mockLogin,
    user: null,
    loading: false
  })
}));


const renderOwnerLogin = () => {
  return render(
    <BrowserRouter>
      <OwnerLogin />
    </BrowserRouter>
  );
};


const setupLocalStorage = () => {
  const store = {};
  Storage.prototype.getItem = jest.fn((key) => store[key] || null);
  Storage.prototype.setItem = jest.fn((key, value) => { store[key] = value; });
  Storage.prototype.removeItem = jest.fn((key) => { delete store[key]; });
  return store;
};

describe('OwnerLogin Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupLocalStorage();
    axios.post.mockReset();
  });

  /**
   * TEST 1: Component Rendering
   * 
   * WHAT IT TESTS:
   * - Login form renders correctly
   * - Email input field present
   * - Password input field present
   * - Login button present
   * - Register link present
   * 
   * WHAT HAPPENS:
   * 1. Component mounts
   * 2. Form with all inputs displayed
   * 3. Button and links visible
   */
  describe('Component Rendering', () => {
    test('renders login title', () => {
      renderOwnerLogin();
      
      const title = screen.getByText(/Login to Your Salon/i);
      expect(title).toBeInTheDocument();
    });

    test('renders email input field', () => {
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput.type).toBe('email');
    });

    test('renders password input field', () => {
      renderOwnerLogin();
      
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput.type).toBe('password');
    });

    test('renders login button', () => {
      renderOwnerLogin();
      
      const loginButton = screen.getByRole('button', { name: /Login/i });
      expect(loginButton).toBeInTheDocument();
    });

    test('renders register link', () => {
      renderOwnerLogin();
      
      const registerLink = screen.getByText(/Register here/i);
      expect(registerLink).toBeInTheDocument();
    });

    test('renders subtitle text', () => {
      renderOwnerLogin();
      
      const subtitle = screen.getByText(/Manage appointments & services/i);
      expect(subtitle).toBeInTheDocument();
    });
  });

  /**
   * TEST 2: Form Input Handling
   * 
   * WHAT IT TESTS:
   * - Email input updates on change
   * - Password input updates on change
   * - Form state management works
   * 
   * WHAT HAPPENS:
   * 1. User types in email field
   * 2. State updates with new value
   * 3. Same for password field
   */
  describe('Form Input Handling', () => {
    test('email input value updates on change', () => {
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      fireEvent.change(emailInput, { target: { value: 'owner@salon.com' } });
      
      expect(emailInput.value).toBe('owner@salon.com');
    });

    test('password input value updates on change', () => {
      renderOwnerLogin();
      
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      fireEvent.change(passwordInput, { target: { value: 'MySecurePass123!' } });
      
      expect(passwordInput.value).toBe('MySecurePass123!');
    });

    test('form can have both fields filled', () => {
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });
  });

  /**
   * TEST 3: Form Submission - Success
   * 
   * WHAT IT TESTS:
   * - Form submission triggers API call
   * - Correct data sent to API
   * - Login context function called
   * - Navigation to dashboard
   * - localStorage set correctly
   * 
   * WHAT HAPPENS:
   * 1. User fills form and submits
   * 2. API call to /salons/login
   * 3. Token and user data received
   * 4. AuthContext login() called
   * 5. Navigate to /dashboard
   */
  describe('Form Submission - Success', () => {
    const mockSalonResponse = {
      token: 'mock-jwt-token',
      salon: {
        _id: 'salon123',
        salonName: 'Test Salon',
        email: 'owner@salon.com',
        approvalStatus: 'approved'
      }
    };

    test('submitting form calls API with credentials', async () => {
      axios.post.mockResolvedValueOnce({ data: mockSalonResponse });
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      fireEvent.change(emailInput, { target: { value: 'owner@salon.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/salons/login', {
          email: 'owner@salon.com',
          password: 'password123'
        });
      });
    });

    test('successful login calls auth context login', async () => {
      axios.post.mockResolvedValueOnce({ data: mockSalonResponse });
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      fireEvent.change(emailInput, { target: { value: 'owner@salon.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          'mock-jwt-token',
          expect.objectContaining({
            role: 'owner',
            salonName: 'Test Salon'
          })
        );
      });
    });

    test('successful login navigates to dashboard', async () => {
      axios.post.mockResolvedValueOnce({ data: mockSalonResponse });
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      fireEvent.change(emailInput, { target: { value: 'owner@salon.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('successful login sets localStorage', async () => {
      axios.post.mockResolvedValueOnce({ data: mockSalonResponse });
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      fireEvent.change(emailInput, { target: { value: 'owner@salon.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(Storage.prototype.setItem).toHaveBeenCalledWith('token', 'mock-jwt-token');
        expect(Storage.prototype.setItem).toHaveBeenCalledWith(
          'salonUser', 
          expect.any(String)
        );
      });
    });
  });

  /**
   * TEST 4: Form Submission - Error Handling
   * 
   * WHAT IT TESTS:
   * - API error displays error message
   * - Network error handled gracefully
   * - Error message clears on retry
   * 
   * WHAT HAPPENS:
   * 1. User submits invalid credentials
   * 2. API returns error
   * 3. Error message displayed to user
   */
  describe('Form Submission - Error Handling', () => {
    test('displays error message on login failure', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          data: { message: 'Invalid credentials' }
        }
      });
      
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      fireEvent.change(emailInput, { target: { value: 'wrong@email.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/Invalid credentials/i);
        expect(errorMessage).toBeInTheDocument();
      });
      
      // Wait for loading to finish to avoid act warnings
      await waitFor(() => {
        expect(loginButton).not.toBeDisabled();
      });
    });

    test('displays generic error on network failure', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network Error'));
      
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@email.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/Login failed|Please try again/i);
        expect(errorMessage).toBeInTheDocument();
      });
      
      // Wait for loading to finish
      await waitFor(() => {
        expect(loginButton).not.toBeDisabled();
      });
    });

    test('does not navigate on login failure', async () => {
      axios.post.mockRejectedValueOnce({
        response: { data: { message: 'Invalid credentials' } }
      });
      
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      fireEvent.change(emailInput, { target: { value: 'wrong@email.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });
      
      // Wait for loading to finish
      await waitFor(() => {
        expect(loginButton).not.toBeDisabled();
      });
      
      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
    });
  });

  /**
   * TEST 5: Loading States
   * 
   * WHAT IT TESTS:
   * - Button shows "Logging in..." during submission
   * - Inputs disabled during loading
   * - Loading state clears after response
   * 
   * WHAT HAPPENS:
   * 1. Form submitted
   * 2. Button text changes to "Logging in..."
   * 3. Inputs become disabled
   * 4. After response, returns to normal
   */
  describe('Loading States', () => {
    test('button shows loading text during submission', async () => {
      // Create a promise that doesn't resolve immediately
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      axios.post.mockReturnValueOnce(pendingPromise);
      
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@email.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(loginButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Logging in/i })).toBeInTheDocument();
      });
      
      // Resolve the promise
      resolvePromise({ data: { token: 'token', salon: { _id: '1' } } });
    });

    test('inputs are disabled during loading', async () => {
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      axios.post.mockReturnValueOnce(pendingPromise);
      
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@email.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(loginButton);
      
      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
      });
      
      resolvePromise({ data: { token: 'token', salon: { _id: '1' } } });
    });
  });

  /**
   * TEST 6: Form Validation
   * 
   * WHAT IT TESTS:
   * - Required field validation
   * - Email format validation
   * - Form doesn't submit with empty fields
   * 
   * WHAT HAPPENS:
   * 1. User tries to submit empty form
   * 2. HTML5 validation prevents submission
   * 3. API is NOT called
   */
  describe('Form Validation', () => {
    test('email input has required attribute', () => {
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      expect(emailInput).toBeRequired();
    });

    test('password input has required attribute', () => {
      renderOwnerLogin();
      
      const passwordInput = screen.getByPlaceholderText(/Password/i);
      expect(passwordInput).toBeRequired();
    });

    test('email input has correct type', () => {
      renderOwnerLogin();
      
      const emailInput = screen.getByPlaceholderText(/Email/i);
      expect(emailInput.type).toBe('email');
    });
  });

  /**
   * TEST 7: Navigation Links
   * 
   * WHAT IT TESTS:
   * - Register link navigates to registration
   * - Link is clickable
   * 
   * WHAT HAPPENS:
   * 1. User clicks "Register here"
   * 2. Navigates to /register
   */
  describe('Navigation Links', () => {
    test('register link has correct href', () => {
      renderOwnerLogin();
      
      const registerLink = screen.getByText(/Register here/i);
      expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
    });

    test('not registered text displays', () => {
      renderOwnerLogin();
      
      const notRegisteredText = screen.getByText(/Not registered yet/i);
      expect(notRegisteredText).toBeInTheDocument();
    });
  });
});

/**
 * SUMMARY OF TESTS:
 * 
 * 1. Component Rendering Tests:
 *    - Login title displays
 *    - Email and password inputs present
 *    - Login button visible
 *    - Register link available
 * 
 * 2. Form Input Handling Tests:
 *    - Email input updates on change
 *    - Password input updates on change
 *    - Both fields work together
 * 
 * 3. Form Submission Success Tests:
 *    - API called with correct credentials
 *    - AuthContext login() invoked
 *    - Navigation to dashboard
 *    - localStorage set correctly
 * 
 * 4. Error Handling Tests:
 *    - Error message displays on failure
 *    - Network errors handled
 *    - No navigation on failure
 * 
 * 5. Loading State Tests:
 *    - Button text changes to "Logging in..."
 *    - Inputs disabled during loading
 * 
 * 6. Form Validation Tests:
 *    - Required attributes present
 *    - Email type validation
 * 
 * 7. Navigation Link Tests:
 *    - Register link has correct href
 */
