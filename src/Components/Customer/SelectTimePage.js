// Individual Booking SelectTimePage.jsx - Fixed Multi-Service Version
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SelectTimePage.css";
import { filterMatchingSlots } from "../../Utils/slotUtils";

const API_BASE_URL = process.env.REACT_APP_API_URL ? 
  process.env.REACT_APP_API_URL.replace('/api', '') : 
  'http://localhost:5000';

const SelectTimePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const passedServices = location.state?.selectedServices || JSON.parse(localStorage.getItem("selectedServices")) || [];
  const passedProfessional = location.state?.selectedProfessional || JSON.parse(localStorage.getItem("selectedProfessional")) || null;
  const salon = location.state?.salon || JSON.parse(localStorage.getItem("selectedSalon")) || null;
  const rescheduleAppointment = location.state?.rescheduleAppointment || null;
  const isReschedule = !!rescheduleAppointment;

  const user = JSON.parse(localStorage.getItem("user"));

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
      setAvailableSlots(prev => ({ ...prev, [key]: Array.isArray(data) ? data : [] }));
      console.debug("Fetched slots", key, Array.isArray(data) ? data.length : typeof data);
    } catch (err) {
      console.error("Error fetching time slots:", err);
      const key = `${professionalId}-${date}`;
      setAvailableSlots(prev => ({ ...prev, [key]: [] }));
    }
  }, []);

  // Init reschedule data
  useEffect(() => {
    if (!isReschedule || !rescheduleAppointment) return;
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
    }
  }, [isReschedule, rescheduleAppointment]);

  // Fetch default date slots for current service
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

    const defaultDate = isReschedule && rescheduleAppointment?.date 
      ? rescheduleAppointment.date 
      : dates[0]?.fullDate;

    if (defaultDate) {
      setSelectedDates((prev) => ({ ...prev, [currentService.name]: defaultDate }));
      setSelectedTimes(prev => ({ ...prev, [currentService.name]: null }));
      fetchTimeSlots(professionalId, defaultDate);
    }
  }, [selectedProfessional, selectedServices, isReschedule, rescheduleAppointment, dates, fetchTimeSlots, currentServiceIndex.current]);

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

  // Compute end time helper
  const computeEndFromStartAndDuration = (startTime, durationStr) => {
    if (!startTime) return "";
    const parts = durationStr.split(" ");
    let minutes = 0;
    for (let i = 0; i < parts.length; i += 2) {
      const val = parseInt(parts[i]);
      const unit = parts[i + 1]?.toLowerCase() || "";
      if (unit.includes("hour")) minutes += (isNaN(val) ? 0 : val) * 60;
      else if (unit.includes("min")) minutes += isNaN(val) ? 0 : val;
    }
    const [h, m] = startTime.split(":").map(Number);
    const total = h * 60 + m + minutes;
    const endH = String(Math.floor(total / 60)).padStart(2, "0");
    const endM = String(total % 60).padStart(2, "0");
    return `${endH}:${endM}`;
  };

  // Get current appointment data
  const getCurrentAppointmentData = useCallback(() => {
    const slotId = selectedTimes[serviceKey];
    const date = selectedDates[serviceKey];
    const selectedSlot = filteredSlots.find(s => 
      (s._id && s._id === slotId) || 
      (s.id && s.id === slotId) || 
      (s.startTime && s.startTime === slotId)
    );

    const startTime = selectedSlot?.startTime || selectedSlot?.start;
    const endTime = computeEndFromStartAndDuration(startTime, currentService.duration);

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
      memberName: user?.name || "Guest"
    };
  }, [selectedTimes, serviceKey, selectedDates, filteredSlots, currentService, professionalId, selectedProfessional, salon, user]);

  // ✅ Create appointment via API with CORRECT format
  const createAppointment = async (appointmentData) => {
    try {
      setLoading(true);
      console.log("📤 Sending appointment data:", {
        phone: user?.phone || "",
        email: user?.email || "",
        name: user?.name || "Guest",
        appointments: [appointmentData]
      });

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

      return result.data[0]; // Return the created appointment
    } catch (error) {
      console.error("❌ Error creating appointment:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED: Handle reschedule for individual booking
  const handleReschedule = async () => {
    if (!selectedTimes[serviceKey]) {
      alert("❌ Please select a time for rescheduling.");
      return;
    }

    if (!rescheduleAppointment) {
      alert("❌ No appointment found to reschedule.");
      return;
    }

    setLoading(true);
    try {
      const currentAppointment = getCurrentAppointmentData();
      
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
    console.log("🔵 handleContinue called for service:", currentService.name);
    console.log("🔵 selectedTimes[serviceKey]:", selectedTimes[serviceKey]);
    
    if (!selectedTimes[serviceKey]) {
      alert("❌ Please select a time for the current service.");
      return;
    }

    // 🔥 FIXED: Handle reschedule
    if (isReschedule) {
      handleReschedule();
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
      <div className="left-column">
        <p className="breadcrumb">Services &gt; Professional &gt; <b>Time</b> &gt; Confirmation</p>
        <h2 className="heading-with-search">
          {isReschedule ? "Reschedule" : "Select Time for"} {currentService.name}
        </h2>

        {isReschedule && (
          <div className="reschedule-notice">
            <p>🔁 You are rescheduling an existing appointment</p>
          </div>
        )}

        {selectedServices.length > 1 && (
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
          ) : filteredSlots.length === 0 ? (
            <p>No available time slots for {new Date(selectedDate).toLocaleDateString()}</p>
          ) : (
            filteredSlots.map(slot => {
              const slotId = slot._id || slot.id || slot.startTime;
              const isSelected = selectedTimes[serviceKey] === slotId;
              const isBooked = !!slot.isBooked;

              return (
                <div
                  key={slotId}
                  className={`SelectTimePage-card ${isBooked ? "disabled" : isSelected ? "selected" : ""}`}
                  onClick={() => handleTimeClick(serviceKey, slotId, isBooked)}
                  style={{ pointerEvents: isBooked ? "none" : "auto" }}
                >
                  <p>{slot.startTime} - {slot.endTime}</p>
                  <p>{isBooked ? "❌ Booked" : `LKR ${currentService.price}`}</p>
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
              <p>📅 {new Date(selectedDate).toDateString()} 🕒 {filteredSlots.find(s => (s._id === selectedTimes[serviceKey] || s.id === selectedTimes[serviceKey] || s.startTime === selectedTimes[serviceKey]))?.startTime}</p>
            )}
            
            {/* Show all scheduled services */}
            {appointmentsToDisplay.length > 0 && (
              <div className="services-breakdown">
                <p><strong>Scheduled Services:</strong></p>
                {appointmentsToDisplay.map((appointment, index) => (
                  <div key={index} className="appointment-item">
                    <p style={{ fontSize: '0.9em', margin: '2px 0' }}>
                      <strong>{appointment.serviceName}</strong><br />
                      📅 {new Date(appointment.date).toLocaleDateString()} 🕒 {appointment.startTime}<br />
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
          <button 
            className="continue-button" 
            onClick={handleContinue} 
            disabled={!selectedTimes[serviceKey] || loading}
          >
            {loading ? "Processing..." : 
             isReschedule ? "Reschedule Appointment" :
             currentServiceIndex.current + 1 < selectedServices.length 
               ? `Continue to Next Service (${currentServiceIndex.current + 1}/${selectedServices.length})`
               : `Confirm All Services (LKR ${displayTotalAmount})`
            }
          </button>
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