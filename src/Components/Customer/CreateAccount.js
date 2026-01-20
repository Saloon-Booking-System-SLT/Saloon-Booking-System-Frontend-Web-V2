import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import haircutImage from "../../Assets/hairdresser.jpg";
import "./CreateAccount.css";

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
    <div className="create-account-container">
      <div className="form-section">
        <h2 className="create-account-title">Create Account</h2>
        
        <form onSubmit={handleSubmit} className="create-account-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="Enter Full Name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="Enter Email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Contact Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className={`form-input ${errors.phone ? 'input-error' : ''}`}
              placeholder="+94771234567 (optional)"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          <div className={`terms-group ${errors.terms ? 'checkbox-error' : ''}`}>
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (errors.terms) {
                    setErrors(prev => ({ ...prev, terms: "" }));
                  }
                }}
                disabled={loading}
              />
              <span className="terms-label">
                I have read and agreed to the{" "}
                <a href="/terms" className="terms-link" target="_blank" rel="noopener noreferrer">
                  Terms and Conditions
                </a>
                {" "}and{" "}
                <a href="/privacy" className="terms-link" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.terms && (
              <span className="error-message" style={{ display: 'block', marginTop: '8px' }}>{errors.terms}</span>
            )}
          </div>

          <button
            type="submit"
            className="create-account-btn"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="login-link">
          Already have an account?{" "}
          <Link to="/login/customer" className="sign-in-link">
            Sign in
          </Link>
        </div>
      </div>

      <div className="image-section">
        <img src={haircutImage} alt="Salon" className="login-image" />
      </div>
    </div>
  );
}