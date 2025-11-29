import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // Import the auth context
import { auth, googleProvider } from "../../firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import haircutImage from "../../Assets/hairdresser.jpg";
import "./Login.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function CustomerLogin() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Get login function from context

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
      
      // Assuming your backend returns token and user data
      const { token, user: savedUser } = responseData;
      
      // Use the auth context login function
      login(token, { 
        ...savedUser, 
        role: 'customer' // Explicitly set role
      });
      
      navigate("/searchsalon"); // Redirect to customer page
    } catch (error) {
      console.error("Google login failed:", error);
      alert("Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        { 
          size: "invisible",
          callback: () => {
            // reCAPTCHA solved, allow sendOtp
          }
        },
        auth
      );
    }
  };

  const sendOtp = async () => {
    if (!phone.startsWith("+94")) {
      return alert("Use format: +94771234567");
    }
    
    setLoading(true);
    setupRecaptcha();
    
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setShowOtp(true);
      alert("OTP sent to your phone");
    } catch (error) {
      console.error("Failed to send OTP:", error);
      alert("Failed to send OTP. Please try again.");
      
      // Reset recaptcha on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      alert("Please enter OTP");
      return;
    }
    
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      // Send phone login data to your backend
      const res = await fetch(`${API_BASE_URL}/users/phone-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: user.phoneNumber,
          name: "OTP User", // You might want to get this from user input
        }),
      });

      if (res.ok) {
        const responseData = await res.json();
        const { token, user: savedUser } = responseData;
        
        // Use the auth context login function
        login(token, { 
          ...savedUser, 
          role: 'customer',
          phone: user.phoneNumber 
        });
        
        navigate("/searchsalon");
      } else {
        // If backend API fails, create a local user
        const localUser = {
          id: user.uid,
          name: "OTP User",
          phone: user.phoneNumber,
          email: "",
          photoURL: "",
          role: 'customer'
        };
        
        // For demo purposes - create a mock token
        const mockToken = `mock-jwt-token-${user.uid}`;
        login(mockToken, localUser);
        navigate("/searchsalon");
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
      alert("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    // For guest users, you might not set any authentication
    // Or create a temporary guest session
    const guestUser = {
      id: 'guest',
      name: 'Guest',
      role: 'guest',
      isGuest: true
    };
    
    // Store guest info without token
    localStorage.setItem('guestUser', JSON.stringify(guestUser));
    navigate("/");
  };

  const handleResendOtp = () => {
    setOtp("");
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    sendOtp();
  };

  return (
    <div className="login-container">
      <div className="form-section">
        <h2 className="login-title1">Welcome to Salon</h2>
        <p className="login-subtext1">
          Log in to book top salon services easily and quickly.
        </p>

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
          {loading ? "Processing..." : "Continue with Google"}
        </button>

        <div className="divider">
          <hr className="line" />
          <span className="or-text">OR</span>
          <hr className="line" />
        </div>

        <input
          type="tel"
          className="input"
          placeholder="Enter phone (+94771234567)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={showOtp || loading}
        />
        
        {showOtp && (
          <>
            <input
              type="text"
              className="input"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
              maxLength={6}
            />
            <button 
              className="resend-otp-btn" 
              onClick={handleResendOtp}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                fontSize: '14px',
                marginTop: '5px'
              }}
            >
              Resend OTP
            </button>
          </>
        )}
        
        <button
          className="continue-btn"
          onClick={showOtp ? verifyOtp : sendOtp}
          disabled={loading || !phone}
        >
          {loading ? "Processing..." : showOtp ? "Verify OTP" : "Send OTP"}
        </button>

        <button 
          className="guest-btn" 
          onClick={handleGuestContinue}
          disabled={loading}
        >
          🎉 Continue as Guest
        </button>

        <div id="recaptcha-container"></div>

        <p className="business-link">
          Are you a salon owner?{" "}
          <a href="/OwnerLogin" className="sign-in-link">
            Login here
          </a>
        </p>
      </div>

      <div className="image-section">
        <img src={haircutImage} alt="Salon" className="login-image" />
      </div>
    </div>
  );
}