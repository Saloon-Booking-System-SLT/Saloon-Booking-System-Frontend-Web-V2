// Individual Booking SelectTimePage.jsx - Hide Past Times
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import "./SelectTimePage.css";
import { filterMatchingSlots } from "../../Utils/slotUtils";

const API_BASE_URL = process.env.REACT_APP_API_URL ? 
  process.env.REACT_APP_API_URL.replace('/api', '') : 
  'https://saloon-booking-system-backend-v2.onrender.com';

const SelectTimePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const passedServices = location.state?.selectedServices || JSON.parse(localStorage.getItem("selectedServices")) || [];
  const passedProfessional = location.state?.selectedProfessional || JSON.parse(localStorage.getItem("selectedProfessional")) || null;
  const salon = location.state?.salon || JSON.parse(localStorage.getItem("selectedSalon")) || null;
  const rescheduleAppointment = location.state?.rescheduleAppointment || null;
  const isReschedule = !!rescheduleAppointment;

  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showGuestAlert, setShowGuestAlert] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  const [selectedServices, setSelectedServices] = useState(passedServices);
  const [selectedProfessional, setSelectedProfessional] = useState(passedProfessional);
  const currentServiceIndex = useRef(0);
  const [renderKey, setRenderKey] = useState(0);
  const [selectedDates, setSelectedDates] = useState({});
  const [selectedTimes, setSelectedTimes] = useState({});
  const [availableSlots, setAvailableSlots] = useState({});
  const [loading, setLoading] = useState(false);

  // Store all booked appointments for multi-service booking
  const [bookedAppointments, setBookedAppointments] = useState([]);

  // Calculate total amount for all services
  const totalAmount = useMemo(() => {
    return selectedServices.reduce((total, service) => {
      return total + (parseFloat(service.price) || 0);
    }, 0);
  }, [selectedServices]);

  // Check if appointment is within 24 hours
  const isWithin24Hours = useCallback((appointmentDate, appointmentStartTime) => {
    if (!appointmentDate || !appointmentStartTime) return false;
    
    try {
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentStartTime}:00`);
      const now = new Date();
      
      // Calculate difference in milliseconds
      const timeDifference = appointmentDateTime.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      
      console.log("⏰ Time check:", {
        appointmentDateTime,
        now,
        hoursDifference,
        isWithin24Hours: hoursDifference <= 24
      });
      
      return hoursDifference <= 24;
    } catch (error) {
      console.error("Error checking time:", error);
      return false;
    }
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

  // Check user authentication status on mount and when location changes
  useEffect(() => {
    const checkAuthStatus = () => {
      // Check for regular user
      const storedUser = localStorage.getItem("user");
      const guestUser = localStorage.getItem("guestUser");
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsGuest(false);
        setShowGuestAlert(false); // Close guest alert if user is now logged in
      } else if (guestUser) {
        const guestData = JSON.parse(guestUser);
        setUser(guestData);
        setIsGuest(true);
      } else {
        // No user at all
        setUser(null);
        setIsGuest(false);
      }
    };
    
    checkAuthStatus();
  }, [location]); // Re-run when location changes (after login redirect)

  // Check for login success in location state
  useEffect(() => {
    if (location.state?.loginSuccess && location.state?.userData) {
      // User logged in successfully
      setUser(location.state.userData);
      setIsGuest(false);
      setShowGuestAlert(false);
      
      // Clear the state to prevent infinite loop
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Restore booking data after login
  useEffect(() => {
    const pendingBookingData = localStorage.getItem('pendingBookingData');
    
    if (pendingBookingData && user && !isGuest) {
      try {
        const data = JSON.parse(pendingBookingData);
        
        console.log("🔄 Restoring booking data after login:", data);
        
        // Restore booking state
        if (data.selectedServices && data.selectedServices.length > 0) {
          setSelectedServices(data.selectedServices);
        }
        
        if (data.selectedProfessional) {
          setSelectedProfessional(data.selectedProfessional);
        }
        
        if (data.selectedDates && Object.keys(data.selectedDates).length > 0) {
          setSelectedDates(data.selectedDates);
        }
        
        if (data.selectedTimes && Object.keys(data.selectedTimes).length > 0) {
          setSelectedTimes(data.selectedTimes);
        }
        
        if (data.bookedAppointments && data.bookedAppointments.length > 0) {
          setBookedAppointments(data.bookedAppointments);
        }
        
        if (data.currentServiceIndex !== undefined) {
          currentServiceIndex.current = data.currentServiceIndex;
        }
        
        // Clear the pending booking data from localStorage
        localStorage.removeItem('pendingBookingData');
        
        // Force re-render
        setRenderKey(prev => prev + 1);
        
      } catch (error) {
        console.error("Error restoring booking data:", error);
        localStorage.removeItem('pendingBookingData');
      }
    }
  }, [user, isGuest]);

  // Stable dates for next 7 days
  const dates = useMemo(() => {
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
    return days;
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
    if (rescheduleAppointment?.professionalId) {
      if (typeof rescheduleAppointment.professionalId === "string") return rescheduleAppointment.professionalId;
      if (rescheduleAppointment.professionalId._id) return rescheduleAppointment.professionalId._id;
    }
    return null;
  }, [rescheduleAppointment]);

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

  // Initialize reschedule data
  useEffect(() => {
    if (!isReschedule || !rescheduleAppointment) return;
    
    console.log("🔄 Initializing reschedule data:", rescheduleAppointment);
    
    if (rescheduleAppointment.professionalId) {
      setSelectedProfessional(rescheduleAppointment.professionalId);
    }
    
    if (rescheduleAppointment.services?.length) {
      const mapped = rescheduleAppointment.services.map(s => ({
        name: s.name,
        price: s.price,
        duration: s.duration || "30 minutes",
      }));
      setSelectedServices(mapped);
      
      // Set selected date and time for the rescheduled appointment
      const serviceName = mapped[0]?.name;
      if (serviceName && rescheduleAppointment.date) {
        setSelectedDates(prev => ({ ...prev, [serviceName]: rescheduleAppointment.date }));
      }
    }
  }, [isReschedule, rescheduleAppointment]);

  // Fetch slots for current service
  useEffect(() => {
    if (!selectedProfessional || selectedServices.length === 0) return;
    
    const currentService = selectedServices[currentServiceIndex.current];
    if (!currentService) return;

    let professionalId = null;
    
    if (selectedProfessional._id) {
      professionalId = selectedProfessional._id;
    } else if (selectedProfessional[currentService.name]?._id) {
      professionalId = selectedProfessional[currentService.name]._id;
    } else if (Array.isArray(selectedProfessional) && selectedProfessional.length > 0) {
      professionalId = selectedProfessional[0]?._id;
    } else if (selectedProfessional.professionalId) {
      professionalId = selectedProfessional.professionalId;
    } else if (typeof selectedProfessional === 'string') {
      professionalId = selectedProfessional;
    }

    if (!professionalId) {
      console.error("No professional ID found");
      return;
    }

    // For reschedule: use the appointment's date, otherwise use today
    const defaultDate = isReschedule && rescheduleAppointment?.date 
      ? rescheduleAppointment.date 
      : dates[0]?.fullDate;

    if (defaultDate) {
      setSelectedDates((prev) => ({ ...prev, [currentService.name]: defaultDate }));
      setSelectedTimes(prev => ({ ...prev, [currentService.name]: null }));
      fetchTimeSlots(professionalId, defaultDate);
    }
  }, [selectedProfessional, selectedServices, isReschedule, rescheduleAppointment, dates, fetchTimeSlots]);

  // Build derived values for current service
  const currentService = useMemo(() => {
    return selectedServices[currentServiceIndex.current] || {};
  }, [selectedServices, currentServiceIndex.current]);

  const serviceKey = currentService.name || "service";
  const professionalId = resolveProfessionalId(selectedProfessional, currentService.name);
  const selectedDate = selectedDates[serviceKey] || dates[0]?.fullDate;
  const slotKey = professionalId && selectedDate ? `${professionalId}-${selectedDate}` : null;
  const rawSlots = slotKey ? availableSlots[slotKey] : [];
  const safeSlots = Array.isArray(rawSlots) ? rawSlots : [];
  const filteredSlots = currentService.duration ? filterMatchingSlots(safeSlots, currentService.duration) : safeSlots;

  // Filter out past time slots from displayed slots
  const displaySlots = useMemo(() => {
    return filteredSlots.filter(slot => {
      if (!slot.startTime) return false;
      return !isPastTimeSlot(selectedDate, slot.startTime);
    });
  }, [filteredSlots, selectedDate, isPastTimeSlot]);

  // Handlers
  const handleDateClick = (serviceName, profId, fullDate) => {
    setSelectedDates(prev => ({ ...prev, [serviceName]: fullDate }));
    setSelectedTimes(prev => ({ ...prev, [serviceName]: null }));
    fetchTimeSlots(profId, fullDate);
  };

  const handleTimeClick = (serviceName, slotId, isBooked) => {
    if (isBooked) return;
    
    // Check if rescheduling within 24 hours
    if (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)) {
      setRescheduleError("❌ Cannot reschedule appointment within 24 hours.");
      return;
    }
    
    setSelectedTimes(prev => ({ ...prev, [serviceName]: slotId }));
  };

  // Compute end time helper - FIXED VERSION
  const computeEndFromStartAndDuration = (startTime, durationStr) => {
    if (!startTime) return "";
    
    // Parse duration string (e.g., "30 minutes", "1 hour 30 minutes")
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
    
    // If no duration parsed, default to 30 minutes
    if (totalMinutes === 0) totalMinutes = 30;
    
    // Parse start time
    const [hours, minutes] = startTime.split(":").map(Number);
    
    // Add duration
    const totalStartMinutes = hours * 60 + minutes;
    const totalEndMinutes = totalStartMinutes + totalMinutes;
    
    // Calculate end time
    const endHours = Math.floor(totalEndMinutes / 60) % 24;
    const endMinutes = totalEndMinutes % 60;
    
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
  };

  // Get current appointment data - FIXED VERSION
  const getCurrentAppointmentData = useCallback(() => {
    const slotId = selectedTimes[serviceKey];
    const date = selectedDates[serviceKey];
    const selectedSlot = displaySlots.find(s => 
      (s._id && s._id === slotId) || 
      (s.id && s.id === slotId) || 
      (s.startTime && s.startTime === slotId)
    );

    const startTime = selectedSlot?.startTime || selectedSlot?.start || "";
    const endTime = computeEndFromStartAndDuration(startTime, currentService.duration);

    console.log("📅 Current appointment data:", {
      startTime,
      duration: currentService.duration,
      calculatedEndTime: endTime
    });

    return {
      salonId: salon?._id,
      professionalId: professionalId,
      serviceName: currentService.name,
      price: currentService.price,
      duration: currentService.duration,
      date: date,
      startTime: startTime,
      endTime: endTime,
      professionalName: selectedProfessional?.name || "Any Professional",
      memberName: user?.name || "Guest",
      phone: user?.phone || "",
      email: user?.email || "",
    };
  }, [selectedTimes, serviceKey, selectedDates, displaySlots, currentService, professionalId, selectedProfessional, salon, user]);

  // Check if user is authorized to book
  const isUserAuthorized = !isGuest && (user?.id !== 'guest');

  // Create appointment via API
  const createAppointment = async (appointmentData) => {
    try {
      setLoading(true);
      console.log("📤 Sending appointment data:", appointmentData);

      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: user?.phone || "",
          email: user?.email || "",
          name: user?.name || "Guest",
          appointments: [appointmentData]
        }),
      });

      const result = await response.json();
      console.log("📥 Server response:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create appointment");
      }

      return result.data[0];
    } catch (error) {
      console.error("❌ Error creating appointment:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle reschedule for individual booking - UPDATED with 24-hour check
  const handleReschedule = async () => {
    // Check if user is guest
    if (!isUserAuthorized) {
      setShowGuestAlert(true);
      return;
    }

    if (!selectedTimes[serviceKey]) {
      alert("❌ Please select a time for rescheduling.");
      return;
    }

    if (!rescheduleAppointment) {
      alert("❌ No appointment found to reschedule.");
      return;
    }

    // Check if appointment is within 24 hours
    if (isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)) {
      setRescheduleError("❌ You cannot reschedule an appointment that is within 24 hours. Please contact customer support.");
      return;
    }

    setLoading(true);
    try {
      const currentAppointment = getCurrentAppointmentData();
      
      // Validate the appointment data
      if (!currentAppointment.startTime || !currentAppointment.endTime) {
        throw new Error("Invalid time selection. Please select a valid time slot.");
      }
      
      console.log("🔄 Sending reschedule request:", {
        appointmentId: rescheduleAppointment._id,
        date: currentAppointment.date,
        startTime: currentAppointment.startTime,
        endTime: currentAppointment.endTime,
        professionalId: currentAppointment.professionalId
      });

      const response = await fetch(`${API_BASE_URL}/api/appointments/${rescheduleAppointment._id}/reschedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: currentAppointment.date,
          startTime: currentAppointment.startTime,
          endTime: currentAppointment.endTime,
          professionalId: currentAppointment.professionalId
        }),
      });

      const result = await response.json();
      console.log("📥 Reschedule API response:", result);

      if (result.success) {
        alert("✅ Appointment rescheduled successfully!");
        navigate("/appointments");
      } else {
        throw new Error(result.message || "Reschedule failed");
      }
    } catch (err) {
      console.error("❌ Reschedule failed:", err);
      alert(`❌ Reschedule failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle continue for multi-service booking
  const handleContinue = async () => {
    // Check if user is guest
    if (!isUserAuthorized) {
      setShowGuestAlert(true);
      return;
    }

    console.log("🔵 handleContinue called for service:", currentService.name);
    
    if (!selectedTimes[serviceKey]) {
      alert("❌ Please select a time for the current service.");
      return;
    }

    // Handle reschedule
    if (isReschedule) {
      await handleReschedule();
      return;
    }

    // Check if there are more services to book
    if (currentServiceIndex.current + 1 < selectedServices.length) {
      // Add current appointment to booked list and move to next service
      const currentAppointment = getCurrentAppointmentData();
      const updatedBookedAppointments = [...bookedAppointments, currentAppointment];
      
      console.log("💾 Saving appointment for:", currentAppointment.serviceName);
      console.log("📊 Total booked after save:", updatedBookedAppointments.length);
      
      setBookedAppointments(updatedBookedAppointments);
      
      // Move to next service
      currentServiceIndex.current += 1;
      setRenderKey(k => k + 1);
      
      const nextService = selectedServices[currentServiceIndex.current];
      if (nextService) {
        setSelectedTimes(prev => ({ ...prev, [nextService.name]: null }));
        
        // Auto-fetch slots for next service
        const nextProfessionalId = resolveProfessionalId(selectedProfessional, nextService.name);
        const nextDefaultDate = dates[0]?.fullDate;
        if (nextProfessionalId && nextDefaultDate) {
          setSelectedDates(prev => ({ ...prev, [nextService.name]: nextDefaultDate }));
          fetchTimeSlots(nextProfessionalId, nextDefaultDate);
        }
      }
    } else {
      // All services booked, add final appointment and create all appointments
      const currentAppointment = getCurrentAppointmentData();
      const finalAppointments = [...bookedAppointments, currentAppointment];
      
      console.log("💾 Final appointments to create:", finalAppointments.length);
      
      // Create all appointments
      await createAllAppointments(finalAppointments);
    }
  };

  // Create all appointments and navigate to confirmation
  const createAllAppointments = async (appointments) => {
    setLoading(true);
    try {
      const createdAppointments = [];
      
      // Create each appointment individually
      for (const appointmentData of appointments) {
        console.log("📤 Creating appointment:", appointmentData.serviceName);
        
        const createdAppointment = await createAppointment(appointmentData);
        createdAppointments.push(createdAppointment);
        
        console.log("✅ Created appointment:", createdAppointment._id);
      }
      
      console.log("🎉 All appointments created successfully:", createdAppointments.length);
      
      // Navigate to confirmation with all appointments
      navigateToConfirmation(createdAppointments);
      
    } catch (error) {
      console.error("❌ Failed to create appointments:", error);
      alert("❌ Failed to create appointments: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to confirmation for multi-service booking
  const navigateToConfirmation = (createdAppointments) => {
    const confirmationData = {
      salonName: salon?.name || "Our Salon",
      appointmentDetails: createdAppointments.map(appointment => ({
        serviceName: appointment.services[0].name,
        price: appointment.services[0].price,
        duration: appointment.services[0].duration,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        professionalName: selectedProfessional?.name || "Any Professional",
        memberName: user?.name || "Guest"
      })),
      totalAmount: totalAmount,
      bookingId: createdAppointments[0]?._id || `booking-${Date.now()}`,
      customerName: user?.name || "Guest",
      isGroupBooking: false,
      salonLocation: salon?.location,
      professionalName: selectedProfessional?.name || "Any Professional",
      services: selectedServices,
      appointmentId: createdAppointments[0]?._id,
      multipleAppointments: createdAppointments.length > 1
    };

    console.log("✅ Navigating to confirmation with data:", confirmationData);

    // Clear localStorage
    localStorage.removeItem('selectedServices');
    localStorage.removeItem('selectedProfessional');
    localStorage.removeItem('selectedSalon');
    localStorage.removeItem('pendingBookingData'); // Also clear pending booking data

    navigate("/confirmationpage", { state: confirmationData });
  };

  // Get all appointments for display (booked + current)
  const getAllAppointmentsForDisplay = useCallback(() => {
    const allAppointments = [...bookedAppointments];
    
    // If there's a current appointment selected, include it
    if (selectedTimes[serviceKey]) {
      allAppointments.push(getCurrentAppointmentData());
    }
    
    return allAppointments;
  }, [bookedAppointments, selectedTimes, serviceKey, getCurrentAppointmentData]);

  // Handle login/signup navigation
  const handleNavigateToLogin = () => {
    // Store current booking data in localStorage before navigating to login
    const bookingData = {
      selectedServices,
      selectedProfessional,
      salon,
      selectedDates,
      selectedTimes,
      bookedAppointments,
      currentServiceIndex: currentServiceIndex.current,
      isReschedule,
      rescheduleAppointment
    };
    
    localStorage.setItem('pendingBookingData', JSON.stringify(bookingData));
    
    navigate("/login/customer", { 
      state: { 
        redirectTo: window.location.pathname,
        stateData: location.state
      }
    });
    
    // Close the guest alert modal after navigation trigger
    setShowGuestAlert(false);
  };

  const appointmentsToDisplay = getAllAppointmentsForDisplay();
  const displayTotalAmount = appointmentsToDisplay.reduce((total, appointment) => {
    return total + (Number(appointment.price) || 0);
  }, 0);

  // No services selected
  if (selectedServices.length === 0) {
    return (
      <div className="SelectTimePage-container">
        <div className="left-column">
          <h2>No services selected</h2>
          <button onClick={() => navigate("/")}>Go back to services</button>
        </div>
      </div>
    );
  }

  // Render
  return (
    <div className="SelectTimePage-container" key={renderKey}>
      {/* Guest Alert Modal */}
      {showGuestAlert && (
        <div className="guest-alert-modal">
          <div className="guest-alert-content">
            <h3>🛑 Sign In Required</h3>
            <p>You're currently browsing as a guest. To book appointments, please sign in or create an account.</p>
            <div className="guest-alert-buttons">
              <button 
                className="guest-alert-primary"
                onClick={handleNavigateToLogin}
              >
                Sign In / Sign Up
              </button>
              <button 
                className="guest-alert-secondary"
                onClick={() => setShowGuestAlert(false)}
              >
                Continue as Guest (View Only)
              </button>
            </div>
            <p className="guest-alert-note">
              <small>Note: Guest users can browse but cannot make bookings.</small>
            </p>
          </div>
        </div>
      )}

      <div className="left-column">
        <p className="breadcrumb">Services &gt; Professional &gt; <b>Time</b> &gt; Confirmation</p>
        <h2 className="heading-with-search">
          {isReschedule ? "Reschedule" : "Select Time for"} {currentService.name}
        </h2>

        {isGuest && (
          <div className="guest-notice">
            <p>⚠️ You're browsing as a guest. <a onClick={() => setShowGuestAlert(true)} style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}>Sign in to book</a></p>
          </div>
        )}

        {isReschedule && (
          <div className="reschedule-notice">
            <p>🔁 You are rescheduling an existing appointment</p>
            {rescheduleAppointment.date && rescheduleAppointment.startTime && rescheduleAppointment.endTime && (
              <p>
                Current: {new Date(rescheduleAppointment.date).toLocaleDateString()} at {rescheduleAppointment.startTime} - {rescheduleAppointment.endTime}
                {isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime) && 
                  <span style={{color: 'red', fontWeight: 'bold'}}> (Within 24 hours - cannot reschedule)</span>
                }
              </p>
            )}
          </div>
        )}

        {rescheduleError && (
          <div className="reschedule-error">
            <p>{rescheduleError}</p>
          </div>
        )}

        {selectedServices.length > 1 && !isReschedule && (
          <div className="service-progress">
            <p>Service {currentServiceIndex.current + 1} of {selectedServices.length}</p>
            {bookedAppointments.length > 0 && (
              <p>✅ {bookedAppointments.length} service(s) already scheduled</p>
            )}
          </div>
        )}

        <div className="date-buttons">
          {dates.map(day => (
            <button
              key={day.fullDate}
              className={`date-button ${selectedDates[serviceKey] === day.fullDate ? "selected" : ""}`}
              onClick={() => handleDateClick(serviceKey, professionalId, day.fullDate)}
              disabled={isGuest || (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime))}
            >
              <span>{day.date}</span><small>{day.day}</small>
            </button>
          ))}
        </div>

        {!professionalId && (
          <div style={{ padding: 12, background: "#fff3cd", color: "#856404", borderRadius: 8, margin: "12px 0" }}>
            <strong>No professional selected</strong>
          </div>
        )}

        <div className="SelectTimePage-list">
          {!professionalId ? (
            <p>No professional selected</p>
          ) : !selectedDate ? (
            <p>Please select a date</p>
          ) : displaySlots.length === 0 ? (
            <p>
              No available time slots for {new Date(selectedDate).toLocaleDateString()}
              {isPastTimeSlot(selectedDate, "23:59") && (
                <span style={{display: 'block', color: '#666', fontSize: '0.9em', marginTop: '8px'}}>
                  ⏰ Today's available slots have passed. Please select a future date.
                </span>
              )}
            </p>
          ) : (
            displaySlots.map(slot => {
              const slotId = slot._id || slot.id || slot.startTime;
              const isSelected = selectedTimes[serviceKey] === slotId;
              const isBooked = !!slot.isBooked;
              
              // Calculate end time for display
              const displayStartTime = slot.startTime || slot.start;
              const displayEndTime = computeEndFromStartAndDuration(displayStartTime, currentService.duration);

              return (
                <div
                  key={slotId}
                  className={`SelectTimePage-card ${isBooked ? "disabled" : isSelected ? "selected" : ""} ${isGuest ? "guest-disabled" : ""}`}
                  onClick={() => {
                    if (isGuest || isBooked) return;
                    if (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)) {
                      setRescheduleError("❌ Cannot reschedule appointment within 24 hours.");
                      return;
                    }
                    handleTimeClick(serviceKey, slotId, isBooked);
                  }}
                  style={{ 
                    pointerEvents: isGuest || isBooked || (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)) ? "none" : "auto",
                    opacity: isGuest || (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)) ? 0.6 : 1
                  }}
                >
                  <p>{displayStartTime} - {displayEndTime}</p>
                  <p>{isBooked ? "❌ Booked" : `LKR ${currentService.price}`}</p>
                  {isGuest && (
                    <div className="guest-lock-icon">🔒</div>
                  )}
                  {isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime) && (
                    <div className="time-warning">⏰ Cannot reschedule</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="right-column">
        <div className="summary-box">
          <img
            src={salon?.image ? (salon.image.startsWith("http") ? salon.image : `${API_BASE_URL}/uploads/${salon.image}`) : "https://via.placeholder.com/150"}
            alt="Salon"
            className="salon-image"
          />
          <div className="salon-info">
            <h4>{salon?.name}</h4>
            <p>{salon?.location}</p>
            <p>💇 {currentService.name}</p>
            <p>👤 {selectedProfessional?.name || "Any"}</p>
            {selectedTimes[serviceKey] && selectedDate && (
              <p>
                <CalendarDaysIcon className="h-4 w-4 inline mr-1" /> 
                {new Date(selectedDate).toDateString()} 
                <ClockIcon className="h-4 w-4 inline mr-1" /> 
                {displaySlots.find(s => (s._id === selectedTimes[serviceKey] || s.id === selectedTimes[serviceKey] || s.startTime === selectedTimes[serviceKey]))?.startTime}
              </p>
            )}
            
            {/* Show all scheduled services */}
            {appointmentsToDisplay.length > 0 && (
              <div className="services-breakdown">
                <p><strong>Scheduled Services:</strong></p>
                {appointmentsToDisplay.map((appointment, index) => (
                  <div key={index} className="appointment-item">
                    <p style={{ fontSize: '0.9em', margin: '2px 0' }}>
                      <strong>{appointment.serviceName}</strong><br />
                      <CalendarDaysIcon className="h-4 w-4 inline mr-1" /> 
                      {new Date(appointment.date).toLocaleDateString()} 
                      <ClockIcon className="h-4 w-4 inline mr-1" /> 
                      {appointment.startTime} - {appointment.endTime}<br />
                      LKR {appointment.price}
                    </p>
                    {index < appointmentsToDisplay.length - 1 && <hr />}
                  </div>
                ))}
              </div>
            )}
            
            <div className="total-section">
              <p>Total Amount</p>
              <p><strong>LKR {displayTotalAmount}</strong></p>
            </div>
          </div>
          
          {isGuest ? (
            <div className="guest-action-section">
              <button 
                className="continue-button guest-disabled-btn"
                onClick={() => setShowGuestAlert(true)}
              >
                🔒 Sign In to Book Appointment
              </button>
              <p className="guest-action-note">
                <small>Guest users cannot make bookings. Please sign in to continue.</small>
              </p>
            </div>
          ) : (
            <button 
              className="continue-button" 
              onClick={handleContinue} 
              disabled={
                !selectedTimes[serviceKey] || 
                loading || 
                !isUserAuthorized || 
                (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime))
              }
              title={isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime) ? 
                "Cannot reschedule within 24 hours of appointment" : ""}
            >
              {loading ? "Processing..." : 
                isReschedule ? 
                  (isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime) ? 
                    "Reschedule Not Allowed (Within 24h)" : 
                    "Reschedule Appointment") :
                currentServiceIndex.current + 1 < selectedServices.length 
                  ? `Continue to Next Service (${currentServiceIndex.current + 1}/${selectedServices.length})`
                  : `Confirm All Services (LKR ${displayTotalAmount})`
              }
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loader">
            <div className="loader-dots"><div></div><div></div><div></div></div>
            <p>Processing your {isReschedule ? 'reschedule' : 'appointments'}...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectTimePage;