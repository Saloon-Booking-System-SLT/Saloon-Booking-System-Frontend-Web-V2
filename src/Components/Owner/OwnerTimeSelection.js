import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
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

const OwnerSelectTimePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
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

  // Extract data from location state
  const { 
    salon,
    selectedServices,
    selectedProfessional,
    customerInfo,
    isOwnerMode = true
  } = location.state || {};
  
  const [availableSlots, setAvailableSlots] = useState({});
  const [selectedDates, setSelectedDates] = useState({});
  const [selectedTimes, setSelectedTimes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState(null);
  const [dates, setDates] = useState([]);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0); // Track current service being scheduled

  // Initialize dates for next 7 days
  useEffect(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.getDate(),
        fullDate: date.toISOString().split("T")[0],
      });
    }
    setDates(days);
  }, []);

  // Check if time slot is in the past
  const isPastTimeSlot = useCallback((date, startTime) => {
    if (!date || !startTime) return true;
    
    try {
      const slotDateTime = new Date(`${date}T${startTime}:00`);
      const now = new Date();
      
      return slotDateTime < now;
    } catch (error) {
      console.error("Error checking if slot is past:", error);
      return true;
    }
  }, []);

  // Helper: resolve professional id for a specific service
  const resolveProfessionalId = useCallback((prof, serviceName) => {
    if (!prof) return null;
    
    // If selectedProfessional is an array of professionals for each service
    if (Array.isArray(selectedProfessional)) {
      const serviceProf = selectedProfessional.find(sp => sp.serviceName === serviceName);
      if (serviceProf) {
        if (typeof serviceProf.professionalId === "string") return serviceProf.professionalId;
        if (serviceProf.professionalId?._id) return serviceProf.professionalId._id;
      }
    }
    
    // If selectedProfessional is an object mapping service names to professionals
    if (selectedProfessional && typeof selectedProfessional === "object") {
      if (selectedProfessional[serviceName]) {
        const profData = selectedProfessional[serviceName];
        if (typeof profData === "string") return profData;
        if (profData._id) return profData._id;
        if (profData.professionalId) return profData.professionalId;
      }
    }
    
    // Fallback: if we have a single professional for all services
    if (typeof prof === "string" && prof.trim()) return prof;
    if (prof._id) return prof._id;
    if (prof.professionalId && typeof prof.professionalId === "string") return prof.professionalId;
    if (prof.professionalId && prof.professionalId._id) return prof.professionalId._id;
    
    return null;
  }, [selectedProfessional]);

  // Fetch time slots for a specific professional and date
  const fetchTimeSlots = useCallback(async (professionalId, date, serviceName) => {
    if (!professionalId || !date) {
      console.warn("fetchTimeSlots called without professionalId or date", { professionalId, date });
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/timeslots?professionalId=${professionalId}&date=${date}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const key = `${serviceName}-${professionalId}-${date}`;
      
      // Filter out past time slots before setting state
      const filteredData = Array.isArray(data) ? data.filter(slot => {
        if (!slot.startTime) return false;
        return !isPastTimeSlot(date, slot.startTime);
      }) : [];
      
      setAvailableSlots(prev => ({ ...prev, [key]: filteredData }));
      console.debug("Fetched and filtered slots", key, filteredData.length, "of", data.length);
    } catch (err) {
      console.error("Error fetching time slots:", err);
      const key = `${serviceName}-${professionalId}-${date}`;
      setAvailableSlots(prev => ({ ...prev, [key]: [] }));
    }
  }, [isPastTimeSlot]);

  // Get current service and its details
  const currentService = selectedServices?.[currentServiceIndex] || {};
  const serviceName = currentService.name || `service-${currentServiceIndex}`;
  const professionalId = resolveProfessionalId(selectedProfessional, currentService.name);
  
  // Get selected date for current service (default to first date)
  const selectedDate = selectedDates[serviceName] || dates[0]?.fullDate;
  
  // Get slots for current service
  const slotKey = professionalId && selectedDate ? `${serviceName}-${professionalId}-${selectedDate}` : null;

  // Filter out past time slots from displayed slots
  const displaySlots = useMemo(() => {
    const rawSlots = slotKey ? availableSlots[slotKey] : [];
    const safeSlots = Array.isArray(rawSlots) ? rawSlots : [];
    return safeSlots.filter(slot => {
      if (!slot.startTime) return false;
      return !isPastTimeSlot(selectedDate, slot.startTime);
    });
  }, [slotKey, availableSlots, selectedDate, isPastTimeSlot]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return selectedServices?.reduce((total, service) => {
      return total + (parseFloat(service.price) || 0);
    }, 0) || 0;
  }, [selectedServices]);

  // Check if all services have time slots selected
  const allServicesScheduled = useMemo(() => {
    if (!selectedServices) return false;
    return selectedServices.every(service => {
      const serviceKey = service.name || `service-${selectedServices.indexOf(service)}`;
      return selectedTimes[serviceKey] !== undefined && selectedTimes[serviceKey] !== null;
    });
  }, [selectedServices, selectedTimes]);

  // Compute end time helper
  const computeEndFromStartAndDuration = (startTime, durationStr) => {
    if (!startTime) return "";
    
    const parts = durationStr?.split(" ") || [];
    let totalMinutes = 0;
    
    for (let i = 0; i < parts.length; i += 2) {
      const val = parseInt(parts[i]);
      const unit = parts[i + 1]?.toLowerCase() || "";
      
      if (!isNaN(val)) {
        if (unit.includes("hour") || unit.includes("hr")) {
          totalMinutes += val * 60;
        } else if (unit.includes("min")) {
          totalMinutes += val;
        }
      }
    }
    
    if (totalMinutes === 0) totalMinutes = 30;
    
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalStartMinutes = hours * 60 + minutes;
    const totalEndMinutes = totalStartMinutes + totalMinutes;
    const endHours = Math.floor(totalEndMinutes / 60) % 24;
    const endMinutes = totalEndMinutes % 60;
    
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
  };

  // Initialize slots for all services on component mount
  useEffect(() => {
    if (!selectedProfessional || !selectedServices || selectedServices.length === 0) return;

    const defaultDate = dates[0]?.fullDate;
    
    // Initialize dates and fetch slots for each service
    selectedServices.forEach((service, index) => {
      const serviceKey = service.name || `service-${index}`;
      const profId = resolveProfessionalId(selectedProfessional, service.name);
      
      if (defaultDate && profId) {
        // Set default date for each service
        setSelectedDates(prev => ({ 
          ...prev, 
          [serviceKey]: prev[serviceKey] || defaultDate 
        }));
        
        // Fetch slots for each service
        fetchTimeSlots(profId, defaultDate, service.name);
      }
    });
  }, [selectedProfessional, selectedServices, dates, fetchTimeSlots, resolveProfessionalId]);

  // Navigate to next/previous service
  const handleNextService = () => {
    if (currentServiceIndex < selectedServices.length - 1) {
      setCurrentServiceIndex(prev => prev + 1);
    }
  };

  const handlePreviousService = () => {
    if (currentServiceIndex > 0) {
      setCurrentServiceIndex(prev => prev - 1);
    }
  };

  // Handlers
  const handleDateClick = (serviceName, profId, fullDate) => {
    setSelectedDates(prev => ({ ...prev, [serviceName]: fullDate }));
    setSelectedTimes(prev => ({ ...prev, [serviceName]: null }));
    fetchTimeSlots(profId, fullDate, serviceName);
  };

  const handleTimeClick = (serviceName, slotId, isBooked) => {
    if (isBooked) return;
    setSelectedTimes(prev => ({ ...prev, [serviceName]: slotId }));
  };

  const handleContinue = async () => {
    if (!allServicesScheduled) {
      alert("❌ Please select time slots for all services.");
      return;
    }

    if (!salon || !selectedServices || !customerInfo) {
      alert("❌ Missing booking information.");
      return;
    }

    setIsLoading(true);
    try {
      // Prepare appointments for all services
      const appointments = selectedServices.map(service => {
        const serviceKey = service.name;
        const slotId = selectedTimes[serviceKey];
        const date = selectedDates[serviceKey];
        const profId = resolveProfessionalId(selectedProfessional, service.name);
        
        // Get slot details
        const slotKey = `${serviceKey}-${profId}-${date}`;
        const serviceSlots = availableSlots[slotKey] || [];
        const selectedSlot = serviceSlots.find(s => 
          (s._id && s._id === slotId) || 
          (s.id && s.id === slotId) || 
          (s.startTime && s.startTime === slotId)
        );

        const startTime = selectedSlot?.startTime || selectedSlot?.start || "";
        const endTime = computeEndFromStartAndDuration(startTime, service.duration);

        // Get professional name
        let professionalName = "Any Professional";
        if (Array.isArray(selectedProfessional)) {
          const serviceProf = selectedProfessional.find(sp => sp.serviceName === service.name);
          professionalName = serviceProf?.name || professionalName;
        } else if (selectedProfessional && typeof selectedProfessional === "object") {
          if (selectedProfessional[service.name]) {
            const profData = selectedProfessional[service.name];
            professionalName = profData.name || profData.professionalName || professionalName;
          } else if (selectedProfessional.name) {
            professionalName = selectedProfessional.name;
          }
        }

        return {
          salonId: salon._id,
          professionalId: profId,
          serviceName: service.name,
          price: service.price,
          duration: service.duration,
          date: date,
          startTime: startTime,
          endTime: endTime,
          professionalName: professionalName,
          walkIn: true,
          bookedByOwner: true
        };
      });

      const appointmentData = {
        phone: customerInfo.contact || "",
        email: customerInfo.email || "",
        name: customerInfo.name || "Walk-in Customer",
        appointments: appointments
      };

      console.log("📤 Creating appointments via main endpoint:", appointmentData);
      console.log("📤 Endpoint:", `${API_BASE_URL}/api/appointments`);

      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(appointmentData),
      });

      // Check response type
      const contentType = response.headers.get("content-type");
      console.log("📥 Response status:", response.status);
      console.log("📥 Content-Type:", contentType);

      let result;
      
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("❌ Non-JSON response received:", text.substring(0, 200));
        
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed. Please login again.");
        } else if (response.status === 404) {
          throw new Error("API endpoint not found. Please check the server configuration.");
        } else {
          throw new Error(`Server error: ${response.status}. Please try again.`);
        }
      }

      console.log("📥 Server response:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create appointment");
      }

      // Prepare confirmation data
      const confirmationData = {
        salonName: salon.name,
        appointmentDetails: appointments.map(appointment => ({
          serviceName: appointment.serviceName,
          price: appointment.price,
          duration: appointment.duration,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          professionalName: appointment.professionalName,
          memberName: customerInfo.name || "Walk-in Customer"
        })),
        totalAmount: totalAmount,
        bookingId: result.data?.[0]?._id || `booking-${Date.now()}`,
        customerName: customerInfo.name || "Walk-in Customer",
        customerInfo: customerInfo,
        isGroupBooking: selectedServices.length > 1,
        salonLocation: salon.location,
        services: selectedServices,
        appointmentId: result.data?.[0]?._id,
        isOwnerMode: true,
        salon: salon,
        isLocalBooking: !result.success
      };

      // If API failed but we want to proceed locally
      if (!result.success) {
        console.warn("⚠️ API failed, using local booking fallback");
        confirmationData.isLocalBooking = true;
        confirmationData.bookingId = `local-${Date.now()}`;
        
        const localBookings = JSON.parse(localStorage.getItem("ownerLocalBookings") || "[]");
        localBookings.push({
          ...confirmationData,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem("ownerLocalBookings", JSON.stringify(localBookings));
      }

      navigate("/owner-confirmation", { state: confirmationData });

    } catch (error) {
      console.error("❌ Error creating appointment:", error);
      
      // Offer fallback option
      if (window.confirm(`Failed to create appointment: ${error.message}\n\nWould you like to save this booking locally and proceed?`)) {
        // Prepare local booking data
        const appointments = selectedServices.map(service => {
          const serviceKey = service.name;
          const slotId = selectedTimes[serviceKey];
          const date = selectedDates[serviceKey];
          const profId = resolveProfessionalId(selectedProfessional, service.name);
          
          const slotKey = `${serviceKey}-${profId}-${date}`;
          const serviceSlots = availableSlots[slotKey] || [];
          const selectedSlot = serviceSlots.find(s => 
            (s._id && s._id === slotId) || 
            (s.id && s.id === slotId) || 
            (s.startTime && s.startTime === slotId)
          );

          const startTime = selectedSlot?.startTime || selectedSlot?.start || "";
          const endTime = computeEndFromStartAndDuration(startTime, service.duration);

          let professionalName = "Any Professional";
          if (Array.isArray(selectedProfessional)) {
            const serviceProf = selectedProfessional.find(sp => sp.serviceName === service.name);
            professionalName = serviceProf?.name || professionalName;
          } else if (selectedProfessional && typeof selectedProfessional === "object") {
            if (selectedProfessional[service.name]) {
              const profData = selectedProfessional[service.name];
              professionalName = profData.name || profData.professionalName || professionalName;
            } else if (selectedProfessional.name) {
              professionalName = selectedProfessional.name;
            }
          }

          return {
            serviceName: service.name,
            price: service.price,
            duration: service.duration,
            date: date,
            startTime: startTime,
            endTime: endTime,
            professionalName: professionalName
          };
        });
        
        const localBookingId = `local-${Date.now()}`;
        const confirmationData = {
          salonName: salon.name,
          appointmentDetails: appointments,
          totalAmount: totalAmount,
          bookingId: localBookingId,
          customerName: customerInfo.name || "Walk-in Customer",
          customerInfo: customerInfo,
          isGroupBooking: selectedServices.length > 1,
          salonLocation: salon.location,
          services: selectedServices,
          appointmentId: localBookingId,
          isOwnerMode: true,
          salon: salon,
          isLocalBooking: true,
          errorMessage: error.message
        };
        
        const localBookings = JSON.parse(localStorage.getItem("ownerLocalBookings") || "[]");
        localBookings.push({
          ...confirmationData,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem("ownerLocalBookings", JSON.stringify(localBookings));
        
        navigate("/owner-confirmation", { state: confirmationData });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/owner-select-professional", {
      state: {
        salon,
        selectedServices,
        customerInfo,
        isOwnerMode: true,
        userRole: "owner"
      }
    });
  };

  // Get customer name
  const customerName = customerInfo?.name || "Walk-in Customer";

  return (
    <div className="modern-full-page">
      <div className="modern-layout">
        <Sidebar />
        
        <main className="modern-main-content">
          {/* Header */}
          <header className="modern-header">
            <div className="header-left">
              <h2>Select Time for Each Service</h2>
              <p className="welcome-message">
                Booking for walk-in customer at {salon.name}
              </p>
            </div>
            
            <div className="modern-header-right">
              {/* Profile section for owner mode */}
              {isOwnerMode && salon && (
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
            <div className="owner-mode-content-banner">
              <span className="owner-badge">👤 Owner Mode</span>
              <span>Booking for: <strong>{salon.name}</strong></span>
              <span className="customer-info">
                Customer: <strong>{customerName}</strong>
              </span>
            </div>

            {/* Multi-service navigation */}
            <div className="multi-service-navigation">
             
              
              <div className="service-navigation-buttons">
                <button
                  className="nav-button prev"
                  onClick={handlePreviousService}
                  disabled={currentServiceIndex === 0}
                >
                  ← Previous Service
                </button>
                <button
                  className="nav-button next"
                  onClick={handleNextService}
                  disabled={currentServiceIndex === selectedServices.length - 1}
                >
                  Next Service →
                </button>
              </div>
            </div>

            <div className="booking-content-wrapper">
              <div className="booking-left-panel">
                <p className="breadcrumb">
                  Services &gt; Professional &gt; <b>Time</b> &gt; Confirmation
                </p>
                
                <div className="heading-with-search">
                  <h2>Select Time for: {currentService.name}</h2>
                  <p className="subheading">
                    Service {currentServiceIndex + 1} of {selectedServices.length}
                  </p>
                </div>

                {error && (
                  <div className="error-message">
                    <p>{error}</p>
                  </div>
                )}

                <div className="date-buttons">
                  {dates.map(day => (
                    <button
                      key={day.fullDate}
                      className={`date-button ${selectedDates[serviceName] === day.fullDate ? "selected" : ""}`}
                      onClick={() => handleDateClick(serviceName, professionalId, day.fullDate)}
                    >
                      <span>{day.date}</span><small>{day.day}</small>
                    </button>
                  ))}
                </div>

                {!professionalId && (
                  <div className="warning-message">
                    <strong>No professional selected for this service</strong>
                    <p>Please go back and select a professional for {currentService.name}.</p>
                  </div>
                )}

                <div className="select-services-list">
                  {!professionalId ? (
                    <p>No professional selected</p>
                  ) : !selectedDate ? (
                    <p>Please select a date</p>
                  ) : displaySlots.length === 0 ? (
                    <div className="no-slots-message">
                      <p>No available time slots for {new Date(selectedDate).toLocaleDateString()}</p>
                      {isPastTimeSlot(selectedDate, "23:59") && (
                        <p className="past-slots-note">
                          ⏰ Today's available slots have passed. Please select a future date.
                        </p>
                      )}
                    </div>
                  ) : (
                    displaySlots.map(slot => {
                      const slotId = slot._id || slot.id || slot.startTime;
                      const isSelected = selectedTimes[serviceName] === slotId;
                      const isBooked = !!slot.isBooked;
                      
                      const displayStartTime = slot.startTime || slot.start;
                      const displayEndTime = computeEndFromStartAndDuration(displayStartTime, currentService.duration);

                      return (
                        <div
                          key={slotId}
                          className={`select-services-card ${isBooked ? "disabled" : isSelected ? "selected" : ""}`}
                          onClick={() => handleTimeClick(serviceName, slotId, isBooked)}
                          style={{ 
                            pointerEvents: isBooked ? "none" : "auto",
                            opacity: isBooked ? 0.6 : 1
                          }}
                        >
                          <div className="professional-info">
                            <div className="time-slot-icon">
                              <ClockIcon className="h-5 w-5" />
                            </div>
                            <div className="professional-details">
                              <h4>{displayStartTime} - {displayEndTime}</h4>
                              <p>{isBooked ? "❌ Already Booked" : `Available - LKR ${currentService.price}`}</p>
                              {slot.notes && (
                                <p className="pro-description">{slot.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="checkbox-icon">
                            {isBooked ? "✗" : (isSelected ? "✔" : "☐")}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="booking-right-panel">
                <div className="summary-box">
                  <img
                    src={
                      salon?.image
                        ? salon.image.startsWith("http")
                          ? salon.image
                          : `${API_BASE_URL}/uploads/${salon.image}`
                        : "https://picsum.photos/150/150?random=2"
                    }
                    alt="Salon"
                    className="salon-image"
                    onError={(e) => {
                      e.target.src = "https://picsum.photos/150/150?random=2";
                    }}
                  />
                  
                  <div className="salon-info">
                    <h4>{salon?.name}</h4>
                    <p className="salon-location">📍 {salon?.location}</p>
                    
                    <div className="customer-info-display">
                      <p><strong>Customer:</strong> {customerName}</p>
                      <p><strong>Contact:</strong> {customerInfo?.contact || "Not provided"}</p>
                    </div>

                    <div className="services-summary">
                      <h5>Selected Services and Times:</h5>
                      <ul className="selected-services-list">
                        {selectedServices?.map((service, index) => {
                          const serviceKey = service.name;
                          const hasTimeSlot = selectedTimes[serviceKey];
                          const slotDate = selectedDates[serviceKey];
                          const profId = resolveProfessionalId(selectedProfessional, service.name);
                          
                          // Get selected slot details
                          let slotInfo = "";
                          if (hasTimeSlot && slotDate && profId) {
                            const slotKey = `${serviceKey}-${profId}-${slotDate}`;
                            const serviceSlots = availableSlots[slotKey] || [];
                            const selectedSlot = serviceSlots.find(s => 
                              (s._id && s._id === selectedTimes[serviceKey]) || 
                              (s.id && s.id === selectedTimes[serviceKey]) || 
                              (s.startTime && s.startTime === selectedTimes[serviceKey])
                            );
                            
                            if (selectedSlot) {
                              const startTime = selectedSlot.startTime || selectedSlot.start;
                              slotInfo = ` - ${new Date(slotDate).toLocaleDateString()} at ${startTime}`;
                            }
                          }

                          return (
                            <li 
                              key={index} 
                              className={`service-item ${index === currentServiceIndex ? 'current-service' : ''}`}
                              onClick={() => setCurrentServiceIndex(index)}
                            >
                              <div>
                                <span className="service-name">{service.name}</span>
                                <span className="service-duration"> — {service.duration}</span>
                                {hasTimeSlot ? (
                                  <span className="time-selected-indicator">✓ Time selected{slotInfo}</span>
                                ) : (
                                  <span className="time-pending-indicator">⏰ Select time</span>
                                )}
                              </div>
                              <div>
                                <span className="service-price">LKR {service.price}</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Show selected time for current service */}
                    {selectedTimes[serviceName] && selectedDate && (
                      <div className="time-selection-display">
                        <p><strong>Selected Time for {currentService.name}:</strong></p>
                        <p>
                          <CalendarDaysIcon className="h-4 w-4 inline mr-1" /> 
                          {new Date(selectedDate).toDateString()} 
                          <ClockIcon className="h-4 w-4 inline mr-1" /> 
                          {displaySlots.find(s => 
                            (s._id === selectedTimes[serviceName] || 
                             s.id === selectedTimes[serviceName] || 
                             s.startTime === selectedTimes[serviceName]))?.startTime}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="total-section">
                    <p>Total</p>
                    <p>
                      <strong>LKR {totalAmount}</strong>
                    </p>
                  </div>
                  
                  <div className="button-group">
                    <button 
                      className="continue-button" 
                      onClick={handleContinue}
                      disabled={!allServicesScheduled || isLoading}
                      title={!allServicesScheduled ? "Please select time slots for all services" : ""}
                    >
                      {isLoading ? "Creating Appointment..." : "Confirm All Bookings →"}
                    </button>
                    <button 
                      className="back-button-secondary" 
                      onClick={handleBack}
                      disabled={isLoading}
                    >
                      ← Back to Professional Selection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loader">
            <div className="loader-dots"><div></div><div></div><div></div></div>
            <p>Creating appointments...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerSelectTimePage;