// SelectTimePage.jsx - Family Booking Version - Hide Past Times
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import "./FamilyBookingSelectTime.css";
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

  const isGroupBooking = location.state?.isGroupBooking || JSON.parse(localStorage.getItem("isGroupBooking")) || false;
  const groupMembers = useMemo(() => {
    return location.state?.groupMembers || JSON.parse(localStorage.getItem("groupMembers")) || [];
  }, [location.state?.groupMembers]);

  // Get existing booked appointments from previous bookings in this session
  const initialBookedAppointments = useMemo(() => {
    const fromState = location.state?.bookedAppointments;
    if (fromState && Array.isArray(fromState) && fromState.length > 0) {
      console.log("✅ Loaded appointments from location state:", fromState.length);
      return fromState;
    }

    const fromStorage = localStorage.getItem('bookedAppointments');
    if (fromStorage) {
      try {
        const parsed = JSON.parse(fromStorage);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log("✅ Loaded appointments from localStorage:", parsed.length);
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse bookedAppointments from localStorage:", e);
      }
    }

    console.log("ℹ️ No previous appointments found");
    return [];
  }, [location.state?.bookedAppointments]);

  const user = JSON.parse(localStorage.getItem("user"));

  const [selectedServices] = useState(passedServices);
  const [selectedProfessional] = useState(passedProfessional);
  const currentServiceIndex = useRef(0);
  const [renderKey, setRenderKey] = useState(0);
  const [selectedDates, setSelectedDates] = useState({});
  const [selectedTimes, setSelectedTimes] = useState({});
  const [availableSlots, setAvailableSlots] = useState({});
  const [loading, setLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  // Store all booked appointments (from current session + new ones)
  const [bookedAppointments, setBookedAppointments] = useState(initialBookedAppointments);

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

    const defaultDate = dates[0]?.fullDate;

    if (defaultDate) {
      setSelectedDates((prev) => ({ ...prev, [currentService.name]: defaultDate }));
      setSelectedTimes((prev) => ({ ...prev, [currentService.name]: null }));
      fetchTimeSlots(professionalId, defaultDate);
    }
  }, [selectedProfessional, selectedServices, dates, fetchTimeSlots]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredSlots, selectedDate]);

  const handleDateClick = (serviceName, profId, fullDate) => {
    setSelectedDates(prev => ({ ...prev, [serviceName]: fullDate }));
    setSelectedTimes(prev => ({ ...prev, [serviceName]: null }));
    fetchTimeSlots(profId, fullDate);
  };

  const handleTimeClick = (serviceName, slotId, isBooked) => {
    if (isBooked) return;
    setSelectedTimes(prev => ({ ...prev, [serviceName]: slotId }));
  };

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

  const getCurrentAppointmentData = useCallback(() => {
    const slotId = selectedTimes[serviceKey];
    const date = selectedDates[serviceKey];
    const selectedSlot = displaySlots.find(s => (s._id && s._id === slotId) || (s.id && s.id === slotId) || (s.startTime && s.startTime === slotId));
    const startTime = selectedSlot?.startTime || selectedSlot?.start;
    const endTime = computeEndFromStartAndDuration(startTime, currentService.duration);

    let memberName = user?.name || "Guest";
    let memberCategory = 'Primary';

    if (isGroupBooking && groupMembers.length > 0) {
      const currentMember = groupMembers[currentServiceIndex.current];
      if (currentMember) {
        memberName = currentMember.name || `Member ${currentServiceIndex.current + 1}`;
        memberCategory = currentMember.category || 'Adult';
      }
    }

    return {
      serviceName: currentService.name,
      price: currentService.price,
      duration: currentService.duration,
      date,
      startTime,
      endTime,
      professionalId: professionalId,
      professionalName: selectedProfessional?.name || "Any Professional",
      salonId: salon?._id,
      slotIds: selectedSlot?.slotIds || [selectedSlot?._id].filter(Boolean),
      memberName: memberName,
      memberCategory: memberCategory
    };
  }, [selectedTimes, serviceKey, selectedDates, displaySlots, currentService, isGroupBooking, groupMembers, professionalId, selectedProfessional, salon, user]);

  // 🔥 UPDATED: Handle reschedule for family booking with 24-hour check
  const handleReschedule = async () => {
    setRescheduleError("");

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

      const rescheduleData = {
        date: currentAppointment.date,
        startTime: currentAppointment.startTime,
        endTime: currentAppointment.endTime,
        professionalId: currentAppointment.professionalId
      };

      console.log("🔄 Sending reschedule request:", {
        appointmentId: rescheduleAppointment._id,
        data: rescheduleData
      });

      const response = await fetch(`${API_BASE_URL}/api/appointments/${rescheduleAppointment._id}/reschedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rescheduleData),
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

  const handleContinue = () => {
    if (!selectedTimes[serviceKey]) {
      alert("❌ Please select a time for the current service.");
      return;
    }

    // 🔥 FIXED: Handle reschedule for family booking
    if (isReschedule) {
      handleReschedule();
      return;
    }

    // Check if there are more services to book
    if (currentServiceIndex.current + 1 < selectedServices.length) {
      // Add current appointment to booked list
      const currentAppointment = getCurrentAppointmentData();
      const updatedBookedAppointments = [...bookedAppointments, currentAppointment];

      console.log("💾 Saving appointment:", currentAppointment);
      console.log("📊 Total booked after save:", updatedBookedAppointments.length);

      setBookedAppointments(updatedBookedAppointments);

      // Also save to localStorage for persistence
      localStorage.setItem('bookedAppointments', JSON.stringify(updatedBookedAppointments));

      // Move to next service
      currentServiceIndex.current += 1;
      setRenderKey(k => k + 1);

      const nextService = selectedServices[currentServiceIndex.current];
      if (nextService) {
        setSelectedTimes(prev => ({ ...prev, [nextService.name]: null }));
      }
    } else {
      // All services booked, add final appointment and navigate to confirmation
      const currentAppointment = getCurrentAppointmentData();
      const finalBookedAppointments = [...bookedAppointments, currentAppointment];

      console.log("💾 Adding final appointment:", currentAppointment);
      console.log("📊 Final total appointments:", finalBookedAppointments.length);

      setBookedAppointments(finalBookedAppointments);
      localStorage.setItem('bookedAppointments', JSON.stringify(finalBookedAppointments));

      // Navigate to confirmation page with all appointment data
      navigateToConfirmation(finalBookedAppointments);
    }
  };

  const handleAddAppointment = () => {
    if (!selectedTimes[serviceKey]) {
      alert("❌ Please select a time for the current service.");
      return;
    }

    // Add ALL pending appointments (already booked + current one)
    const allAppointmentsToSave = [...bookedAppointments];

    // Add current appointment if time is selected
    if (selectedTimes[serviceKey]) {
      allAppointmentsToSave.push(getCurrentAppointmentData());
    }

    // Store in localStorage for persistence
    localStorage.setItem('bookedAppointments', JSON.stringify(allAppointmentsToSave));
    localStorage.setItem('isGroupBooking', JSON.stringify(true));
    localStorage.setItem('selectedSalon', JSON.stringify(salon));

    // Clear service selection for next round
    localStorage.removeItem('selectedServices');
    localStorage.removeItem('selectedProfessional');
    localStorage.removeItem('groupMembers');

    // Navigate back to family booking page to add more members
    navigate('/familybooking', {
      state: {
        salon,
        bookedAppointments: allAppointmentsToSave,
        isGroupBooking: true
      }
    });
  };

  const navigateToConfirmation = (appointments) => {
    const totalAmount = calculateTotalPrice(appointments);

    const confirmationData = {
      salonName: salon?.name || "Our Salon",
      appointmentDetails: appointments,
      totalAmount: totalAmount,
      bookingId: `booking-${Date.now()}`,
      customerName: user?.name || "Guest",
      isGroupBooking: isGroupBooking,
      salonLocation: salon?.location,
      professionalName: selectedProfessional?.name || "Any Professional",
      services: selectedServices,
      groupMembers: groupMembers,
      salon: salon,
      user: user
    };

    console.log("✅ Navigating to confirmation with data:", {
      totalAmount,
      appointmentCount: appointments.length,
      isGroupBooking
    });

    // Clear localStorage
    localStorage.removeItem('bookedAppointments');
    localStorage.removeItem('selectedServices');
    localStorage.removeItem('selectedProfessional');
    localStorage.removeItem('selectedSalon');
    localStorage.removeItem('isGroupBooking');
    localStorage.removeItem('groupMembers');

    navigate("/checkoutpage", { state: confirmationData });
  };

  const getAllAppointmentsForDisplay = useCallback(() => {
    const allAppointments = [...bookedAppointments];

    // If there's a current appointment selected, include it
    if (selectedTimes[serviceKey]) {
      allAppointments.push(getCurrentAppointmentData());
    }

    return allAppointments;
  }, [bookedAppointments, selectedTimes, serviceKey, getCurrentAppointmentData]);

  const calculateTotalPrice = useCallback((appointments = null) => {
    const allAppointments = appointments || getAllAppointmentsForDisplay();
    return allAppointments.reduce((total, appointment) => {
      return total + (Number(appointment.price) || 0);
    }, 0);
  }, [getAllAppointmentsForDisplay]);

  const appointmentsToDisplay = getAllAppointmentsForDisplay();
  const totalAmount = calculateTotalPrice();

  if (selectedServices.length === 0) {
    return (
      <div className="select-services-container">
        <div className="left-column">
          <h2>No services selected</h2>
          <button onClick={() => navigate("/")}>Go back to services</button>
        </div>
      </div>
    );
  }

  return (
    <div className="SelectTimePage-container" key={renderKey}>
      <div className="left-column">
        <p className="breadcrumb">Services &gt; Professional &gt; <b>Time</b> &gt; Confirmation</p>
        <h2 className="heading-with-search">
          {isReschedule ? "Reschedule Time for " : "Select Time for "}{currentService.name}
          {isGroupBooking && ` - ${groupMembers[currentServiceIndex.current]?.name || `Member ${currentServiceIndex.current + 1}`}`}
        </h2>

        {isReschedule && (
          <div className="reschedule-notice">
            <p>🔁 You are rescheduling an existing appointment</p>
            {rescheduleAppointment.date && rescheduleAppointment.startTime && (
              <p>
                Current appointment: {new Date(rescheduleAppointment.date).toLocaleDateString()} at {rescheduleAppointment.startTime}
                {isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime) &&
                  <span style={{ color: 'red', fontWeight: 'bold' }}> (Within 24 hours - cannot reschedule)</span>
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
              <p>✅ {bookedAppointments.length} appointment(s) already added</p>
            )}
          </div>
        )}

        <div className="date-buttons">
          {dates.map(day => (
            <button
              key={day.fullDate}
              className={`date-button ${selectedDates[serviceKey] === day.fullDate ? "selected" : ""}`}
              onClick={() => handleDateClick(serviceKey, professionalId, day.fullDate)}
              disabled={isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)}
            >
              <span>{day.date}</span><small>{day.day}</small>
            </button>
          ))}
        </div>

        <div className="SelectTimePage-list">
          {!professionalId ? (
            <p>No professional selected</p>
          ) : !selectedDate ? (
            <p>Please select a date</p>
          ) : displaySlots.length === 0 ? (
            <p>
              No available time slots for {new Date(selectedDate).toLocaleDateString()}
              {isPastTimeSlot(selectedDate, "23:59") && (
                <span style={{ display: 'block', color: '#666', fontSize: '0.9em', marginTop: '8px' }}>
                  ⏰ Today's available slots have passed. Please select a future date.
                </span>
              )}
            </p>
          ) : (
            displaySlots.map(slot => {
              const slotId = slot._id || slot.id || slot.startTime;
              const isSelected = selectedTimes[serviceKey] === slotId;
              const isBooked = !!slot.isBooked;

              return (
                <div
                  key={slotId}
                  className={`SelectTimePage-card ${isBooked ? "disabled" : isSelected ? "selected" : ""}`}
                  onClick={() => {
                    if (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)) {
                      setRescheduleError("❌ Cannot reschedule appointment within 24 hours.");
                      return;
                    }
                    handleTimeClick(serviceKey, slotId, isBooked);
                  }}
                  style={{
                    pointerEvents: isBooked || (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)) ? "none" : "auto",
                    opacity: isBooked || (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)) ? 0.5 : 1
                  }}
                >
                  <p>{slot.startTime} - {slot.endTime}</p>
                  <p>{isBooked ? "❌ Booked" : `LKR ${currentService.price}`}</p>
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

            {/* Show all booked appointments */}
            {appointmentsToDisplay.length > 0 && (
              <div className="booked-familyappointments-summary">
                <h5>{isGroupBooking ? "Group Booking Summary:" : "Booking Summary:"}</h5>
                {appointmentsToDisplay.map((appointment, index) => (
                  <div key={index} className="familyappointment-item">
                    <p><strong>👤 {appointment.memberName}</strong> {isGroupBooking && `(${appointment.memberCategory})`}</p>
                    <p>💇 {appointment.serviceName}</p>
                    <p>🧑‍💼 {appointment.professionalName}</p>
                    <p><CalendarDaysIcon className="h-4 w-4 inline mr-1" /> {new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <p><ClockIcon className="h-4 w-4 inline mr-1" /> {appointment.startTime} - {appointment.endTime}</p>
                    <p className="price-tag">LKR {appointment.price.toLocaleString()}</p>
                    {index < appointmentsToDisplay.length - 1 && <hr />}
                  </div>
                ))}
              </div>
            )}

            <div className="total-section">
              <p>Total Amount</p>
              <p><strong>LKR {totalAmount.toLocaleString()}</strong></p>
            </div>
          </div>

          <div className="booking-buttons">
            <button
              className="continue-button"
              onClick={handleContinue}
              disabled={
                !selectedTimes[serviceKey] ||
                loading ||
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
                    ? "Continue to Next Member"
                    : `Confirm the Booking (LKR ${totalAmount.toLocaleString()})`
              }
            </button>

            {isGroupBooking && !isReschedule && (
              <button
                className="add-appointment-button"
                onClick={handleAddAppointment}
                disabled={!selectedTimes[serviceKey] || loading}
              >
                Add Another Appointment
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loader">
            <div className="loader-dots"><div></div><div></div><div></div></div>
            <p>Processing your {isReschedule ? 'reschedule' : isGroupBooking ? 'group booking' : 'appointment'}...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectTimePage;