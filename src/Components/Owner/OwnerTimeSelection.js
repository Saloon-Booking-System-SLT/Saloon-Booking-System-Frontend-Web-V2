import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import "./BookAnAppointment.css";

const API_BASE_URL = process.env.REACT_APP_API_URL ? 
  process.env.REACT_APP_API_URL.replace('/api', '') : 
  'https://saloon-booking-system-backend-v2.onrender.com';

const OwnerSelectTimePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract data from location state
  const { 
    salon,
    selectedServices,
    selectedProfessional,
    customerInfo,
    isOwnerMode = true,
    userRole = "owner"
  } = location.state || {};
  
  const [availableSlots, setAvailableSlots] = useState({});
  const [selectedDates, setSelectedDates] = useState({});
  const [selectedTimes, setSelectedTimes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dates, setDates] = useState([]);

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

  // Helper: resolve professional id
  const resolveProfessionalId = useCallback((prof, currentServiceName) => {
    if (!prof) return null;
    if (typeof prof === "string" && prof.trim()) return prof;
    if (prof._id) return prof._id;
    if (prof.professionalId && typeof prof.professionalId === "string") return prof.professionalId;
    if (prof.professionalId && prof.professionalId._id) return prof.professionalId._id;
    if (currentServiceName && prof[currentServiceName]) {
      if (typeof prof[currentServiceName] === "string") return prof[currentServiceName];
      if (prof[currentServiceName]._id) return prof[currentServiceName]._id;
    }
    return null;
  }, []);

  // Fetch time slots
  const fetchTimeSlots = useCallback(async (professionalId, date) => {
    if (!professionalId || !date) {
      console.warn("fetchTimeSlots called without professionalId or date", { professionalId, date });
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/timeslots?professionalId=${professionalId}&date=${date}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const key = `${professionalId}-${date}`;
      
      // Filter out past time slots before setting state
      const filteredData = Array.isArray(data) ? data.filter(slot => {
        if (!slot.startTime) return false;
        return !isPastTimeSlot(date, slot.startTime);
      }) : [];
      
      setAvailableSlots(prev => ({ ...prev, [key]: filteredData }));
      console.debug("Fetched and filtered slots", key, filteredData.length, "of", data.length);
    } catch (err) {
      console.error("Error fetching time slots:", err);
      const key = `${professionalId}-${date}`;
      setAvailableSlots(prev => ({ ...prev, [key]: [] }));
    }
  }, [isPastTimeSlot]);

  // For owner mode, we show one service at a time
  const currentServiceIndex = 0;
  const currentService = selectedServices?.[currentServiceIndex] || {};
  const serviceKey = currentService.name || "service";
  const professionalId = resolveProfessionalId(selectedProfessional, currentService.name);
  const selectedDate = selectedDates[serviceKey] || dates[0]?.fullDate;
  const slotKey = professionalId && selectedDate ? `${professionalId}-${selectedDate}` : null;
  const rawSlots = slotKey ? availableSlots[slotKey] : [];
  const safeSlots = Array.isArray(rawSlots) ? rawSlots : [];

  // Filter out past time slots from displayed slots
  const displaySlots = useMemo(() => {
    return safeSlots.filter(slot => {
      if (!slot.startTime) return false;
      return !isPastTimeSlot(selectedDate, slot.startTime);
    });
  }, [safeSlots, selectedDate, isPastTimeSlot]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return selectedServices?.reduce((total, service) => {
      return total + (parseFloat(service.price) || 0);
    }, 0) || 0;
  }, [selectedServices]);

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

  // Initialize slots on component mount
  useEffect(() => {
    if (!selectedProfessional || !selectedServices || selectedServices.length === 0) return;

    const defaultDate = dates[0]?.fullDate;
    if (defaultDate && professionalId) {
      setSelectedDates(prev => ({ ...prev, [serviceKey]: defaultDate }));
      fetchTimeSlots(professionalId, defaultDate);
    }
  }, [selectedProfessional, selectedServices, dates, professionalId, serviceKey, fetchTimeSlots]);

  // Handlers
  const handleDateClick = (serviceName, profId, fullDate) => {
    setSelectedDates(prev => ({ ...prev, [serviceName]: fullDate }));
    setSelectedTimes(prev => ({ ...prev, [serviceName]: null }));
    fetchTimeSlots(profId, fullDate);
  };

  const handleTimeClick = (serviceName, slotId, isBooked) => {
    if (isBooked) return;
    setSelectedTimes(prev => ({ ...prev, [serviceName]: slotId }));
  };

