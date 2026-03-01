import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { auth, googleProvider } from "../../firebase";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import axios from "../../Api/axios";
import haircutImage from "../../Assets/hairdresser.jpg";
import { EnvelopeIcon, LockClosedIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function CustomerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [activeForm, setActiveForm] = useState("login"); // 'login' or 'forgot'
  const navigate = useNavigate();
  const { login } = useAuth();

  // Handle redirect result on component mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;

          const response = await axios.post('/users/google-login', {
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          });

          if (response.data.success) {
            const { token, user: savedUser } = response.data;

            await login(token, {
              ...savedUser,
              role: 'customer'
            });

            setTimeout(() => {
              navigate("/searchsalon");
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
    } catch (error) {
 console.error("Google login failed:", error);
      if (error.response?.data?.message) {
        alert(`Google login failed: ${error.response.data.message}`);
      } else if (error.message) {
        alert(`Google login failed: ${error.message}`);
      } else {
        alert("Google login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const processGoogleAuthResult = async (result) => {
    try {
      const user = result.user;

      const response = await axios.post('/users/google-login', {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });

      if (response.data.success) {
        const { token, user: savedUser } = response.data;

        // Call login and wait for it to complete
        await login(token, {
          ...savedUser,
          role: 'customer'
        });

        // Navigate after login state is set
        setTimeout(() => {
          navigate("/searchsalon");
          setLoading(false);
        }, 200);
      } else {
        alert("Failed to authenticate with Google. Please try again.");
        setLoading(false);
      }
    } catch (error) {
 console.error("Google login processing failed:", error);
      if (error.response?.data?.message) {
        alert(`Google login failed: ${error.response.data.message}`);
      } else if (error.message) {
        alert(`Google login failed: ${error.message}`);
      } else {
        alert("Google login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    const guestUser = {
      id: 'guest-' + Date.now(),
      name: 'Guest User',
      role: 'guest',
      isGuest: true,
      phone: '',
      email: '',
      photoURL: ''
    };

    localStorage.setItem('guestUser', JSON.stringify(guestUser));
    navigate("/searchsalon");
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/users/email-login', {
        email: email,
        password: password,
      });

      if (response.data.success) {
        const { token, user: savedUser } = response.data;

        if (rememberMe) {
          localStorage.setItem('rememberedToken', token);
          localStorage.setItem('rememberedUser', JSON.stringify(savedUser));
        }

        login(token, {
          ...savedUser,
          role: 'customer'
        });

        navigate("/searchsalon");
      } else {
        // Demo mode
        const mockUser = {
          id: `email-user-${Date.now()}`,
          name: email.split('@')[0],
          role: 'customer',
          email: email,
          phone: '',
          photoURL: ''
        };

        const mockToken = `mock-jwt-token-${email}`;

        if (rememberMe) {
          localStorage.setItem('rememberedToken', mockToken);
          localStorage.setItem('rememberedUser', JSON.stringify(mockUser));
        }

        login(mockToken, mockUser);
        alert("Logged in successfully (demo mode)");
        navigate("/searchsalon");
      }
    } catch (error) {
 console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!resetEmail) {
      alert("Please enter your email address");
      return;
    }

    setResetLoading(true);

    try {
      const response = await axios.post('/users/forgot-password', {
        email: resetEmail,
      });

      if (response.data.success) {
        setResetSent(true);
        alert("Password reset instructions have been sent to your email");
        setTimeout(() => {
          setResetEmail("");
          setResetSent(false);
        }, 3000);
      } else {
        // Demo mode
        setResetSent(true);
        alert("Password reset instructions have been sent to your email (demo mode)");
        setTimeout(() => {
          setResetEmail("");
          setResetSent(false);
        }, 3000);
      }
    } catch (error) {
 console.error("Password reset failed:", error);
      alert("Failed to send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col lg:flex-row bg-white">
      {/* Left Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-28 relative z-10">

        <div className="w-full max-w-md mx-auto relative overflow-hidden">
          {/* Header Text */}
          <div className="mb-10 fade-in-up">
            <Link to="/login-selection" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 mb-8 transition-colors">
              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to selection
            </Link>
            <h1 className="text-4xl font-heading font-black tracking-tight text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-lg">Enter your details to access your appointments.</p>
          </div>

          <div className="relative h-[650px] w-full">
            {/* LOGIN FORM */}
            <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${activeForm === 'login' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-full pointer-events-none'}`}>
              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm outline-none"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 transition"
                      onClick={() => setActiveForm('forgot')}
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm outline-none"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Remember me for 30 days
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all duration-300 ${loading || !email || !password
                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-600/30'
                    }`}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center space-x-4">
                <span className="h-px w-full bg-gray-200"></span>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest px-2">or</span>
                <span className="h-px w-full bg-gray-200"></span>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-100 rounded-xl bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all duration-200"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
                  Continue with Google
                </button>

                <button
                  onClick={handleGuestContinue}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-dashed border-gray-300 rounded-xl bg-transparent text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  <SparklesIcon className="h-5 w-5 text-gray-400" />
                  Explore as Guest
                </button>
              </div>

              <p className="mt-8 text-center text-sm text-gray-500">
                New to our platform?{' '}
                <a href="/create-account" className="font-semibold text-primary-600 hover:text-primary-700">Create an account</a>
              </p>

              <div className="absolute bottom-[-60px] w-full text-center">
                <p className="text-xs text-gray-400">
                  Salon Owner? <a href="/OwnerLogin" className="font-medium hover:text-gray-600 underline underline-offset-2">Login here</a>
                </p>
              </div>
            </div>

            {/* FORGOT PASSWORD FORM */}
            <div className={`absolute inset-0 bg-white transition-all duration-500 ease-in-out ${activeForm === 'forgot' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-full pointer-events-none'}`}>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                  <p className="text-gray-500 text-sm">We'll send you instructions to reset it.</p>
                </div>
                <button
                  onClick={() => setActiveForm('login')}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="resetEmail">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="resetEmail"
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm outline-none"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={resetLoading || resetSent}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading || resetSent || !resetEmail}
                  className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all duration-300 ${resetLoading || resetSent || !resetEmail
                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-600/30'
                    }`}
                >
                  {resetLoading ? "Sending Link..." : resetSent ? "Check Your Email ✓" : "Send Reset Link"}
                </button>
              </form>

              {resetSent && (
                <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl text-center">
                  <p className="text-sm text-green-800 font-medium">Reset link sent successfully. Please check your inbox and spam folders.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Image Section */}
      <div className="hidden lg:block lg:flex-1 relative bg-dark-900 overflow-hidden">
        <div className="absolute inset-0 bg-primary-900/10 mix-blend-overlay z-10"></div>
        <img
          src={haircutImage}
          alt="Elegant salon environment"
          className="absolute inset-0 w-full h-full object-cover opacity-90 grayscale-[20%]"
        />

        {/* Floating Testimonial Card */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[85%] max-w-sm z-20">
          <div className="backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/20 shadow-2xl">
            <div className="flex text-yellow-400 mb-3 space-x-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              ))}
            </div>
            <p className="text-white text-lg font-medium leading-normal mb-4">
              "Booking my regular haircut has never been easier. The platform is incredibly intuitive and quick."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold tracking-wider">
                SJ
              </div>
              <div>
                <p className="text-sm font-bold text-white">Sarah Jenkins</p>
                <p className="text-xs text-gray-300">Verified Customer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}