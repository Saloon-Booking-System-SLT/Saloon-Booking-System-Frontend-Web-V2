import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./BookAnAppointment.css";

const API_BASE_URL = process.env.REACT_APP_API_URL ? 
  process.env.REACT_APP_API_URL.replace('/api', '') : 
  'https://saloon-booking-system-backend-v2.onrender.com';

const BookAnAppointment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get salon from state (for customer mode)
  const { salon: salonFromState } = location.state || {};
  
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState("Male");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state for customer information
  const [customerName, setCustomerName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  
  // State for salon data
  const [salon, setSalon] = useState(null);
  const [isOwnerMode, setIsOwnerMode] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Check authentication and fetch salon data
  useEffect(() => {
    const initializeBooking = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");
      
      console.log("🔍 Initializing booking...");
      console.log("Token exists:", !!token);
      console.log("User role:", role);
      console.log("Salon from state:", salonFromState);
      
      // Debug localStorage
      console.log("📦 Full localStorage check:");
      console.log("  - token:", token ? "exists" : "missing");
      console.log("  - userRole:", role || "NULL/MISSING");
      console.log("  - userEmail:", localStorage.getItem("userEmail") || "NULL");
      console.log("  - userName:", localStorage.getItem("userName") || "NULL");
      
      if (token && role === "owner") {
        // Owner mode - fetch their salon
        console.log("👤 Owner mode detected");
        setIsOwnerMode(true);
        setUserRole("owner");
        await fetchOwnerSalon(token);
      } else if (token && !role) {
        // Token exists but role is missing - this is the bug!
        console.error("⚠️ CRITICAL: Token exists but userRole is missing!");
        console.error("⚠️ This means login didn't save the role properly");
        console.error("⚠️ Please check your login component and save role to localStorage");
        setError("Session error. Please login again to continue.");
        setIsLoading(false);
      } else if (salonFromState) {
        // Customer/Guest mode with salon selected
        console.log("🛍️ Customer mode with salon");
        setIsOwnerMode(false);
        setUserRole(token && role === "customer" ? "customer" : "guest");
        setSalon(salonFromState);
        await fetchServicesForSalon(salonFromState._id);
      } else {
        // No salon available
        console.log("❌ No salon available");
        setIsOwnerMode(false);
        setUserRole(token && role === "customer" ? "customer" : "guest");
        setError("Please select a salon first");
        setIsLoading(false);
      }
    };
    
    initializeBooking();
  }, []);

  // Function to fetch owner's salon
  const fetchOwnerSalon = async (token) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("📡 Fetching owner's salon...");
      console.log("API URL:", `${API_BASE_URL}/api/salons/owner/my-salon`);
      
      // Fetch owner's salon using the correct endpoint
      const response = await fetch(`${API_BASE_URL}/api/salons/owner/my-salon`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Response status:", response.status);
      
      if (response.status === 401 || response.status === 403) {
        console.log("❌ Unauthorized - clearing session");
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");
        setIsOwnerMode(false);
        setError("Session expired. Please login again.");
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch salon: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Owner salon data:", data);
      
      if (!data || data.message?.includes("No salon found")) {
        setError("No salon found for your account. Please contact admin.");
        setIsLoading(false);
        return;
      }

      // Check approval status
      if (data.approvalStatus === 'pending') {
        setError("Your salon registration is pending approval. Please wait for admin approval.");
        setIsLoading(false);
        return;
      }

      if (data.approvalStatus === 'rejected') {
        setError(`Your salon registration was rejected. Reason: ${data.rejectionReason || 'Not specified'}`);
        setIsLoading(false);
        return;
      }
      
      // Data is already in the correct format from /api/owner/my-salon
      const salonData = {
        _id: data._id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        services: data.services,
        workingHours: data.workingHours,
        image: data.image,
        salonType: data.salonType,
        coordinates: data.coordinates
      };
      
      console.log("🏢 Salon data prepared:", salonData);
      setSalon(salonData);
      await fetchServicesForSalon(salonData._id);
      
    } catch (error) {
      console.error("❌ Error fetching owner salon:", error);
      setError("Failed to load salon information. Please try again.");
      setIsLoading(false);
    }
  };

  // Function to fetch services for a salon
  const fetchServicesForSalon = async (salonId) => {
    if (!salonId) {
      console.log("❌ No salon ID provided");
      setIsLoading(false);
      setError("Invalid salon ID");
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("📡 Fetching services for salon ID:", salonId);
      
      const response = await fetch(`${API_BASE_URL}/api/services/${salonId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Services data received:", data);
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format");
      }
      
      setServices(data);
      filterServices(data, searchQuery, selectedGender);
      setError(null);
      setIsLoading(false);
      
    } catch (err) {
      console.error("❌ Failed to load services", err);
      setError("Failed to load services. Please try again.");
      setIsLoading(false);
      setServices([]);
    }
  };

  useEffect(() => {
    if (salon && services.length > 0) {
      filterServices(services, searchQuery, selectedGender);
    }
  }, [searchQuery, selectedGender, services, salon]);

  const filterServices = (all, search, gender) => {
    let result = all.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );

    const isUnisex = salon?.salonType?.toLowerCase() === "unisex";
    
    if (isUnisex) {
      result = result.filter(
        (s) => s.gender?.toLowerCase() === gender.toLowerCase()
      );
    }

    setFilteredServices(result);
  };

  const toggleService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectedServices = services.filter((s) =>
    selectedServiceIds.includes(s._id)
  );

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const handleContinue = () => {
    if (selectedServices.length === 0) {
      alert("Please select at least one service");
      return;
    }
    
    // Validate customer info
    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }
    
    if (!contactInfo.trim()) {
      alert("Please enter phone number or email");
      return;
    }
    
    if (!salon) {
      alert("Salon information is missing");
      return;
    }
    
    console.log("✅ Continuing with:", {
      salon: salon.name,
      services: selectedServices.length,
      customer: customerName,
      isOwnerMode
    });
    
    navigate(`/owner-select-professional/${salon._id}`, {
      state: {
        salon,
        selectedServices,
        customerInfo: {
          name: customerName,
          contact: contactInfo,
          createAccount: createAccount
        },
        isOwnerMode: isOwnerMode,
        userRole: userRole
      },
    });
  };

  const handleBack = () => {
    if (isOwnerMode) {
      navigate("/owner/dashboard");
    } else {
      navigate(-1);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="loading-fullscreen">
        <div className="spinner"></div>
        <p>Loading salon information...</p>
      </div>
    );
  }

  // Show error if no salon or other errors
  if (error || !salon) {
    return (
      <div className="error-fullscreen">
        <div className="error-icon">⚠️</div>
        <h2>{error || "No Salon Found"}</h2>
        <p>
          {isOwnerMode 
            ? "Please make sure you have an approved salon registered to your account."
            : "Please select a salon first to book an appointment."}
        </p>
        <div className="error-actions">
          <button 
            className="back-button"
            onClick={handleBack}
          >
            {isOwnerMode ? "Go to Dashboard" : "Go Back"}
          </button>
          {!isOwnerMode && !localStorage.getItem("token") && (
            <button 
              className="login-button"
              onClick={handleLogin}
            >
              Login
            </button>
          )}
        </div>
      </div>
    );
  }

  const isUnisex = salon?.salonType?.toLowerCase() === "unisex";

  return (
    <div className="select-services-container">
      {/* Owner mode indicator */}
      {isOwnerMode && (
        <div className="owner-mode-banner">
          <span className="owner-badge">👤 Owner Mode</span>
          <span>Booking for: <strong>{salon.name}</strong></span>
          <span className="user-info">
            Logged in as: {localStorage.getItem("userEmail") || "Owner"}
          </span>
        </div>
      )}

      {/* Customer/Guest mode indicator */}
      {!isOwnerMode && userRole && (
        <div className={`user-mode-banner ${userRole}`}>
          <span className="user-badge">
            {userRole === "customer" ? "🛍️ Customer" : "👋 Guest"} Mode
          </span>
          <span>Booking at: <strong>{salon.name}</strong></span>
          {userRole === "customer" && (
            <span className="user-info">
              Logged in as: {localStorage.getItem("userEmail") || "Customer"}
            </span>
          )}
        </div>
      )}

      <div className="left-column">
        {/* Customer Information Form */}
        <div className="customer-info-form">
          <h3 className="form-title">
            {isOwnerMode ? "📋 Walk-in Customer Details" : "📅 Book An Appointment"}
          </h3>
          
          <div className="form-group">
            <label className="form-label">Customer Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Phone Number / Email *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter phone number or email"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
          </div>
          
          {!isOwnerMode && userRole === "guest" && (
            <div className="form-checkbox">
              <input
                type="checkbox"
                id="createAccount"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
              />
              <label htmlFor="createAccount" className="checkbox-label">
                Create an account for faster bookings
              </label>
            </div>
          )}
        </div>

        <p className="breadcrumb">
          <b>Services</b> &gt; Professional &gt; Time &gt; Confirm
        </p>

        <div className="heading-with-search">
          <h2>Select Services</h2>
          <input
            type="text"
            className="service-search-input"
            placeholder="🔍 Search service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Gender Switch for Unisex salons */}
        {isUnisex && (
          <div className="gender-switch">
            <button
              className={selectedGender === "Male" ? "active" : ""}
              onClick={() => setSelectedGender("Male")}
            >
              Male 👨‍🦱
            </button>
            <button
              className={selectedGender === "Female" ? "active" : ""}
              onClick={() => setSelectedGender("Female")}
            >
              Female 👩‍🦰
            </button>
          </div>
        )}

        {/* Services List */}
        <div className="select-services-list">
          {filteredServices.length === 0 ? (
            <div className="no-services-message">
              {services.length === 0 ? (
                <p>No services available for this salon.</p>
              ) : (
                <div>
                  <p>No services match your search.</p>
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="clear-search-button"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service._id}
                className={`select-services-card ${
                  selectedServiceIds.includes(service._id) ? "selected" : ""
                }`}
                onClick={() => toggleService(service._id)}
              >
                <img
                  src={
                    service.image
                      ? service.image.startsWith("http")
                        ? service.image
                        : `${API_BASE_URL}/uploads/${service.image}`
                      : "https://via.placeholder.com/100"
                  }
                  alt={service.name}
                  className="select-services-image"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/100";
                  }}
                />

                <div className="select-services-details">
                  <h4>{service.name}</h4>
                  <p>⏱️ {service.duration}</p>
                  <p className="price">LKR {service.price}</p>
                </div>
                <div className="checkbox-icon">
                  {selectedServiceIds.includes(service._id) ? "✔" : "☐"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="right-column">
        <div className="summary-box">
          <img
            src={
              salon?.image
                ? salon.image.startsWith("http")
                  ? salon.image
                  : `${API_BASE_URL}/uploads/${salon.image}`
                : "https://via.placeholder.com/150"
            }
            alt="Salon"
            className="salon-image"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/150";
            }}
          />

          <div className="salon-info">
            <h4>{salon?.name}</h4>
            <p>📍 {salon?.location}</p>
            {isOwnerMode && (
              <p className="owner-notice">
                <small>💼 Booking for walk-in customer</small>
              </p>
            )}

            {selectedServices.length === 0 ? (
              <p className="no-selection">No service selected</p>
            ) : (
              <ul className="selected-list">
                {selectedServices.map((s) => (
                  <li key={s._id}>
                    {s.name}
                    <span className="service-price">LKR {s.price}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="total-section">
            <p>Total</p>
            <p>
              <strong>
                {totalPrice === 0 ? "Free" : `LKR ${totalPrice}`}
              </strong>
            </p>
          </div>
          <button
            className="continue-button"
            onClick={handleContinue}
            disabled={selectedServiceIds.length === 0 || isLoading}
          >
            Continue to Professional Selection →
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default BookAnAppointment;