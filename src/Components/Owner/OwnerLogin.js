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
      
      // Assuming your backend returns token and salon data
      const { token, salon } = res.data;
      
      const salonUserData = {
        ...salon,
        role: 'owner',
        id: salon._id || salon.id // Ensure id is set
      };
      
      // Store in both auth context and localStorage for compatibility
      login(token, salonUserData);
      localStorage.setItem('salonUser', JSON.stringify(salonUserData));
      
      navigate("/dashboard");
    } catch (err) {
      console.error("Owner login error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
      
      // For demo purposes - mock login if backend fails
      if (err.response?.status >= 500) {
        const mockOwner = {
          id: 'mock-owner-123',
          name: 'Demo Salon Owner',
          email: formData.email,
          role: 'owner',
          salonName: 'Demo Salon'
        };
        const mockToken = `mock-owner-token-${Date.now()}`;
        login(mockToken, mockOwner);
        navigate("/dashboard");
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo login for testing
  // const handleDemoLogin = () => {
  //   const demoOwner = {
  //     id: 'demo-owner-123',
  //     name: 'Demo Salon Owner',
  //     email: 'demo@salon.com',
  //     role: 'owner',
  //     salonName: 'Premium Beauty Salon'
  //   };
  //   const demoToken = `demo-owner-token-${Date.now()}`;
  //   login(demoToken, demoOwner);
  //   navigate("/dashboard");
  // };

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

        {/* Demo login button for testing */}
        {/* <button 
          onClick={handleDemoLogin}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '10px',
            fontSize: '14px'
          }}
        >
          Try Demo Owner Login
        </button> */}

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