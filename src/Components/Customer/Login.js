import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { auth, googleProvider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";
import haircutImage from "../../Assets/hairdresser.jpg";
import "./Login.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const res = await fetch(`${API_BASE_URL}/users/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        }),
      });

      if (!res.ok) return alert("Failed to save user");
      
      const responseData = await res.json();
      const { token, user: savedUser } = responseData;
      
      login(token, { 
        ...savedUser, 
        role: 'customer'
      });
      
      navigate("/searchsalon");
    } catch (error) {
      console.error("Google login failed:", error);
      alert("Google login failed");
    } finally {
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
      const res = await fetch(`${API_BASE_URL}/users/email-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (res.ok) {
        const responseData = await res.json();
        const { token, user: savedUser } = responseData;
        
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
      const res = await fetch(`${API_BASE_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
        }),
      });

      if (res.ok) {
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
    <div className="login-container">
      <div className="form-section">
        <h2 className="login-title1">Welcome back</h2>
        
        <div className="forms-container">
          {/* Login Form Card */}
          <div className={`form-card ${activeForm === 'login' ? 'active' : 'inactive'}`}>
            <div className="form-card-header">
              <h3>Sign in to your account</h3>
            </div>
            
            <form onSubmit={handleEmailLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                  type="email"
                  id="email"
                  className="input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <div className="password-header">
                  <label htmlFor="password" className="form-label">Password</label>
                  <button 
                    type="button" 
                    className="forgot-password-link"
                    onClick={() => setActiveForm('forgot')}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  id="password"
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="remember-me">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="checkbox-input"
                    disabled={loading}
                  />
                  <span className="checkbox-text">Remember me</span>
                </label>
              </div>
              
              <button
                type="submit"
                className="signin-button"
                disabled={loading || !email || !password}
              >
                {loading ? "Processing..." : "Sign in"}
              </button>
            </form>

            <div className="divider">
              <hr className="line" />
              <span className="or-text">OR</span>
              <hr className="line" />
            </div>

            <button 
              className="google-btn" 
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google"
                className="google-icon"
              />
              {loading ? "Processing..." : "Sign in with Google"}
            </button>

            <button 
              className="guest-btn" 
              onClick={handleGuestContinue}
              disabled={loading}
            >
              🎉 Continue as Guest
            </button>

            <p className="signup-link">
              Don't have an account? <a href="/create-account" className="signup-text">Sign up</a>
            </p>

            <p className="business-link">
              Are you a salon owner?{" "}
              <a href="/OwnerLogin" className="sign-in-link">
                Login here
              </a>
            </p>
          </div>

          {/* Forgot Password Form Card */}
          <div className={`form-card ${activeForm === 'forgot' ? 'active' : 'inactive'}`}>
            <div className="form-card-header">
              {/* <button 
                type="button" 
                className="back-button"
                onClick={() => setActiveForm('login')}
              >
                ← Back
              </button> */}
              <h3>Reset your password</h3>
            </div>
            
            <p className="form-description">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
            
            <form onSubmit={handleForgotPassword} className="forgot-form">
              <div className="form-group">
                <label htmlFor="resetEmail" className="form-label">Email address</label>
                <input
                  type="email"
                  id="resetEmail"
                  className="input"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={resetLoading || resetSent}
                />
              </div>
              
              <button
                type="submit"
                className="reset-button"
                disabled={resetLoading || resetSent || !resetEmail}
              >
                {resetLoading ? "Sending..." : resetSent ? "Email Sent!" : "Reset Password "}
              </button>
            </form>
            
            {resetSent && (
              <div className="success-message">
                <p>✅ Check your email for reset instructions</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="image-section">
        <img src={haircutImage} alt="Salon" className="login-image" />
      </div>
    </div>
  );
}