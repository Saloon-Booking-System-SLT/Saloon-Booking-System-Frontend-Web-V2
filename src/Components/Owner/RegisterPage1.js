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

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="register1-input"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && <span className="error">{errors.password}</span>}

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className="register1-input"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}

          <div className="register1-phone">
            <select
              name="phoneCode"
              className="register1-input"
              value={formData.phoneCode}
              onChange={handleChange}
              style={{ width: "30%", display: "inline-block", marginRight: "10px" }}
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
              style={{ width: "65%", display: "inline-block" }}
              required
            />
          </div>
          {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}

          <div className="working-hours" style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Working Hours:</label>
            <select
              name="workingHoursStart"
              value={formData.workingHoursStart}
              onChange={handleChange}
              className="register1-input"
              style={{ width: "45%", display: "inline-block", marginRight: "10%" }}
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            <select
              name="workingHoursEnd"
              value={formData.workingHoursEnd}
              onChange={handleChange}
              className="register1-input"
              style={{ width: "45%", display: "inline-block" }}
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
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
