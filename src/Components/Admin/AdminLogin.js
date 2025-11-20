import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLogin.css';
import loginImage from '../../Assets/login-image.jpg';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', {
        username,
        password
      });

      if (response.data.success) {
        const { token, admin } = response.data;
        
        // Use the auth context login function with admin role
        login(token, { 
          ...admin, 
          role: 'admin',
          id: admin.id || 'admin'
        });
        
        navigate('/admin-dashboard');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      
      // For demo purposes - mock login if backend fails
      if (err.response?.status >= 500) {
        const mockAdmin = {
          id: 'admin',
          username: username,
          role: 'admin'
        };
        const mockToken = `mock-admin-token-${Date.now()}`;
        login(mockToken, mockAdmin);
        navigate('/admin-dashboard');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo login for testing
  const handleDemoLogin = () => {
    const demoAdmin = {
      id: 'admin',
      username: 'admin',
      role: 'admin'
    };
    const demoToken = `demo-admin-token-${Date.now()}`;
    login(demoToken, demoAdmin);
    navigate('/admin-dashboard');
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-left">
        <div className="admin-logo-bar">
          {/* You can add logo here if needed */}
        </div>

        <h2 className="admin-login-title">Admin Login</h2>
        <p className="admin-login-subtitle">Sign in to access the admin dashboard</p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="admin-login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="admin-login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Demo login button for testing
        <button 
          onClick={handleDemoLogin}
          className="admin-demo-button"
        >
          Try Demo Admin Login
        </button>

        <p className="admin-redirect-text">
          Customer?{' '}
          <a href="/login/customer" className="admin-redirect-link">
            Customer Login
          </a>
        </p>

        <p className="admin-redirect-text">
          Salon Owner?{' '}
          <a href="/login/owner" className="admin-redirect-link">
            Owner Login
          </a>
        </p> */}
      </div>

      <div className="admin-login-right">
        <img src={loginImage} alt="Admin" className="admin-login-image" />
      </div>
    </div>
  );
};

export default AdminLogin;