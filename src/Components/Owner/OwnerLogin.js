import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./OwnerLogin.css";
import loginImage from "../../Assets/login-image.jpg";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
      const res = await axios.post(`${API_BASE_URL}/salons/login`, formData);
      
      const { token, salon } = res.data;
      
      console.log('Login response:', { token, salon });
      
      // ✅ FIX: If approvalStatus is undefined, default to 'approved' (for backward compatibility)
      const approvalStatus = salon.approvalStatus || 'approved';
      
      console.log('Approval status:', approvalStatus);
      
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
        approvalStatus: approvalStatus // ✅ Include the status in user data
      };
      
      console.log('Salon user data being saved:', salonUserData);
      
      login(token, salonUserData);
      localStorage.setItem('salonUser', JSON.stringify(salonUserData));
      
      console.log('Navigating to dashboard...');
      navigate("/dashboard");
    } catch (err) {
      console.error("Owner login error:", err);
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
      const res = await axios.post(`${API_BASE_URL}/salons/forgot-password`, {
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
    <div className="owner-login-container">
      <div className="owner-login-left">
        <div className="owner-logo-bar">
          {/* Add your logo here if needed */}
        </div>

        <h2 className="owner-login-title">
          {showForgotPassword ? "Reset Your Password" : "Login to Your Salon"}
        </h2>
        <p className="owner-login-subtitle">
          {showForgotPassword ? "Enter your email to receive a password reset link" : "Manage appointments & services"}
        </p>

        {!showForgotPassword ? (
          <form className="owner-login-form" onSubmit={handleLogin}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="owner-login-input"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="owner-login-input"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
            
            {error && (
              <p style={{ 
                color: "red", 
                marginTop: "-10px", 
                marginBottom: "15px",
                fontSize: "14px",
                padding: "10px",
                backgroundColor: "#fee",
                borderRadius: "5px",
                border: "1px solid #fcc"
              }}>
                {error}
              </p>
            )}
            
            <button 
              type="submit" 
              className="owner-login-button"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <button 
              type="button"
              className="owner-forgot-password-btn"
              onClick={() => setShowForgotPassword(true)}
              disabled={loading}
            >
              Forgot Password?
            </button>
          </form>
        ) : (
          <form className="owner-login-form" onSubmit={handleForgotPassword}>
            <input
              type="email"
              placeholder="Enter your email"
              className="owner-login-input"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              disabled={forgotLoading}
            />
            
            {error && (
              <p style={{ 
                color: "red", 
                marginTop: "-10px", 
                marginBottom: "15px",
                fontSize: "14px"
              }}>
                {error}
              </p>
            )}
            
            {forgotMessage && (
              <p style={{ 
                color: "green", 
                marginTop: "-10px", 
                marginBottom: "15px",
                fontSize: "14px"
              }}>
                {forgotMessage}
              </p>
            )}
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="submit" 
                className="owner-login-button"
                disabled={forgotLoading}
                style={{ flex: 2 }}
              >
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </button>
              <button 
                type="button"
                className="owner-cancel-btn"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotEmail("");
                  setError("");
                  setForgotMessage("");
                }}
                disabled={forgotLoading}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <p className="owner-redirect-text">
          Not registered yet?{" "}
          <a href="/register" className="owner-redirect-link">
            Register here
          </a>
        </p>
      </div>

      <div className="owner-login-right">
        <img src={loginImage} alt="Salon" className="owner-login-image" />
      </div>
    </div>
  );
};

export default OwnerLogin;