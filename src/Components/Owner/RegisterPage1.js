import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage1.css";
import loginImage from "../../Assets/login-image.jpg";

const RegisterPage1 = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phoneCode: "+94",
    phoneNumber: "",
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const phoneCodes = ["+94", "+91", "+1", "+44"]; // add more if needed
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i < 10 ? `0${i}` : i;
    return `${hour}:00`;
  });

  // Validate email
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Validate strong password
  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!validateEmail(formData.email)) newErrors.email = "Invalid email address";
    if (!validatePassword(formData.password))
      newErrors.password =
        "Password must have 8+ chars, uppercase, lowercase, number & symbol";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.phoneNumber || formData.phoneNumber.length < 7)
      newErrors.phoneNumber = "Invalid phone number";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Save to local storage
    localStorage.setItem(
      "salonRegisterData",
      JSON.stringify({
        email: formData.email,
        password: formData.password,
        phone: `${formData.phoneCode}${formData.phoneNumber}`,
        workingHours: `${formData.workingHoursStart} - ${formData.workingHoursEnd}`,
      })
    );
    navigate("/register-step-2");
  };

  return (
    <div className="register1-container">
      <div className="register1-left">
        <h2 className="register1-title">Create Your Salon Account</h2>
        <p className="register1-subtitle">
          Step 1: Set up your account to manage bookings and services.
        </p>

        <form className="register1-form" onSubmit={handleNext}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="register1-input"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email && <span className="error">{errors.email}</span>}

          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              className="register1-input password-input"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.88 9.88L14.12 14.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.73 5.08L12 4.85C16.24 4.85 19.5 8.58 20.62 12C19.5 15.42 16.24 19.15 12 19.15C11.67 19.15 11.34 19.12 11.02 19.06" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.61 6.61L17.39 17.39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.38 12C4.5 8.58 7.76 4.85 12 4.85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          {errors.password && <span className="error">{errors.password}</span>}

          <div className="password-input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              className="register1-input password-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.88 9.88L14.12 14.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.73 5.08L12 4.85C16.24 4.85 19.5 8.58 20.62 12C19.5 15.42 16.24 19.15 12 19.15C11.67 19.15 11.34 19.12 11.02 19.06" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.61 6.61L17.39 17.39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.38 12C4.5 8.58 7.76 4.85 12 4.85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}

          <div className="register1-phone">
            <select
              name="phoneCode"
              className="register1-input"
              value={formData.phoneCode}
              onChange={handleChange}
            >
              {phoneCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="phoneNumber"
              placeholder="Phone Number"
              className="register1-input"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>
          {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}

          <div className="working-hours">
            <label>Working Hours:</label>
            <div className="working-hours-inputs">
              <select
                name="workingHoursStart"
                value={formData.workingHoursStart}
                onChange={handleChange}
                className="register1-input"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <span className="working-hours-separator">to</span>
              <select
                name="workingHoursEnd"
                value={formData.workingHoursEnd}
                onChange={handleChange}
                className="register1-input"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="register1-button">
            Next ➡️
          </button>
        </form>

        <p className="register1-footer">
          Already have an account?{" "}
          <a href="/login" className="register1-link">
            Login here
          </a>
        </p>
      </div>

      <div className="register1-right">
        <img src={loginImage} alt="Salon" className="register1-image" />
      </div>
    </div>
  );
};

export default RegisterPage1;
