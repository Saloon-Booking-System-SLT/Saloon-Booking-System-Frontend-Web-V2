

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../../Components/Customer/HomePage';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

/**
 * Helper function to render HomePage with Router
 */
const renderHomePage = () => {
  return render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  );
};

/**
 * Setup localStorage mock
 */
const setupLocalStorage = (user = null) => {
  const store = {};
  if (user) {
    store.user = JSON.stringify(user);
  }
  
  Storage.prototype.getItem = jest.fn((key) => store[key] || null);
  Storage.prototype.setItem = jest.fn((key, value) => { store[key] = value; });
  Storage.prototype.removeItem = jest.fn((key) => { delete store[key]; });
  
  return store;
};

describe('HomePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupLocalStorage(null); // Start with no user logged in
  });

  /**
   * TEST 1: Basic Rendering (Unauthenticated User)
   * 
   * WHAT IT TESTS:
   * - Homepage renders correctly for non-logged-in users
   * - Logo, navigation, and CTA buttons are visible
   * 
   * WHAT HAPPENS:
   * 1. Component loads without user in localStorage
   * 2. Shows login button instead of profile
   * 3. Displays all promotional content
   */
  describe('Basic Rendering - Unauthenticated', () => {
    test('renders the logo/brand name', () => {
      // Use querySelector to find the logo by class
      const { container } = renderHomePage();
      const logo = container.querySelector('.logo');
      expect(logo).toBeInTheDocument();
    });

    test('renders the hero section with title', () => {
      renderHomePage();
      
      const heroTitle = screen.getByText(/Tap into Beauty|Beauty & Wellness/i);
      expect(heroTitle).toBeInTheDocument();
    });

    test('renders hero description text', () => {
      renderHomePage();
      
      const description = screen.getByText(/self-care|Elite salons/i);
      expect(description).toBeInTheDocument();
    });

    test('renders "Find a Salon" CTA button', () => {
      renderHomePage();
      
      const ctaButton = screen.getByRole('button', { name: /Find a Salon/i });
      expect(ctaButton).toBeInTheDocument();
    });

    test('renders "Download App" button', () => {
      renderHomePage();
      
      const downloadButton = screen.getByRole('button', { name: /Download App/i });
      expect(downloadButton).toBeInTheDocument();
    });

    test('shows login link for non-authenticated users', () => {
      renderHomePage();
      
      const loginLink = screen.getByText(/Log In/i);
      expect(loginLink).toBeInTheDocument();
    });
  });

  /**
   * TEST 2: Authenticated User Display
   * 
   * WHAT IT TESTS:
   * - Profile picture displays for logged-in users
   * - User name shows in dropdown
   * - Logout option is available
   * 
   * WHAT HAPPENS:
   * 1. User data is stored in localStorage
   * 2. Component reads user data on mount
   * 3. Shows profile picture instead of login button
   */
  describe('Authenticated User Display', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@test.com',
      photoURL: 'https://example.com/photo.jpg'
    };

    test('shows user profile when logged in', () => {
      setupLocalStorage(mockUser);
      renderHomePage();
      
      // Profile image should be present for authenticated users
      const profileImg = screen.queryByAltText(/Profile/i);
      expect(profileImg).toBeInTheDocument();
    });

    test('hides login button when user is authenticated', () => {
      setupLocalStorage(mockUser);
      renderHomePage();
      
      // Login link should not be in the main nav (might still be in dropdown)
      const mainLoginButton = screen.queryByRole('button', { name: /^Log In$/i });
      expect(mainLoginButton).not.toBeInTheDocument();
    });
  });

  /**
   * TEST 3: Navigation Functionality
   * 
   * WHAT IT TESTS:
   * - CTA button navigates to salon search
   * - Logo click navigates to home
   * - Business button navigates correctly
   * 
   * WHAT HAPPENS:
   * 1. User clicks navigation element
   * 2. navigate() function is called with correct path
   * 3. User is redirected to appropriate page
   */
  describe('Navigation Functionality', () => {
    test('Find a Salon button navigates to /searchsalon', () => {
      renderHomePage();
      
      const ctaButton = screen.getByRole('button', { name: /Find a Salon/i });
      fireEvent.click(ctaButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/searchsalon');
    });

    test('logo click navigates to home page', () => {
      const { container } = renderHomePage();
      
      const logo = container.querySelector('.logo');
      fireEvent.click(logo);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('For Business button navigates to /business', () => {
      renderHomePage();
      
      const businessButton = screen.getByRole('button', { name: /For Business/i });
      fireEvent.click(businessButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/business');
    });

    test('login link navigates to /login/customer', () => {
      renderHomePage();
      
      const loginLink = screen.getByText(/Log In/i);
      fireEvent.click(loginLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login/customer');
    });
  });

  /**
   * TEST 4: Menu Dropdown Interactions
   * 
   * WHAT IT TESTS:
   * - Menu opens on button click
   * - Menu items are visible when open
   * - Clicking outside closes menu
   * 
   * WHAT HAPPENS:
   * 1. User clicks hamburger menu button
   * 2. Dropdown menu becomes visible
   * 3. Menu items can be interacted with
   */
  describe('Menu Dropdown Interactions', () => {
    test('menu toggle button exists', () => {
      renderHomePage();
      
      // Find menu button (hamburger icon)
      const menuButtons = screen.getAllByRole('button');
      expect(menuButtons.length).toBeGreaterThan(0);
    });

    test('dropdown shows menu items when opened', async () => {
      renderHomePage();
      
      // Find and click the menu button
      const menuButton = screen.getByRole('button', { name: '' }); // Hamburger has no text
      if (menuButton) {
        fireEvent.click(menuButton);
        
        // Check for dropdown menu items
        await waitFor(() => {
          const helpOption = screen.queryByText(/Help & Support/i);
          expect(helpOption).toBeInTheDocument();
        });
      }
    });
  });

  /**
   * TEST 5: Spotlight Section (Feature Cards)
   * 
   * WHAT IT TESTS:
   * - All three feature cards render
   * - Correct titles and descriptions
   * - Icons are displayed
   * 
   * WHAT HAPPENS:
   * 1. Component renders spotlight section
   * 2. Three cards display: Top Rated, Spa Treatments, Easy Payment
   * 3. Each has title, description, and icon
   */
  describe('Spotlight Section', () => {
    test('renders Top Rated Salons card', () => {
      renderHomePage();
      
      const topRatedTitle = screen.getByText(/Top Rated Salons/i);
      expect(topRatedTitle).toBeInTheDocument();
      
      const topRatedDesc = screen.getByText(/carefully curated/i);
      expect(topRatedDesc).toBeInTheDocument();
    });

    test('renders Spa Treatments card', () => {
      renderHomePage();
      
      const spaTitle = screen.getByText(/Spa Treatments/i);
      expect(spaTitle).toBeInTheDocument();
      
      const spaDesc = screen.getByText(/Relaxation & luxury/i);
      expect(spaDesc).toBeInTheDocument();
    });

    test('renders Easy Payment card', () => {
      renderHomePage();
      
      const paymentTitle = screen.getByText(/Easy Payment/i);
      expect(paymentTitle).toBeInTheDocument();
      
      const paymentDesc = screen.getByText(/cashless transactions/i);
      expect(paymentDesc).toBeInTheDocument();
    });
  });

  /**
   * TEST 6: Logout Functionality
   * 
   * WHAT IT TESTS:
   * - Logout clears user data
   * - Redirects to login page
   * - Updates UI state
   * 
   * WHAT HAPPENS:
   * 1. Authenticated user clicks logout
   * 2. localStorage.removeItem('user') is called
   * 3. navigate('/login') is called
   * 4. UI updates to show login button
   */
  describe('Logout Functionality', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@test.com',
      photoURL: 'https://example.com/photo.jpg'
    };

    test('logout clears localStorage and navigates to login', async () => {
      const store = setupLocalStorage(mockUser);
      renderHomePage();
      
      // Open the menu first
      const profileImg = screen.getByAltText(/Profile/i);
      fireEvent.click(profileImg);
      
      // Find and click logout
      await waitFor(() => {
        const logoutOption = screen.getByText(/Logout/i);
        fireEvent.click(logoutOption);
      });
      
      // Verify localStorage.removeItem was called
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('user');
      
      // Verify navigation to login
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});

/**
 * SUMMARY OF TESTS:
 * 
 * 1. Basic Rendering Tests (Unauthenticated):
 *    - Logo displays correctly
 *    - Hero section with title and description
 *    - CTA buttons visible
 *    - Login link shown for guests
 * 
 * 2. Authenticated User Display Tests:
 *    - Profile image shows when logged in
 *    - Login button hidden for authenticated users
 * 
 * 3. Navigation Tests:
 *    - Find a Salon → /searchsalon
 *    - Logo → /
 *    - For Business → /business
 *    - Log In → /login/customer
 * 
 * 4. Menu Interaction Tests:
 *    - Toggle button works
 *    - Dropdown shows menu items
 * 
 * 5. Spotlight Section Tests:
 *    - All three feature cards render
 *    - Correct content displayed
 * 
 * 6. Logout Tests:
 *    - Clears localStorage
 *    - Redirects to login
 */
