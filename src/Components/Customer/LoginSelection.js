import React from 'react';
import './LoginSelection.css';
import hairdresserImage from '../../Assets/selection.jpg';
import { useNavigate } from 'react-router-dom';

const LoginSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <button className="back-button" onClick={() => navigate(-1)}>←</button>
        <h2 className="login-title">Welcome to Salon</h2>
        <p className="login-subtext">Sign in or register to start your beauty journey</p>

        <div className="login-card" onClick={() => navigate('/login/customer')}>
          <div>
            <h3>I'm a Customer</h3>
            <p>Book appointments instantly at trusted salons near you.</p>
          </div>
          <span className="arrow">→</span>
        </div>

        <div className="login-card" onClick={() => window.location.href = 'http://localhost:3001'}
>
          <div>
            <h3>I'm a Business Owner</h3>
            <p>Manage your salon, track bookings, and grow your brand.</p>
          </div>
          <span className="arrow">→</span>
        </div>
      </div>

      <div className="login-right">
        <img src={hairdresserImage} alt="Hairdresser working" className="login-image" />
      </div>
    </div>
  );
};

export default LoginSelection;
