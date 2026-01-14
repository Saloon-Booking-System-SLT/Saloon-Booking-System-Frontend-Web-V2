import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./OwnerLogin.css"; // Reuse the same styles
import loginImage from "../../Assets/login-image.jpg"; // Add this import

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setMessage("");

  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  if (formData.password.length < 6) {
    setError("Password must be at least 6 characters long");
    return;
  }

  setLoading(true);

  try {
    console.log("🔄 Sending reset password request with token:", token);
    const res = await axios.post(`${API_BASE_URL}/salons/reset-password/${token}`, {
      password: formData.password
    });

    console.log("✅ Reset password response:", res.data);
    setMessage(res.data.message);
    
    // Wait a bit before redirecting
    setTimeout(() => {
      console.log("🔄 Redirecting to /owner-login");
      navigate("/owner-login");
    }, 3000);
  } catch (err) {
    console.error("❌ Reset password error:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    setError(err.response?.data?.message || "Failed to reset password. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="owner-login-container">
      <div className="owner-login-left">
        <div className="owner-logo-bar">
          {/* Add your logo here if needed */}
        </div>

        <h2 className="owner-login-title">Reset Your Password</h2>
        <p className="owner-login-subtitle">Enter your new password below</p>

        <form className="owner-login-form" onSubmit={handleSubmit}>
          <input
            type="password"
            name="password"
            placeholder="New Password"
            className="owner-login-input"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            minLength="6"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm New Password"
            className="owner-login-input"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            minLength="6"
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
          
          {message && (
            <p style={{ 
              color: "green", 
              marginTop: "-10px", 
              marginBottom: "15px",
              fontSize: "14px"
            }}>
              {message}
            </p>
          )}
          
          <button 
            type="submit" 
            className="owner-login-button"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="owner-redirect-text">
          Remember your password?{" "}
          <a href="/owner-login" className="owner-redirect-link">
            Login here
          </a>
        </p>
      </div>

      <div className="owner-login-right">
        <img src={loginImage} alt="Salon" className="owner-login-image" />
      </div>
    </div>
  );
};

export default ResetPassword;