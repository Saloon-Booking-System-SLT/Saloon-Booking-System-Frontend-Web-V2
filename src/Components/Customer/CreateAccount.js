import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import haircutImage from "../../Assets/hairdresser.jpg";
import { UserIcon, EnvelopeIcon, PhoneIcon, LockClosedIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function CustomerRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Full name must be at least 2 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Contact Number validation
    if (formData.phone) {
      const phoneRegex = /^\+94[0-9]{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Use format: +94771234567";
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms validation
    if (!agreeToTerms) {
      newErrors.terms = "You must agree to the Terms and Conditions and Privacy Policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Register user in your backend
      const res = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        // Handle backend errors
 console.error("Backend error:", responseData);
        throw new Error(responseData.message || 'Registration failed');
      }

      const { token, user } = responseData;

      // Login the user
      login(token, user);

      // Show success alert
      alert("✅ Registration Successful!\n\nYour account has been created successfully. You will be redirected to the dashboard.");

      // Redirect after alert
      navigate("/searchsalon");

    } catch (error) {
 console.error("Registration failed:", error);

      // Show error alert
      let errorMessage = "Registration failed. Please try again.";

      if (error.message.includes('already registered')) {
        if (error.message.includes('Email')) {
          errorMessage = "This email is already registered. Please use a different email or try logging in.";
        } else if (error.message.includes('Phone')) {
          errorMessage = "This phone number is already registered. Please use a different phone number.";
        }
      } else if (error.message.includes('password')) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message || "Registration failed. Please try again.";
      }

      alert(`❌ ${errorMessage}`);

      // Also set form errors for field-specific issues
      if (error.message.includes('already registered')) {
        if (error.message.includes('Email')) {
          setErrors({ email: "Email already registered" });
        } else if (error.message.includes('Phone')) {
          setErrors({ phone: "Phone number already registered" });
        }
      } else if (error.message.includes('password')) {
        setErrors({ password: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col md:flex-row bg-white">
      {/* Left Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-28 relative z-10 shadow-xl lg:max-w-2xl overflow-y-auto">

        <div className="w-full max-w-md mx-auto my-auto">

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-500 text-base">Join us to discover and book the best beauty services around you.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm outline-none ${errors.name ? 'border-red-500 ring-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'}`}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm outline-none ${errors.email ? 'border-red-500 ring-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'}`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm outline-none ${errors.phone ? 'border-red-500 ring-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'}`}
                  placeholder="+94771234567 (optional)"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm outline-none ${errors.password ? 'border-red-500 ring-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'}`}
                  placeholder="min 6 chars"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CheckCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm outline-none ${errors.confirmPassword ? 'border-red-500 ring-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'}`}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div className={`pt-2 ${errors.terms ? 'text-red-500' : ''}`}>
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                  checked={agreeToTerms}
                  onChange={(e) => {
                    setAgreeToTerms(e.target.checked);
                    if (errors.terms) {
                      setErrors(prev => ({ ...prev, terms: "" }));
                    }
                  }}
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-600 leading-tight">
                  I have read and agreed to the{" "}
                  <a href="/terms" className="text-primary-600 hover:text-primary-700 hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                    Terms and Conditions
                  </a>
                  {" "}and{" "}
                  <a href="/privacy" className="text-primary-600 hover:text-primary-700 hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 mt-2 rounded-xl text-white font-bold text-sm shadow-md transition-all duration-300 ${loading
                ? 'bg-gray-400 cursor-not-allowed shadow-none'
                : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-600/30'
                }`}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login/customer" className="font-bold text-primary-600 hover:text-primary-700 hover:underline">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Right Image Section */}
      <div className="hidden md:block md:flex-1 relative bg-dark-900 overflow-hidden">
        <div className="absolute inset-0 bg-primary-900/10 mix-blend-overlay z-10"></div>
        <img
          src={haircutImage}
          alt="Elegant salon environment"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />

        {/* Floating Promise Card */}
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[80%] max-w-sm z-20">
          <div className="backdrop-blur-md bg-white/10 p-8 rounded-2xl border border-white/20 shadow-2xl">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Book with Confidence</h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              Find reviewed professionals, discover inspiring styles, and instantly book your next appointment seamlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}