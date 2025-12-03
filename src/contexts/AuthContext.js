// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Listen to Firebase auth state changes (for customers)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Firebase auth state changed:', {
        hasFirebaseUser: !!firebaseUser,
        email: firebaseUser?.email,
        uid: firebaseUser?.uid
      });
      setFirebaseUser(firebaseUser);
    });

    return unsubscribe;
  }, []);

  // Check for existing backend token and user data on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        const salonData = localStorage.getItem('salonUser');
        
        console.log('AuthContext: Checking stored data', {
          hasToken: !!storedToken,
          hasUserData: !!userData,
          hasSalonData: !!salonData,
          hasFirebaseUser: !!firebaseUser
        });
        
        // Priority 1: Salon owner authentication (backend)
        if (storedToken && salonData) {
          try {
            const parsedSalonData = JSON.parse(salonData);
            if (parsedSalonData && parsedSalonData.role === 'owner') {
              console.log('AuthContext: Restoring salon owner session');
              setToken(storedToken);
              setUser(parsedSalonData);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('AuthContext: Failed to parse salon data', e);
            localStorage.removeItem('salonUser');
          }
        }
        
        // Priority 2: Standard backend user authentication
        if (storedToken && userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            if (parsedUserData) {
              console.log('AuthContext: Restoring backend user session');
              setToken(storedToken);
              setUser(parsedUserData);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('AuthContext: Failed to parse user data', e);
            localStorage.removeItem('user');
          }
        }
        
        // Priority 3: Firebase user (customers) - will be handled when firebaseUser changes
        if (firebaseUser) {
          console.log('AuthContext: Using Firebase user session');
          // Firebase user will be converted to our user format when needed
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            role: 'customer',
            photoURL: firebaseUser.photoURL
          });
        }
        
      } catch (error) {
        console.error('AuthContext: Error during session restore', error);
      }
      setLoading(false);
    };

    // Wait a bit for Firebase to initialize
    setTimeout(restoreSession, 100);
  }, [firebaseUser]);

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

  const logout = async () => {
    try {
      // Sign out from Firebase if user was signed in with Firebase
      if (firebaseUser) {
        await signOut(auth);
        console.log('AuthContext: Firebase logout successful');
      }
      
      // Clear all localStorage items
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('salonUser');
      
      // Clear state
      setToken(null);
      setUser(null);
      setFirebaseUser(null);
      
      console.log('AuthContext: Full logout completed');
    } catch (error) {
      console.error('AuthContext: Logout error', error);
    }
  };

  const hasRole = (requiredRole) => {
    return user?.role === requiredRole;
  };

  const hasAnyRole = (requiredRoles) => {
    return requiredRoles.includes(user?.role);
  };

  const value = {
    user,
    token,
    firebaseUser,
    login,
    logout,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user && (!!token || !!firebaseUser),
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};