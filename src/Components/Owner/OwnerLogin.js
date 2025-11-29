import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // Import the auth context
import "./OwnerLogin.css";
import loginImage from "../../Assets/login-image.jpg";
import axios from "../../Api/axios";

const OwnerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); // Get login function from context

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
      const res = await axios.post('/salons/login', formData);
      
      // Get token and salon data from response
      const { token, salon } = res.data;
      
      const salonUserData = {
        ...salon,
        role: 'owner',
        id: salon._id || salon.id,
        approvalStatus: salon.approvalStatus, // ✅ Save approval status
        rejectionReason: salon.rejectionReason // ✅ Save rejection reason
      };
      
      // Store in both auth context and localStorage
      console.log('Owner login: Storing user data', {
        hasToken: !!token,
        userRole: salonUserData.role,
        userId: salonUserData.id
      });
      
      login(token, salonUserData);
      
      // Double-ensure localStorage is set for hosted environments
      try {
        localStorage.setItem('salonUser', JSON.stringify(salonUserData));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(salonUserData));
        console.log('Owner login: localStorage set successfully');
      } catch (e) {
        console.error('Owner login: Failed to set localStorage', e);
      }
      
      // Always navigate to dashboard - it will show approval message if pending
      navigate("/dashboard");
    } catch (err) {
      console.error("Owner login error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
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

        <h2 className="owner-login-title">Login to Your Salon</h2>
        <p className="owner-login-subtitle">Manage appointments & services</p>

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
              fontSize: "14px"
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
        </form>

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