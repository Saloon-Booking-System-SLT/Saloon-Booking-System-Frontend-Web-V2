// Components/Unauthorized.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (user?.role === 'customer') {
      navigate('/');
    } else if (user?.role === 'owner') {
      navigate('/dashboard');
    } else if (user?.role === 'admin') {
      navigate('/AdminDashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '50px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#ff4444', marginBottom: '20px' }}>
        ⚠️ Unauthorized Access
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '10px' }}>
        You don't have permission to access this page.
      </p>
      <p style={{ marginBottom: '30px' }}>
        Your current role: <strong style={{ color: '#007bff' }}>{user?.role}</strong>
      </p>
      <div>
        <button 
          onClick={handleGoHome} 
          style={{ 
            margin: '10px', 
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go to Dashboard
        </button>
        <button 
          onClick={logout}
          style={{ 
            margin: '10px', 
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;