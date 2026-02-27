import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { auth, googleProvider } from "../../firebase";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import axios from "../../Api/axios";
import haircutImage from "../../Assets/hairdresser.jpg";
import "./Login.css";

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

  // Handle redirect result on component mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          
          const response = await axios.post('/users/google-login', {
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          });

          if (response.data.success) {
            const { token, user: savedUser } = response.data;
            
            await login(token, { 
              ...savedUser, 
              role: 'customer'
            });
            
            setTimeout(() => {
              navigate("/searchsalon");
            }, 200);
          }
        }
      } catch (error) {
        console.error("Redirect result error:", error);
      }
    };

    handleRedirectResult();
  }, [navigate, login]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      try {
        // Try popup method first
        const result = await signInWithPopup(auth, googleProvider);
        await processGoogleAuthResult(result);
      } catch (popupError) {
        console.log("Popup failed, trying redirect method...", popupError);
        
        // Fallback to redirect method if popup fails
        await signInWithRedirect(auth, googleProvider);
        // The redirect will handle the auth result
        return;
      }
    } catch (error) {
      console.error("Google login failed:", error);
      if (error.response?.data?.message) {
        alert(`Google login failed: ${error.response.data.message}`);
      } else if (error.message) {
        alert(`Google login failed: ${error.message}`);
      } else {
        alert("Google login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const processGoogleAuthResult = async (result) => {
    try {
      const user = result.user;

      const response = await axios.post('/users/google-login', {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });

      if (response.data.success) {
        const { token, user: savedUser } = response.data;
        
        // Call login and wait for it to complete
        await login(token, { 
          ...savedUser, 
          role: 'customer'
        });
        
        // Navigate after login state is set
        setTimeout(() => {
          navigate("/searchsalon");
          setLoading(false);
        }, 200);
      } else {
        alert("Failed to authenticate with Google. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Google login processing failed:", error);
      if (error.response?.data?.message) {
        alert(`Google login failed: ${error.response.data.message}`);
      } else if (error.message) {
        alert(`Google login failed: ${error.message}`);
      } else {
        alert("Google login failed. Please try again.");
      }
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
      const response = await axios.post('/users/email-login', {
        email: email,
        password: password,
      });

      if (response.data.success) {
        const { token, user: savedUser } = response.data;
        
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
      const response = await axios.post('/users/forgot-password', {
        email: resetEmail,
      });

      if (response.data.success) {
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