const handleContinue = async () => {
  if (!selectedTimes[serviceKey]) {
    alert("❌ Please select a time for the service.");
    return;
  }

  if (!salon || !selectedServices || !customerInfo) {
    alert("❌ Missing booking information.");
    return;
  }

  setIsLoading(true);
  try {
    const slotId = selectedTimes[serviceKey];
    const date = selectedDates[serviceKey];
    const selectedSlot = displaySlots.find(s => 
      (s._id && s._id === slotId) || 
      (s.id && s.id === slotId) || 
      (s.startTime && s.startTime === slotId)
    );

    const startTime = selectedSlot?.startTime || selectedSlot?.start || "";
    const endTime = computeEndFromStartAndDuration(startTime, currentService.duration);

    // Debug: Log API details
    console.log("🔧 API_BASE_URL:", API_BASE_URL);
    console.log("🔧 Token exists:", !!localStorage.getItem("token"));
    
    // Try the MAIN appointments endpoint (same as customer booking)
    const appointmentData = {
      phone: customerInfo.contact || "",
      email: customerInfo.email || "",
      name: customerInfo.name || "Walk-in Customer",
      appointments: [{
        salonId: salon._id,
        professionalId: professionalId,
        serviceName: currentService.name,
        price: currentService.price,
        duration: currentService.duration,
        date: date,
        startTime: startTime,
        endTime: endTime,
        professionalName: selectedProfessional?.name || "Any Professional",
        walkIn: true, // Mark as walk-in appointment
        bookedByOwner: true // Mark as booked by owner
      }]
    };

    console.log("📤 Creating appointment via main endpoint:", appointmentData);
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
      // Handle HTML/error response
      const text = await response.text();
      console.error("❌ Non-JSON response received:", text.substring(0, 200));
      
      // Check if it's a login/authentication error
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

    // Navigate to confirmation
    const confirmationData = {
      salonName: salon.name,
      appointmentDetails: [{
        serviceName: currentService.name,
        price: currentService.price,
        duration: currentService.duration,
        date: date,
        startTime: startTime,
        endTime: endTime,
        professionalName: selectedProfessional?.name || "Any Professional",
        memberName: customerInfo.name || "Walk-in Customer"
      }],
      totalAmount: totalAmount,
      bookingId: result.data?.[0]?._id || `booking-${Date.now()}`,
      customerName: customerInfo.name || "Walk-in Customer",
      customerInfo: customerInfo,
      isGroupBooking: false,
      salonLocation: salon.location,
      professionalName: selectedProfessional?.name || "Any Professional",
      services: selectedServices,
      appointmentId: result.data?.[0]?._id,
      isOwnerMode: true,
      salon: salon,
      // For fallback if API fails
      isLocalBooking: !result.success
    };

    // If API failed but we want to proceed locally (temporary solution)
    if (!result.success) {
      console.warn("⚠️ API failed, using local booking fallback");
      confirmationData.isLocalBooking = true;
      confirmationData.bookingId = `local-${Date.now()}`;
      
      // Save to localStorage as fallback
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
    
    // Offer fallback option - FIXED: Use window.confirm() instead of confirm()
    if (window.confirm(`Failed to create appointment: ${error.message}\n\nWould you like to save this booking locally and proceed?`)) {
      // Save locally and navigate to confirmation
      const slotId = selectedTimes[serviceKey];
      const date = selectedDates[serviceKey];
      const selectedSlot = displaySlots.find(s => 
        (s._id && s._id === slotId) || 
        (s.id && s.id === slotId) || 
        (s.startTime && s.startTime === slotId)
      );
      
      const startTime = selectedSlot?.startTime || selectedSlot?.start || "";
      const endTime = computeEndFromStartAndDuration(startTime, currentService.duration);
      
      const localBookingId = `local-${Date.now()}`;
      const confirmationData = {
        salonName: salon.name,
        appointmentDetails: [{
          serviceName: currentService.name,
          price: currentService.price,
          duration: currentService.duration,
          date: date,
          startTime: startTime,
          endTime: endTime,
          professionalName: selectedProfessional?.name || "Any Professional",
          memberName: customerInfo.name || "Walk-in Customer"
        }],
        totalAmount: totalAmount,
        bookingId: localBookingId,
        customerName: customerInfo.name || "Walk-in Customer",
        customerInfo: customerInfo,
        isGroupBooking: false,
        salonLocation: salon.location,
        professionalName: selectedProfessional?.name || "Any Professional",
        services: selectedServices,
        appointmentId: localBookingId,
        isOwnerMode: true,
        salon: salon,
        isLocalBooking: true,
        errorMessage: error.message
      };
      
      // Save to localStorage
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="loading-fullscreen">
        <div className="spinner"></div>
        <p>Loading time slots...</p>
      </div>
    );
  }

  // Show error if no data
  if (!salon || !selectedServices || selectedServices.length === 0) {
    return (
      <div className="error-fullscreen">
        <div className="error-icon">⚠️</div>
        <h2>No Booking Information Found</h2>
        <p>Please start over from the owner dashboard.</p>
        <div className="error-actions">
          <button 
            className="back-button"
            onClick={() => navigate("/owner/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Get customer name
  const customerName = customerInfo?.name || "Walk-in Customer";

  return (
    <div className="select-services-container">
      {/* Owner mode indicator */}
      <div className="owner-mode-banner">
        <span className="owner-badge">👤 Owner Mode</span>
        <span>Booking for: <strong>{salon.name}</strong></span>
        <span className="customer-info">
          Customer: <strong>{customerName}</strong>
        </span>
      </div>

      <div className="left-column">
        <p className="breadcrumb">
          Services &gt; Professional &gt; <b>Time</b> &gt; Confirmation
        </p>
        
        <div className="heading-with-search">
          <h2>Select Time</h2>
          <p className="subheading">
            Choose time for {currentService.name}
          </p>
        </div>

        <h3 className="service-title">
          For: {currentService.name}
        </h3>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="date-buttons">
          {dates.map(day => (
            <button
              key={day.fullDate}
              className={`date-button ${selectedDates[serviceKey] === day.fullDate ? "selected" : ""}`}
              onClick={() => handleDateClick(serviceKey, professionalId, day.fullDate)}
            >
              <span>{day.date}</span><small>{day.day}</small>
            </button>
          ))}
        </div>

        {!professionalId && (
          <div className="warning-message">
            <strong>No professional selected</strong>
            <p>Please go back and select a professional.</p>
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
              const isSelected = selectedTimes[serviceKey] === slotId;
              const isBooked = !!slot.isBooked;
              
              const displayStartTime = slot.startTime || slot.start;
              const displayEndTime = computeEndFromStartAndDuration(displayStartTime, currentService.duration);

              return (
                <div
                  key={slotId}
                  className={`select-services-card ${isBooked ? "disabled" : isSelected ? "selected" : ""}`}
                  onClick={() => handleTimeClick(serviceKey, slotId, isBooked)}
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
            <p className="salon-location">📍 {salon?.location}</p>
            
            <div className="customer-info-display">
              <p><strong>Customer:</strong> {customerName}</p>
              <p><strong>Contact:</strong> {customerInfo?.contact || "Not provided"}</p>
            </div>

            <div className="services-summary">
              <h5>Selected Services:</h5>
              <ul className="selected-services-list">
                {selectedServices?.map((s, index) => {
                  const assignedPro = selectedProfessional && 
                    (selectedProfessional[s.name] || selectedProfessional.name || selectedProfessional);
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
                            <small>👤 {typeof assignedPro === 'object' ? assignedPro.name : assignedPro}</small>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {selectedTimes[serviceKey] && selectedDate && (
              <div className="time-selection-display">
                <p><strong>Selected Time:</strong></p>
                <p>
                  <CalendarDaysIcon className="h-4 w-4 inline mr-1" /> 
                  {new Date(selectedDate).toDateString()} 
                  <ClockIcon className="h-4 w-4 inline mr-1" /> 
                  {displaySlots.find(s => 
                    (s._id === selectedTimes[serviceKey] || 
                     s.id === selectedTimes[serviceKey] || 
                     s.startTime === selectedTimes[serviceKey]))?.startTime}
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
              disabled={!selectedTimes[serviceKey] || isLoading}
            >
              {isLoading ? "Creating Appointment..." : "Confirm Booking →"}
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

      {isLoading && (
        <div className="loading-overlay">
          <div className="loader">
            <div className="loader-dots"><div></div><div></div><div></div></div>
            <p>Creating appointment...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerSelectTimePage;