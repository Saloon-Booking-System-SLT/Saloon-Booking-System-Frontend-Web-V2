import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { UserIcon, CreditCardIcon, DevicePhoneMobileIcon, MapPinIcon, ClockIcon, UsersIcon, ArrowPathIcon, PencilIcon, SparklesIcon, BuildingStorefrontIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import "./OwnerConfirmationPage.css";
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
    if (location.pathname === '/owner-confirmation') return 'book-appointment';
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

const OwnerConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    salonName = "Your Salon",
    appointmentDetails = [],
    totalAmount = 0,
    bookingId = `booking-${Date.now()}`,
    customerName = "Walk-in Customer",
    isGroupBooking = false,
    salonLocation = "",
    professionalName = "Any Professional",
    salon,
    customerInfo = {},
    isReschedule = false,
    appointmentId,
    isOwnerMode = true
  } = location.state || {};

  console.log("📋 Owner Confirmation Page Data:", {
    salonName,
    appointmentDetails,
    totalAmount,
    bookingId,
    customerName,
    customerInfo,
    isGroupBooking,
    isOwnerMode,
    appointmentId,
    isReschedule
  });

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

  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleViewCalendar = () => {
    navigate("/calendar");
  };

  const handleCreateAnotherBooking = () => {
    navigate("/book-appointment");
  };

  // Calculate total services and duration
  const getTotalServices = () => {
    return appointmentDetails.length;
  };

  const getTotalDuration = () => {
    return appointmentDetails.reduce((total, appointment) => {
      const duration = appointment.duration || "0 minutes";
      const hoursMatch = duration.match(/(\d+)\s*hour/);
      const minutesMatch = duration.match(/(\d+)\s*min/);
      
      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
      
      return total + (hours * 60) + minutes;
    }, 0);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${mins} minute${mins > 1 ? 's' : ''}`;
    }
  };

  // Get appropriate header message
  const getHeaderMessage = () => {
    if (isReschedule) {
      return "Appointment Rescheduled Successfully!";
    }
    return "Walk-in Booking Confirmed!";
  };

  // Get appropriate thank you message
  const getThankYouMessage = () => {
    if (isReschedule) {
      return `The appointment for ${customerName} has been successfully rescheduled at ${salonName}.`;
    }
    return `Walk-in booking for ${customerName} has been successfully created at ${salonName}. The appointment details have been added to your calendar.`;
  };

  return (
    <div className="modern-full-page">
      <div className="modern-layout">
        <Sidebar />
        
        <main className="modern-main-content">
          {/* Header */}
          <header className="modern-header">
            <div className="header-left">
              <h2>Booking Confirmation</h2>
              <p className="welcome-message">
                Booking confirmed for {customerName}
              </p>
            </div>
            
            <div className="modern-header-right">
              {/* Profile section for owner mode */}
              {salon && (
                <Link to={`/profile/${salon._id}`} className="profile-link">
                  <img
                    src={
                      salon.image
                        ? salon.image.startsWith("http")
                          ? salon.image
                          : `${API_BASE_URL}/uploads/${salon.image}`
                        : "https://ui-avatars.com/api/?name=User&background=random&size=40"
                    }
                    alt="Profile"
                    className="modern-profile"
                  />
                  <span className="profile-name">{salonName}</span>
                </Link>
              )}

              {/* Logout Button for owner mode */}
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          </header>

          {/* Main confirmation content */}
          <div className="confirmation-content-wrapper">
            <div className="confirmation-card">
              {/* Owner Mode Header */}
              <div className="owner-mode-header">
                <div className="owner-badge">
                  <BuildingStorefrontIcon className="h-5 w-5" />
                  <span>Owner Mode</span>
                </div>
                <span className="owner-saloon-name">{salonName}</span>
              </div>

              <div className="confirmation-header">
                <div className="success-icon">✅</div>
                <h1>{getHeaderMessage()}</h1>
                <p className="thank-you-message">
                  {getThankYouMessage()}
                </p>
                
                {/* Booking ID Display */}
                <div className="booking-id-display">
                  <IdentificationIcon className="h-4 w-4" />
                  <span>Booking ID: <strong>{appointmentId || bookingId}</strong></span>
                </div>
              </div>

              <div className="confirmation-details">
                <div className="booking-summary">
                  <h2>Booking Summary</h2>
                  
                  {/* Customer Information */}
                  <div className="customer-info-section">
                    <h3 className="section-title">
                      <UserIcon className="h-5 w-5" />
                      Customer Information
                    </h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span>Name:</span>
                        <strong>{customerName}</strong>
                      </div>
                      {customerInfo?.contact && (
                        <div className="info-item">
                          <span>Contact:</span>
                          <span>{customerInfo.contact}</span>
                        </div>
                      )}
                      {customerInfo?.email && (
                        <div className="info-item">
                          <span>Email:</span>
                          <span>{customerInfo.email}</span>
                        </div>
                      )}
                      {customerInfo?.notes && (
                        <div className="info-item full-width">
                          <span>Notes:</span>
                          <span className="customer-notes">{customerInfo.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Salon Information */}
                  <div className="salon-info-section">
                    <h3 className="section-title">
                      <BuildingStorefrontIcon className="h-5 w-5" />
                      Salon Information
                    </h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span>Salon:</span>
                        <strong>{salonName}</strong>
                      </div>
                      {salonLocation && (
                        <div className="info-item">
                          <span>Location:</span>
                          <span>{salonLocation}</span>
                        </div>
                      )}
                      <div className="info-item">
                        <span>Total Services:</span>
                        <strong>{getTotalServices()}</strong>
                      </div>
                      <div className="info-item">
                        <span>Total Duration:</span>
                        <strong>{formatDuration(getTotalDuration())}</strong>
                      </div>
                      <div className="info-item">
                        <span>Professional:</span>
                        <strong>{professionalName}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  {appointmentDetails.length > 0 && (
                    <div className="appointments-list">
                      <h3>Appointment Details</h3>
                      {appointmentDetails.map((appointment, index) => (
                        <div key={index} className="appointment-card">
                          <div className="appointment-details-grid">
                            <div className="detail-row">
                              <span className="detail-label">Service:</span>
                              <span className="detail-value">{appointment.serviceName || "Service"}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Professional:</span>
                              <span className="detail-value">{appointment.professionalName || professionalName}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Date:</span>
                              <span className="detail-value">{formatDate(appointment.date)}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Time:</span>
                              <span className="detail-value">{appointment.startTime} - {appointment.endTime}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">Duration:</span>
                              <span className="detail-value">{appointment.duration || "30 minutes"}</span>
                            </div>
                            <div className="detail-row price-row">
                              <span className="detail-label">Price:</span>
                              <span className="detail-value price">LKR {appointment.price?.toLocaleString() || "0"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="total-amount-section">
                    <div className="total-amount">
                      <span>Total Amount:</span>
                      <strong>LKR {totalAmount.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="owner-notes">
                  <h3>Owner Notes & Next Steps</h3>
                  <ul>
                    <li className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-orange-600" />
                      Appointment has been added to your salon calendar
                    </li>
                    <li className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4 text-purple-600" />
                      Professional has been notified about the booking
                    </li>
                    <li className="flex items-center gap-2">
                      <DevicePhoneMobileIcon className="h-4 w-4 text-blue-600" />
                      Customer can be notified via SMS if contact was provided
                    </li>
                    <li className="flex items-center gap-2">
                      <CreditCardIcon className="h-4 w-4 text-green-600" />
                      Payment status: <span className="payment-status pending">To be collected</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-blue-600" />
                      Ensure the workstation is prepared before the appointment time
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowPathIcon className="h-4 w-4 text-gray-600" />
                      You can modify this appointment anytime from your calendar
                    </li>
                    {isReschedule && (
                      <li className="flex items-center gap-2">
                        <PencilIcon className="h-4 w-4 text-indigo-600" />
                        Original time slot has been freed up for other bookings
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="confirmation-actions">
                <button 
                  className="btn-primary"
                  onClick={handleBackToDashboard}
                >
                  Back to Dashboard
                </button>
                <button 
                  className="btn-secondary"
                  onClick={handleViewCalendar}
                >
                  View Calendar
                </button>
                <button 
                  className="btn-tertiary"
                  onClick={handleCreateAnotherBooking}
                >
                  Create Another Booking
                </button>
              </div>

              <div className="confirmation-footer">
                <p className="flex items-center justify-center gap-2">
                  Booking managed successfully!
                  <SparklesIcon className="h-5 w-5 text-yellow-500" />
                </p>
                <p className="footer-note">
                  {appointmentId 
                    ? `Appointment ID: ${appointmentId} | Created on: ${new Date().toLocaleDateString()}`
                    : `Booking ID: ${bookingId} | Created on: ${new Date().toLocaleDateString()}`
                  }
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerConfirmationPage;