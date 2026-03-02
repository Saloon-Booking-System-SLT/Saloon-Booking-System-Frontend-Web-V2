import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../Api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword } from 'firebase/auth';
import { ShieldCheckIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import loginImage from '../../Assets/login-image.jpg';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // No redirect result check needed for Email/Password
  useEffect(() => {
    // Initial loading or other setup if needed
  }, []);

  // Google login removed as per request

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Firebase email/password authentication
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await processFirebaseResult(result);
    } catch (err) {
      console.error("Admin login failed:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid admin email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const processFirebaseResult = async (result) => {
    try {
      const user = result.user;

      // TEMPORARY: Use regular login until Firebase endpoint is deployed
      const response = await axios.post('/admin/login', {
        email: user.email,
        password: 'ABcd123#', // Using the admin password for now
      });

      if (response.data.success) {
        const { token, admin } = response.data;

        await login(token, {
          ...admin,
          role: 'admin',
          id: 'admin'
        });

        navigate('/admin-dashboard');
      }
    } catch (err) {
      console.error('Admin verification error:', err);

      if (err.response?.status === 404) {
        setError('Backend endpoint not found. Please check server status.');
      } else if (err.response?.status === 401) {
        setError('Access Denied: Invalid admin credentials or unauthorized access.');
        // Sign out from Firebase if not authorized in backend
        await auth.signOut();
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please check your internet connection.');
      } else {
        setError(err.response?.data?.message || 'Verification failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white shadow-2xl z-10">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center justify-center p-3 bg-dark-900 rounded-xl mb-6 shadow-lg">
              <ShieldCheckIcon className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Admin Portal</h1>
            <p className="text-gray-500 text-sm md:text-base">Sign in with your administrator credentials to access the management dashboard.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors shadow-sm outline-none bg-gray-50 focus:bg-white"
                  placeholder="admin@saloonbooking.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors shadow-sm outline-none bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm shadow-lg shadow-primary-600/30 transition-all duration-300 ${loading
                ? 'bg-primary-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5 active:translate-y-0'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Authentication powered by Firebase.
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Protected area. Unauthorized access is strictly prohibited.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image Background */}
      <div className="hidden md:block flex-1 relative bg-dark-900 overflow-hidden">
        {/* Dark overlay for better text contrast if we had text over it */}
        <div className="absolute inset-0 bg-dark-900/40 mix-blend-multiply z-10"></div>
        <img
          src={loginImage}
          alt="Admin Dashboard Abstract"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-12">
          <div className="backdrop-blur-md bg-white/10 p-8 rounded-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-2">Maintain Control</h2>
            <p className="text-gray-200">Manage salons, monitor bookings, and oversee operations all in one unified platform.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;