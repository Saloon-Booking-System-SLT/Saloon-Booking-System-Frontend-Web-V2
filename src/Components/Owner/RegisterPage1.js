import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import loginImage from "../../Assets/login-image.jpg";
import {
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingStorefrontIcon
} from "@heroicons/react/24/outline";

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
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!validateEmail(formData.email)) newErrors.email = "Invalid email address";
    if (!validatePassword(formData.password))
      newErrors.password =
        "Password must be 8+ chars (uppercase, lowercase, number & symbol)";
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
    <div className="min-h-screen font-sans flex flex-col md:flex-row bg-white selection:bg-dark-100">
      {/* Left Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-28 relative z-10 shadow-2xl overflow-y-auto">

        <div className="w-full max-w-md mx-auto my-auto py-10">

          <div className="mb-10 text-center md:text-left fade-in-up">
            <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-xl mb-6 text-dark-900 mx-auto md:mx-0">
              <BuildingStorefrontIcon className="h-7 w-7" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-gray-900 mb-3">Partner With Us</h1>
            <p className="text-gray-500 text-base">Register your salon business and reach more clients instantly.</p>
          </div>

          <form onSubmit={handleNext} className="space-y-5">

            {/* Email Form Group */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">Business Email *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-dark-900 focus:border-dark-900 transition-all text-sm outline-none ${errors.email ? 'border-red-500 ring-red-500' : 'border-gray-200'}`}
                  placeholder="contact@yoursalon.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.email && <p className="mt-1 text-xs font-medium text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="password">Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`w-full pl-10 pr-12 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-dark-900 focus:border-dark-900 transition-all text-sm outline-none ${errors.password ? 'border-red-500 ring-red-500' : 'border-gray-200'}`}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {errors.password ? (
                <p className="mt-1 text-xs font-medium text-red-500">{errors.password}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">At least 8 chars containing uppercase, lowercase, numbers & symbols</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="confirmPassword">Confirm Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`w-full pl-10 pr-12 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-dark-900 focus:border-dark-900 transition-all text-sm outline-none ${errors.confirmPassword ? 'border-red-500 ring-red-500' : 'border-gray-200'}`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs font-medium text-red-500">{errors.confirmPassword}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="phoneNumber">Business Contact Number *</label>
              <div className="flex rounded-xl shadow-sm">
                <div className="relative flex items-stretch flex-grow focus-within:z-10 w-1/4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    name="phoneCode"
                    value={formData.phoneCode}
                    onChange={handleChange}
                    className="h-full py-3 pl-8 pr-7 border-y border-l border-gray-200 bg-gray-50 text-gray-500 rounded-l-xl text-sm focus:ring-dark-900 focus:border-dark-900 outline-none appearance-none cursor-pointer"
                  >
                    {phoneCodes.map((code) => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <input
                  type="text"
                  name="phoneNumber"
                  className={`flex-1 min-w-0 block w-full px-4 py-3 bg-gray-50 border rounded-r-xl focus:bg-white focus:ring-2 focus:ring-dark-900 focus:border-dark-900 transition-all text-sm outline-none ${errors.phoneNumber ? 'border-red-500 z-10' : 'border-gray-200 border-l-0'}`}
                  placeholder="77 123 4567"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.phoneNumber && <p className="mt-1 text-xs font-medium text-red-500">{errors.phoneNumber}</p>}
            </div>

            {/* Working Hours */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Standard Operating Hours</label>
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    name="workingHoursStart"
                    value={formData.workingHoursStart}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-dark-900 focus:border-dark-900 transition-all text-sm outline-none appearance-none cursor-pointer"
                  >
                    {timeOptions.map((time) => (
                      <option key={`start-${time}`} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <span className="text-sm font-medium text-gray-400">to</span>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    name="workingHoursEnd"
                    value={formData.workingHoursEnd}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-dark-900 focus:border-dark-900 transition-all text-sm outline-none appearance-none cursor-pointer"
                  >
                    {timeOptions.map((time) => (
                      <option key={`end-${time}`} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 mt-8 rounded-xl text-white font-bold text-sm shadow-md transition-all duration-300 bg-dark-900 hover:bg-black hover:shadow-dark-900/30 group"
            >
              Continue to Details
              <span aria-hidden="true" className="ml-2 group-hover:translate-x-1 inline-block transition-transform duration-200">&rarr;</span>
            </button>
          </form>

          <div className="mt-8 text-center sm:text-left">
            <p className="text-sm text-gray-500">
              Already have a business account?{" "}
              <Link to="/OwnerLogin" className="font-bold text-dark-900 hover:underline">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Right Image Section */}
      <div className="hidden md:block md:flex-1 relative bg-dark-900 overflow-hidden">
        <div className="absolute inset-0 bg-dark-900/30 mix-blend-multiply z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-dark-900/40 to-transparent z-10"></div>
        <img
          src={loginImage}
          alt="Professional Salon Space"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />

        <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 lg:p-20">
          <h2 className="text-4xl lg:text-5xl font-heading font-black text-white mb-6 leading-tight">
            Elevate Your Salon <br />
            <span className="text-gray-300 font-normal tracking-wide text-3xl">to the Next Level.</span>
          </h2>

          <div className="flex gap-8 mb-6">
            <div>
              <p className="text-white text-3xl font-bold">10k+</p>
              <p className="text-gray-400 text-sm mt-1">Bookings Monthly</p>
            </div>
            <div>
              <p className="text-white text-3xl font-bold">98%</p>
              <p className="text-gray-400 text-sm mt-1">Client Retention</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage1;
