import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import loginImage from "../../Assets/login-image.jpg";
import axiosInstance from "../../Api/axios";
import { EnvelopeIcon, LockClosedIcon, BuildingStorefrontIcon, XMarkIcon } from "@heroicons/react/24/outline";

const OwnerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
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
 console.log(' Attempting login...');
      const res = await axiosInstance.post('/salons/login', formData);

      const { token, salon } = res.data;

 console.log(' Login response:', { token: !!token, salon });

      // ✅ FIX: If approvalStatus is undefined, default to 'approved' (for backward compatibility)
      const approvalStatus = salon.approvalStatus || 'approved';

 console.log(' Approval status:', approvalStatus);

      // Check approval status
      if (approvalStatus === 'pending') {
        setError("Your salon registration is pending approval. You'll be notified once approved.");
        setLoading(false);
        return;
      }

      if (approvalStatus === 'rejected') {
        setError(`Your salon registration was rejected. Reason: ${salon.rejectionReason || 'Not specified'}`);
        setLoading(false);
        return;
      }

      // ✅ Proceed with login (approved or undefined status)
      const salonUserData = {
        ...salon,
        role: 'owner',
        id: salon._id || salon.id,
        approvalStatus: approvalStatus
      };

 console.log(' Saving salon user data:', salonUserData);

      // ✅ CRITICAL FIX: Save EVERYTHING to localStorage BEFORE calling login()
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', 'owner'); // ← THIS IS THE CRITICAL LINE!
      localStorage.setItem('userEmail', salon.email);
      localStorage.setItem('userName', salon.name);
      localStorage.setItem('userId', salon.id || salon._id);
      localStorage.setItem('salonUser', JSON.stringify(salonUserData));

 console.log(' Saved to localStorage:');
 console.log(' - token:', !!localStorage.getItem('token'));
 console.log(' - userRole:', localStorage.getItem('userRole'));
 console.log(' - userEmail:', localStorage.getItem('userEmail'));
 console.log(' - userName:', localStorage.getItem('userName'));

      // Call the auth context login
      login(token, salonUserData);

 console.log(' Navigating to dashboard...');
      navigate("/dashboard");
    } catch (err) {
 console.error(" Owner login error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage("");
    setError("");

    if (!forgotEmail) {
      setError("Please enter your email address");
      return;
    }

    setForgotLoading(true);

    try {
      const res = await axiosInstance.post('/salons/forgot-password', {
        email: forgotEmail
      });

      setForgotMessage(res.data.message);
      setForgotEmail("");

      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotMessage("");
      }, 5000);
    } catch (err) {
 console.error("Forgot password error:", err);
      setError(err.response?.data?.message || "Failed to send reset email. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col md:flex-row bg-white">
      {/* Left Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-28 relative z-10 shadow-2xl">
        <div className="w-full max-w-md mx-auto relative overflow-hidden">

          <div className="mb-10 fade-in-up">
            <Link to="/login-selection" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-dark-900 mb-8 transition-colors">
              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to selection
            </Link>

            <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-xl mb-4 text-dark-900">
              <BuildingStorefrontIcon className="h-7 w-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-gray-900 mb-2">Business Portal</h1>
            <p className="text-gray-500 text-lg">Sign in to manage your salon and appointments.</p>
          </div>

          <div className="relative h-[480px] w-full">
            {/* LOGIN FORM */}
            <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${!showForgotPassword ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-full pointer-events-none'}`}>

              {error && !showForgotPassword && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">Business Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-dark-900 focus:border-dark-900 transition-all text-sm outline-none"
                      placeholder="owner@salon.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-semibold text-gray-700" htmlFor="password">Password</label>
                    <button
                      type="button"
                      className="text-sm font-medium text-dark-900 hover:underline transition"
                      onClick={() => { setShowForgotPassword(true); setError(""); }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-dark-900 focus:border-dark-900 transition-all text-sm outline-none"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.email || !formData.password}
                  className={`w-full py-3.5 px-4 mt-4 rounded-xl text-white font-bold text-sm shadow-md transition-all duration-300 ${loading || !formData.email || !formData.password
                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-dark-900 hover:bg-black hover:shadow-dark-900/30'
                    }`}
                >
                  {loading ? "Authenticating..." : "Sign in to Dashboard"}
                </button>
              </form>

              <div className="mt-8 text-center border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-500">
                  Ready to grow your business?{' '}
                  <Link to="/register" className="font-semibold text-dark-900 hover:underline">
                    Apply for a partner account
                  </Link>
                </p>
              </div>
            </div>

            {/* FORGOT PASSWORD FORM */}
            <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${showForgotPassword ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-full pointer-events-none'}`}>

              {error && showForgotPassword && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              {forgotMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-100 rounded-xl text-center">
                  <p className="text-sm text-green-800 font-medium">{forgotMessage}</p>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="forgotEmail">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="forgotEmail"
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-dark-900 focus:border-dark-900 transition-all text-sm outline-none"
                      placeholder="Enter your registered email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      disabled={forgotLoading}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail}
                    className={`flex-2 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all duration-300 w-2/3 ${forgotLoading || !forgotEmail
                      ? 'bg-gray-300 cursor-not-allowed shadow-none'
                      : 'bg-dark-900 hover:bg-black hover:shadow-dark-900/30'
                      }`}
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-3 px-4 rounded-xl text-gray-700 bg-gray-100 font-bold text-sm hover:bg-gray-200 transition-all duration-300 w-1/3"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotEmail("");
                      setError("");
                      setForgotMessage("");
                    }}
                    disabled={forgotLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Right Image Section */}
      <div className="hidden md:block md:flex-1 relative bg-dark-900 overflow-hidden">
        <div className="absolute inset-0 bg-dark-900/40 mix-blend-multiply z-10"></div>
        <img
          src={loginImage}
          alt="Professional Salon Owner"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />

        <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 lg:p-16">
          <div className="backdrop-blur-md bg-white/10 p-8 rounded-2xl border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-3">Maximize Your Potential</h2>
            <p className="text-gray-200 text-lg leading-relaxed">
              Join thousands of top-rated salon owners who use SLT-Mobitel Saloon Booking System to eliminate no-shows and grow their loyal client base.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;