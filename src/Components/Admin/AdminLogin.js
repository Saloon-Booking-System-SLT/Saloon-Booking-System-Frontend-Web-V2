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

  // Handle redirect result on component mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;

          const response = await axios.post('/admin/google-login', {
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          });

          if (response.data.success) {
            const { token, admin } = response.data;

            await login(token, {
              ...admin,
              role: 'admin',
              id: admin.id || 'admin'
            });

            setTimeout(() => {
              navigate("/admin-dashboard");
            }, 200);
          }
        }
      } catch (error) {
        console.error("Redirect result error:", error);
      }
    };

    handleRedirectResult();
  }, [navigate, login]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      try {
        // Try popup method first
        const result = await signInWithPopup(auth, googleProvider);
        await processGoogleAuthResult(result);
      } catch (popupError) {
        console.log("Popup failed, trying redirect method...", popupError);

        // Fallback to redirect method if popup fails
        await signInWithRedirect(auth, googleProvider);
        // The redirect will handle the auth result
        return;
      }
    } catch (err) {
      console.error("Google login failed:", err);
      if (err.response?.data?.message) {
        setError(`Google login failed: ${err.response.data.message}`);
      } else if (err.message) {
        setError(`Google login failed: ${err.message}`);
      } else {
        setError("Google login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Support for legacy 'admin' / 'admin123' without Firebase
    if (email === 'admin' || !email.includes('@')) {
      try {
        const response = await axios.post('/admin/login', {
          username: email,
          password: password
        });

        if (response.data.success) {
          const { token, admin } = response.data;
          await login(token, {
            ...admin,
            role: 'admin',
            id: admin.id || 'admin'
          });
          navigate('/admin-dashboard');
          return;
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Legacy login endpoint /admin/login not found. Please deploy backend.');
        } else {
          setError('Invalid admin credentials.');
        }
        setLoading(false);
        return;
      }
    }

    // Standard Firebase email/password
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await processGoogleAuthResult(result);
    } catch (err) {
      console.error("Email login failed:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const processGoogleAuthResult = async (result) => {
    try {
      const user = result.user;

      const response = await axios.post('/admin/google-login', {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });

      if (response.data.success) {
        const { token, admin } = response.data;

        await login(token, {
          ...admin,
          role: 'admin',
          id: admin.id || 'admin'
        });

        navigate('/admin-dashboard');
      }
    } catch (err) {
      console.error('Admin login error:', err);

      if (err.response?.status === 404) {
        setError(
          <>
            Backend endpoint <b>/admin/google-login</b> not found (404).
            <br />
            Please make sure you have deployed your updated backend to Vercel.
          </>
        );
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Unauthorized access. You are not an administrator.');
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

          <div className="mt-8 flex items-center text-gray-400">
            <div className="border-t border-gray-300 flex-grow"></div>
            <span className="px-3 text-sm">OR</span>
            <div className="border-t border-gray-300 flex-grow"></div>
          </div>

          <div className="space-y-6 mt-8">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`w-full py-4 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-3 border shadow-sm ${loading
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-md hover:border-gray-400"
                }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {loading ? "Authenticating component..." : "Sign In with Google"}
            </button>
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