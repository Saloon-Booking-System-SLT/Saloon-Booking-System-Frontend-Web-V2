import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "./BookAnAppointment.css";
import logo from '../../Assets/logo.png';


const API_BASE_URL = process.env.REACT_APP_API_URL ? 
  process.env.REACT_APP_API_URL.replace('/api', '') : 
  'https://saloon-booking-system-backend-v2.onrender.com';

// ✅ Sidebar Component (same as dashboard)
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active item based on current path
  const getActiveItem = () => {
    if (location.pathname === '/dashboard') return 'dashboard';
    if (location.pathname === '/calendar') return 'calendar';
    if (location.pathname === '/services') return 'services';
    if (location.pathname === '/feedbacks') return 'feedbacks';
    if (location.pathname === '/professionals') return 'professionals';
    if (location.pathname === '/book-appointment') return 'book-appointment';
    if (location.pathname === '/owner-select-professional') return 'book-appointment';
    if (location.pathname === '/owner-select-time') return 'book-appointment';
    if (location.pathname === '/timeslots') return 'timeslots';
    return 'dashboard';
  };

  const [activeItem, setActiveItem] = useState(getActiveItem());

  const menuItems = [
    { icon: 'fas fa-home', path: '/dashboard', key: 'dashboard', title: 'Home' },
    { icon: 'fas fa-calendar-alt', path: '/calendar', key: 'calendar', title: 'Calendar' },
    { icon: 'fas fa-cut', path: '/services', key: 'services', title: 'Services' },
    { icon: 'fas fa-comment-alt', path: '/feedbacks', key: 'feedbacks', title: 'Feedbacks' },
    { icon: 'fas fa-users', path: '/professionals', key: 'professionals', title: 'Professionals' },
    { icon: 'fas fa-calendar-check', path: '/book-appointment', key: 'book-appointment', title: 'Book An Appointment' },
    { icon: 'fas fa-clock', path: '/timeslots', key: 'timeslots', title: 'Time Slots' },
  ];

  const handleNavigation = (path, key) => {
    setActiveItem(key);
    navigate(path);
  };

  return (
    <aside className="modern-sidebar">
      {/* Logo */}
      <img src={logo} alt="Brand Logo" className="modern-logo" />
      
      {/* Navigation Menu - Icon Only */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`nav-icon ${activeItem === item.key ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path, item.key)}
            title={item.title}
          >
            <i className={item.icon}></i>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div 
          className="nav-icon" 
          onClick={() => navigate('/help')}
          title="Help & Support"
        >
          <i className="fas fa-question-circle"></i>
        </div>
      </div>
    </aside>
  );
};

const SelectProfessionalPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ✅ Helper function for consistent image URL handling
  const getImageUrl = (image, type = 'default') => {
    if (!image) {
      return type === 'popup' 
        ? 'https://ui-avatars.com/api/?name=User&background=random&size=50&color=fff'
        : 'https://picsum.photos/150/150?random=3';
    }
    
    // If it's already a full URL
    if (image.startsWith('http')) {
      return image;
    }
    
    // Construct the full URL - removed /professionals/ subdirectory
    return `${API_BASE_URL}/uploads/${image}`;
  };

  // ✅ Logout function for owner mode
  const handleLogout = () => {
    const confirmLogout = window.confirm("Do you really want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      navigate("/OwnerLogin");
    }
  };

  // Extract data from location state with defaults
  const { 
    salon: salonFromState, 
    selectedServices: servicesFromState,
    customerInfo,
    isOwnerMode: isOwnerModeFromState,
    userRole: userRoleFromState
  } = location.state || {};
  
  const [professionals, setProfessionals] = useState([]);
  const [popupService, setPopupService] = useState(null);
  const [serviceProfessionals, setServiceProfessionals] = useState({});
  const [reviews, setReviews] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salon, setSalon] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isOwnerMode, setIsOwnerMode] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);

  // Initialize page data
  useEffect(() => {
    const initializePage = async () => {
      console.log("🔍 Initializing SelectProfessionalPage...");
      console.log("Location state:", location.state);
      
      // Check if we have the required data
      if (!salonFromState || !servicesFromState || servicesFromState.length === 0) {
        console.error("❌ Missing required data from previous page");
        setError("Missing booking information. Please start over.");
        setIsLoading(false);
        return;
      }
      
      // Set data from location state
      setSalon(salonFromState);
      setSelectedServices(servicesFromState);
      setIsOwnerMode(!!isOwnerModeFromState);
      setUserRole(userRoleFromState || localStorage.getItem("userRole") || "guest");
      
      // Calculate initial total price
      const initialTotal = servicesFromState.reduce((acc, s) => acc + s.price, 0);
      setTotalPrice(initialTotal);
      
      // Fetch professionals
      await fetchProfessionals(salonFromState._id);
    };
    
    initializePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug: Log professional images when they're loaded
  useEffect(() => {
    if (professionals.length > 0) {
      console.log('🖼️ Professional images:', professionals.map(p => ({
        name: p.name,
        image: p.image,
        constructedUrl: getImageUrl(p.image)
      })));
    }
  }, [professionals]);

  // Fetch professionals for this salon
  const fetchProfessionals = async (salonId) => {
    if (!salonId) {
      setError("Invalid salon ID");
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("📡 Fetching professionals for salon ID:", salonId);
      
      // ⚡ Use optimized endpoint - gets professionals with ratings in ONE call
      const response = await fetch(`${API_BASE_URL}/api/professionals/${salonId}/with-ratings`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Professionals data received:", data);
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format for professionals");
      }
      
      setProfessionals(data);
      
      // Build reviews object from the data (feedbacks already included)
      const reviewsObj = {};
      data.forEach(pro => {
        reviewsObj[pro._id] = pro.feedbacks || [];
      });
      setReviews(reviewsObj);
      setIsLoading(false);
      
    } catch (err) {
      console.error("❌ Failed to fetch professionals", err);
      setError("Failed to load professionals. Please try again.");
      setProfessionals([]);
      setIsLoading(false);
    }
  };

  // Calculate average rating for a professional
  const getAverageRating = (proId) => {
    const feedbacks = reviews[proId] || [];
    if (feedbacks.length === 0) return 0;
    const total = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
    return (total / feedbacks.length).toFixed(1);
  };

  // Get review count for a professional
  const getReviewCount = (proId) => {
    return reviews[proId]?.length || 0;
  };

  const openPopup = (service) => setPopupService(service);
  const closePopup = () => setPopupService(null);

  const handleSelectProForService = (serviceName, pro) => {
    setServiceProfessionals((prev) => ({
      ...prev,
      [serviceName]: pro,
    }));
    closePopup();
  };

  const handleContinue = () => {
    if (!salon) {
      alert("Salon information is missing");
      return;
    }
    
    if (selectedServices.length === 0) {
      alert("No services selected");
      return;
    }
    
    // Validate professional selection
    if (selectedServices.length > 1) {
      const assignedServices = Object.keys(serviceProfessionals);
      if (assignedServices.length !== selectedServices.length) {
        return alert("Please assign a professional for each service");
      }
    }
    
    // Prepare selected professional data
    const selectedProfessional = selectedServices.length === 1
      ? serviceProfessionals[selectedServices[0].name] || { name: "Any Professional", _id: "any" }
      : serviceProfessionals;

    console.log("✅ Continuing with:", {
      salon: salon.name,
      services: selectedServices.length,
      selectedProfessional,
      isOwnerMode
    });
    
    // Navigate to time selection
    navigate("/owner-select-time", {
      state: {
        salon,
        selectedServices,
        selectedProfessional,
        customerInfo,
        isOwnerMode,
        userRole
      },
    });
  };

  const handleBack = () => {
    navigate("/book-appointment", {
      state: {
        salon,
        isOwnerMode,
        userRole,
        ...(customerInfo && { customerInfo })
      }
    });
  };

  const handleReturnToSalons = () => {
    if (isOwnerMode) {
      navigate("/dashboard");
    } else {
      navigate("/salons");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="modern-full-page">
        <div className="modern-layout">
          <Sidebar />
          <main className="modern-main-content">
            <div className="loading-fullscreen">
              <div className="spinner"></div>
              <p>Loading professionals...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show error if no salon or other errors
  if (error || !salon) {
    return (
      <div className="modern-full-page">
        <div className="modern-layout">
          <Sidebar />
          <main className="modern-main-content">
            <div className="error-fullscreen">
              <div className="error-icon">⚠️</div>
              <h2>{error || "No Salon Information Found"}</h2>
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
                  Go Back to Services
                </button>
                <button 
                  className="secondary-button"
                  onClick={handleReturnToSalons}
                >
                  {isOwnerMode ? "Go to Dashboard" : "Browse Salons"}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Get customer name from customerInfo or local storage
  const customerName = customerInfo?.name || localStorage.getItem("userName") || "Customer";

  return (
    <div className="modern-full-page">
      <div className="modern-layout">
        <Sidebar />
        
        <main className="modern-main-content">
          {/* Header */}
          <header className="modern-header">
            <div className="header-left">
              <h2>Select Professional</h2>
              <p className="welcome-message">
                {isOwnerMode 
                  ? `Booking for walk-in customer at ${salon.name}`
                  : `Booking appointment at ${salon.name}`
                }
              </p>
            </div>
            
            <div className="modern-header-right">
              {/* Profile section for owner mode */}
              {isOwnerMode && salon && (
                <Link to={`/profile/${salon._id}`} className="profile-link">
                  <img
                    src={getImageUrl(salon.image)}
                    alt="Profile"
                    className="modern-profile"
                    onError={(e) => {
                      console.error('Failed to load salon profile image:', e.target.src);
                      e.target.onerror = null;
                      e.target.src = "https://ui-avatars.com/api/?name=User&background=random&size=40";
                    }}
                  />
                  <span className="profile-name">{salon.name}</span>
                </Link>
              )}

              {/* Logout Button for owner mode */}
              {isOwnerMode && (
                <button
                  className="logout-btn"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  Logout
                </button>
              )}
            </div>
          </header>

          {/* Main content */}
          <div className="booking-main-container">
            {/* Owner mode banner */}
            {isOwnerMode && (
              <div className="owner-mode-content-banner">
                <span className="owner-badge">👤 Owner Mode</span>
                <span>Booking for: <strong>{salon.name}</strong></span>
                <span className="customer-info">
                  Customer: <strong>{customerName}</strong>
                </span>
              </div>
            )}

            {/* Customer/Guest mode indicator */}
            {!isOwnerMode && userRole && (
              <div className={`user-mode-content-banner ${userRole}`}>
                <span className="user-badge">
                  {userRole === "customer" ? "🛍️ Customer" : "👋 Guest"} Mode
                </span>
                <span>Booking at: <strong>{salon.name}</strong></span>
                <span className="customer-info">
                  {customerName}
                  {userRole === "customer" && (
                    <span className="user-info">
                      (Logged in as: {localStorage.getItem("userEmail")})
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="booking-content-wrapper">
              <div className="booking-left-panel">
                <p className="breadcrumb">
                  Services &gt; <b>Professional</b> &gt; Time &gt; Confirm
                </p>
                
                <div className="heading-with-search">
                  <h2>Select Professionals</h2>
                  <p className="subheading">
                    Choose professionals for your selected services
                  </p>
                </div>

                {selectedServices.length === 1 ? (
                  <>
                    <h3 className="service-title">
                      For: {selectedServices[0].name}
                    </h3>
                    
                    <div className="select-services-list">
                      {/* Option for Any Professional */}
                      <div
                        className={`select-services-card ${
                          serviceProfessionals[selectedServices[0].name]?._id === "any"
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setServiceProfessionals({
                            [selectedServices[0].name]: {
                              name: "Any Professional",
                              _id: "any",
                              role: "Any available professional"
                            },
                          })
                        }
                      >
                        <div className="professional-info">
                          <div className="any-professional-icon">
                            <span>👤</span>
                          </div>
                          <div>
                            <h4>Any Professional</h4>
                            <p>Let us assign the best available professional</p>
                            <p style={{ fontSize: "13px", color: "#666", fontStyle: "italic" }}>
                              Fastest booking option
                            </p>
                          </div>
                        </div>
                        <div className="checkbox-icon">
                          {serviceProfessionals[selectedServices[0].name]?._id === "any"
                            ? "✔"
                            : "☐"}
                        </div>
                      </div>

                      {/* List of Professionals */}
                      {professionals.length === 0 ? (
                        <div className="no-professionals-message">
                          <p>No professionals available for this service.</p>
                          <button 
                            className="assign-btn"
                            onClick={() => handleSelectProForService(selectedServices[0].name, {
                              name: "Any Professional",
                              _id: "any",
                              role: "Any available professional"
                            })}
                          >
                            Select "Any Professional"
                          </button>
                        </div>
                      ) : (
                        professionals.map((pro) => {
                          const avgRating = getAverageRating(pro._id);
                          const reviewCount = getReviewCount(pro._id);

                          return (
                            <div
                              key={pro._id}
                              className={`select-services-card ${
                                serviceProfessionals[selectedServices[0].name]?._id ===
                                pro._id
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() =>
                                setServiceProfessionals({
                                  [selectedServices[0].name]: pro,
                                })
                              }
                            >
                              <div className="professional-info">
                                <img
                                  src={getImageUrl(pro.image)}
                                  alt={pro.name}
                                  className="service-image"
                                  onError={(e) => {
                                    console.error(`Failed to load image for ${pro.name}:`, e.target.src);
                                    e.target.onerror = null;
                                    e.target.src = "https://picsum.photos/150/150?random=3";
                                  }}
                                />
                                <div className="professional-details">
                                  <h4>{pro.name}</h4>
                                  <p>{pro.role}</p>
                                  <div className="rating-info">
                                    {reviewCount > 0 ? (
                                      <>
                                        <span className="star-rating">⭐ {avgRating}</span>
                                        <span className="review-count">
                                          ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                                        </span>
                                      </>
                                    ) : (
                                      <span className="no-reviews">No reviews yet</span>
                                    )}
                                  </div>
                                  {pro.description && (
                                    <p className="pro-description">
                                      {pro.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="checkbox-icon">
                                {serviceProfessionals[selectedServices[0].name]?._id ===
                                pro._id
                                  ? "✔"
                                  : "☐"}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="service-title">
                      Assign Professionals for Each Service
                    </h3>
                    <p className="instruction">
                      Please assign a professional for each service:
                    </p>
                    
                    <div className="select-services-list">
                      {selectedServices.map((service) => {
                        const assignedPro = serviceProfessionals[service.name];
                        return (
                          <div key={service._id} className="select-services-card">
                            <div className="service-header">
                              <div>
                                <h4>{service.name}</h4>
                                <p className="service-duration">⏱️ {service.duration}</p>
                                <p className="service-price">LKR {service.price}</p>
                              </div>
                              <div className="assignment-status">
                                <p className="assigned-professional">
                                  {assignedPro 
                                    ? `Assigned: ${assignedPro.name}`
                                    : "Not assigned"}
                                </p>
                                <button
                                  className="assign-btn"
                                  onClick={() => openPopup(service)}
                                >
                                  {assignedPro ? "Change" : "Assign"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="booking-right-panel">
                <div className="summary-box">
                  <img
                    src={getImageUrl(salon?.image)}
                    alt="Salon"
                    className="salon-image"
                    onError={(e) => {
                      console.error('Failed to load salon image:', e.target.src);
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/150";
                    }}
                  />
                  
                  <div className="salon-info">
                    <h4>{salon?.name}</h4>
                    <p className="salon-location">📍 {salon?.location}</p>
                    {isOwnerMode && (
                      <p className="owner-notice">
                        <small>💼 Booking for walk-in customer</small>
                      </p>
                    )}

                    <div className="services-summary">
                      <h5>Selected Services:</h5>
                      <ul className="selected-services-list">
                        {selectedServices?.map((s, index) => {
                          const assignedPro = serviceProfessionals[s.name];
                          return (
                            <li key={index} className="service-item">
                              <div>
                                <span className="service-name">{s.name}</span>
                                <span className="service-duration"> — {s.duration}</span>
                              </div>
                              <div>
                                <span className="service-price">LKR {s.price}</span>
                                {assignedPro && (
                                  <div className="assigned-pro-mini">
                                    <small>👤 {assignedPro.name}</small>
                                  </div>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  <div className="total-section">
                    <p>Total</p>
                    <p>
                      <strong>LKR {totalPrice}</strong>
                    </p>
                  </div>
                  
                  <div className="button-group">
                    <button 
                      className="continue-button" 
                      onClick={handleContinue}
                      disabled={
                        selectedServices.length > 1 && 
                        Object.keys(serviceProfessionals).length !== selectedServices.length
                      }
                    >
                      Continue to Time Selection →
                    </button>
                    <button 
                      className="back-button-secondary" 
                      onClick={handleBack}
                    >
                      ← Back to Services
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Popup to assign professional per service */}
      {popupService && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Select professional for {popupService.name}</h3>
              <button className="modal-close" onClick={closePopup}>×</button>
            </div>
            
            <div className="service-info-popup">
              <p className="popup-service-duration">⏱️ {popupService.duration}</p>
              <p className="popup-service-price">LKR {popupService.price}</p>
            </div>
            
            <div className="modal-content">
              {professionals.length === 0 ? (
                <div className="no-professionals-popup">
                  <p>No professionals available for this service.</p>
                  <button 
                    className="cancel-button"
                    onClick={closePopup}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="services-list">
                    {professionals.map((pro) => {
                      const avgRating = getAverageRating(pro._id);
                      const reviewCount = getReviewCount(pro._id);
                      
                      return (
                        <div
                          key={pro._id}
                          className={`service-card ${
                            serviceProfessionals[popupService.name]?._id === pro._id
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            handleSelectProForService(popupService.name, pro)
                          }
                        >
                          <div className="professional-info">
                            <img
                              src={getImageUrl(pro.image, 'popup')}
                              alt={pro.name}
                              className="pro-image-popup"
                              onError={(e) => {
                                console.error(`Failed to load popup image for ${pro.name}:`, e.target.src);
                                e.target.onerror = null;
                                e.target.src = "https://ui-avatars.com/api/?name=User&background=random&size=50&color=fff";
                              }}
                            />
                            <div className="pro-details-popup">
                              <h4>{pro.name}</h4>
                              <p>{pro.role}</p>
                              <div className="rating-info-popup">
                                {reviewCount > 0 ? (
                                  <>
                                    <span className="star-rating">⭐ {avgRating}</span>
                                    <span className="review-count">
                                      ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                                    </span>
                                  </>
                                ) : (
                                  <span className="no-reviews">No reviews yet</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="checkbox-icon">
                            {serviceProfessionals[popupService.name]?._id === pro._id
                              ? "✔"
                              : "☐"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="modal-actions">
                    <button 
                      className="cancel-button" 
                      onClick={closePopup}
                    >
                      Cancel
                    </button>
                    <button 
                      className="select-any-button"
                      onClick={() => handleSelectProForService(popupService.name, {
                        name: "Any Professional",
                        _id: "any",
                        role: "Any available professional"
                      })}
                    >
                      Select "Any Professional"
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectProfessionalPage;