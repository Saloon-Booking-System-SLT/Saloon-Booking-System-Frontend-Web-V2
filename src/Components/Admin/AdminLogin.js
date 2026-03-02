import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import axiosInstance from "../../Api/axios";
import { EnvelopeIcon, LockClosedIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import loginImage from "../../Assets/login-image.jpg";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log('Attempting Firebase admin login...');
      
      // Step 1: Firebase email/password authentication
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      console.log('Firebase authentication successful:', { email: user.email, uid: user.uid });
      
      // Step 2: Verify this is an admin email
      if (user.email !== 'admin@saloonbooking.lk') {
        setError('Access denied. This email is not authorized for admin access.');
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Step 3: Get backend JWT token using Firebase info
      try {
        const backendResponse = await axiosInstance.post('/admin/firebase-login', {
          name: 'Admin',
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid
        });

        if (backendResponse.data.success) {
          const { token, admin } = backendResponse.data;
          
          // Prepare admin user data
          const adminUserData = {
            ...admin,
            role: 'admin',
            id: admin.id || 'admin',
            uid: user.uid
          };

          console.log('Got backend token, saving admin user data:', adminUserData);

          // Save to localStorage (backend token, not Firebase token)
          localStorage.setItem('token', token);
          localStorage.setItem('userRole', 'admin');
          localStorage.setItem('userEmail', admin.email);
          localStorage.setItem('userName', admin.username || admin.name);
          localStorage.setItem('userId', admin.id || 'admin');

          console.log('Saved admin session to localStorage');

          // Call the auth context login
          login(token, adminUserData);

          console.log('Navigating to admin dashboard...');
          navigate("/admin-dashboard");
        } else {
          throw new Error('Backend authentication failed');
        }
      } catch (backendError) {
        console.error('Backend authentication error:', backendError);
        if (backendError.response?.status === 404) {
          setError('Admin authentication service is not available. Please contact support.');
        } else {
          setError('Failed to authenticate with backend. Please try again.');
        }
        await auth.signOut(); // Sign out from Firebase if backend fails
      }
      
    } catch (err) {
      console.error("Firebase login error:", err);
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid admin email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white shadow-2xl z-10">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-xl mb-6 shadow-lg">
              <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
            <p className="text-gray-500 text-sm md:text-base">
              Sign in with your administrator credentials to access the management dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm outline-none bg-gray-50 focus:bg-white"
                  placeholder="Enter your admin email"
                  value={formData.email}
                  onChange={handleChange}
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
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm outline-none bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all duration-300 ${
                loading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0'
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
              Protected area. Unauthorized access is strictly prohibited.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image Background */}
      <div className="hidden md:block flex-1 relative bg-gray-900 overflow-hidden">
        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-gray-900/40 mix-blend-multiply z-10"></div>
        <img
          src={loginImage}
          alt="Admin Dashboard Abstract"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-12">
          <div className="backdrop-blur-md bg-white/10 p-8 rounded-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-2">Admin Control Center</h2>
            <p className="text-gray-200">
              Manage salons, monitor bookings, and oversee operations all in one unified platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;