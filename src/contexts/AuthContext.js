// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // Add token state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    try {
      const storedToken = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const salonData = localStorage.getItem('salonUser');
      
      console.log('AuthContext: Checking stored data', {
        hasToken: !!storedToken,
        hasUserData: !!userData,
        hasSalonData: !!salonData
      });
      
      if (storedToken) {
        setToken(storedToken);
        
        // Parse salon data first (for owner accounts)
        if (salonData) {
          try {
            const parsedSalonData = JSON.parse(salonData);
            if (parsedSalonData && parsedSalonData.role === 'owner') {
              console.log('AuthContext: Restoring salon user session');
              setUser(parsedSalonData);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('AuthContext: Failed to parse salon data', e);
            localStorage.removeItem('salonUser');
          }
        }
        
        // Parse standard user data
        if (userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            if (parsedUserData) {
              console.log('AuthContext: Restoring user session');
              setUser(parsedUserData);
            }
          } catch (e) {
            console.error('AuthContext: Failed to parse user data', e);
            localStorage.removeItem('user');
          }
        }
      }
    } catch (error) {
      console.error('AuthContext: Error during session restore', error);
    }
    setLoading(false);
  }, []);

  const login = (newToken, userData) => {
    try {
      console.log('AuthContext: Logging in user', {
        hasToken: !!newToken,
        userRole: userData?.role,
        userId: userData?.id || userData?._id
      });
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // For salon owners, also store in salonUser for backward compatibility
      if (userData?.role === 'owner') {
        localStorage.setItem('salonUser', JSON.stringify(userData));
      }
      
      setToken(newToken);
      setUser(userData);
      
      console.log('AuthContext: Login successful');
    } catch (error) {
      console.error('AuthContext: Login failed', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('salonUser'); // Clear salon user data too
    setToken(null);
    setUser(null);
  };

  const hasRole = (requiredRole) => {
    return user?.role === requiredRole;
  };

  const hasAnyRole = (requiredRoles) => {
    return requiredRoles.includes(user?.role);
  };

  const value = {
    user,
    token, // Export token so components can use it
    login,
    logout,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user && !!token,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};