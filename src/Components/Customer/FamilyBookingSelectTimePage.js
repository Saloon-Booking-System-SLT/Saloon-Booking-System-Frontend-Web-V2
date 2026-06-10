// FamilyBookingSelectTimePage.js - Per-member date & time selection
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import "./FamilyBookingSelectTime.css";
import { durationToMinutes, timeStringToMinutes } from "../../Utils/slotUtils";
import { API_URL, getSalonImageUrl } from "../../Utils/apiConfig";

const API_BASE_URL = API_URL;

const SelectTimePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const salon = location.state?.salon || JSON.parse(localStorage.getItem("selectedSalon")) || null;
  const isGroupBooking = true;

  // membersWithServices: [{ id, name, category, selectedServices, professional }]
  const membersWithServices = useMemo(() => {
    return location.state?.membersWithServices
      || JSON.parse(localStorage.getItem("groupMembersWithServices"))
      || [];
  }, [location.state?.membersWithServices]);

  const user = JSON.parse(localStorage.getItem("user"));

  // Current member index
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);

  // selectedDates[memberId-serviceName] = fullDate
  const [selectedDates, setSelectedDates] = useState({});
  // selectedTimes[memberId-serviceName] = slotId
  const [selectedTimes, setSelectedTimes] = useState({});
  // availableSlots[proId-date-duration] = [slots]
  const [availableSlots, setAvailableSlots] = useState({});
  // All confirmed appointments (members who already had time chosen)
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conflictModalData, setConflictModalData] = useState(null);

  const currentMember = membersWithServices[currentMemberIndex];
  const isLastMember = currentMemberIndex === membersWithServices.length - 1;

  // The current member's selected services (they may have multiple, we pick time for each)
  const currentMemberServices = currentMember?.selectedServices || [];

  // Grand total across all members' services
  const grandTotal = membersWithServices.reduce((total, member) => {
    return total + (member.selectedServices || []).reduce((sum, s) => sum + (s.price || 0), 0);
  }, 0);

  // Generate next 14 dates
  const dates = useMemo(() => {
    const days = [];
    for (let i = 0; i < 14; i++) {
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

  // Check if salon is closed on a date
  const checkIsSalonClosed = useCallback((dateStr) => {
    if (!salon) return { closed: false };
    if (salon.temporaryClosures && salon.temporaryClosures.length > 0) {
      const matchingClosure = salon.temporaryClosures.find(closure =>
        dateStr >= closure.startDate && dateStr <= closure.endDate
      );
      if (matchingClosure && matchingClosure.type === "full") {
        return { closed: true, reason: matchingClosure.reason || "Holiday", closure: matchingClosure };
      }
    }
    if (salon.closedDay && salon.closedDay.toLowerCase() !== "none") {
      const [y, m, d] = dateStr.split("-").map(Number);
      const parsedDate = new Date(y, m - 1, d);
      const dayOfWeek = parsedDate.toLocaleDateString("en-US", { weekday: "long" });
      if (dayOfWeek.toLowerCase() === salon.closedDay.toLowerCase()) {
        return { closed: true, reason: `Weekly Closed Day (${salon.closedDay}s)` };
      }
    }
    return { closed: false };
  }, [salon]);

  const getSalonClosedReason = useCallback((dateStr) => {
    const result = checkIsSalonClosed(dateStr);
    if (!result.closed) return null;
    if (result.closure) {
      const c = result.closure;
      const rangeStr = c.startDate === c.endDate ? `on ${c.startDate}` : `from ${c.startDate} to ${c.endDate}`;
      return `Our salon is closed ${rangeStr}${c.reason ? ` (Reason: ${c.reason})` : ""}. Please select another date.`;
    }
    return `Our salon is closed on ${salon.closedDay}s. Please select another date.`;
  }, [salon, checkIsSalonClosed]);

  // Check if a time slot is in the past
  const isPastTimeSlot = useCallback((date, startTime) => {
    if (!date || !startTime) return true;
    try {
      const slotDateTime = new Date(`${date}T${startTime}:00`);
      return slotDateTime < new Date();
    } catch { return true; }
  }, []);

  // Build a unique key for date/time state: memberId + serviceName
  const makeKey = (memberId, serviceName) => `${memberId}-${serviceName}`;

  // Fetch time slots for a professional/date/duration
  const fetchTimeSlots = useCallback(async (professionalId, date, serviceDuration) => {
    if (!date || !serviceDuration) return;
    const durationMins = typeof serviceDuration === "number"
      ? serviceDuration
      : durationToMinutes(serviceDuration);

    let url;
    if (!professionalId || professionalId === "any") {
      if (!salon?._id) return;
      url = `${API_BASE_URL}/api/timeslots?professionalId=any&salonId=${salon._id}&date=${date}&duration=${durationMins}`;
    } else {
      url = `${API_BASE_URL}/api/timeslots?professionalId=${professionalId}&date=${date}&duration=${durationMins}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const key = `${professionalId || "any"}-${date}-${durationMins}`;
      const filteredData = Array.isArray(data)
        ? data.filter(slot => slot.startTime && !isPastTimeSlot(date, slot.startTime))
        : [];
      setAvailableSlots(prev => ({ ...prev, [key]: filteredData }));
    } catch (err) {
      console.error("Error fetching time slots:", err);
      const key = `${professionalId || "any"}-${date}-${durationMins}`;
      setAvailableSlots(prev => ({ ...prev, [key]: [] }));
    }
  }, [isPastTimeSlot, salon]);

  // When currentMember changes, pre-load slots for their first service
  useEffect(() => {
    if (!currentMember || currentMemberServices.length === 0) return;
    const service = currentMemberServices[0];
    const proId = currentMember.professional?._id || currentMember.professional || "any";
    const defaultDate = dates[0]?.fullDate;
    if (defaultDate) {
      const key = makeKey(currentMember.id, service.name);
      setSelectedDates(prev => ({ ...prev, [key]: defaultDate }));
      setSelectedTimes(prev => ({ ...prev, [key]: null }));
      fetchTimeSlots(proId, defaultDate, service.duration);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMemberIndex]);

  const handleDateClick = (memberId, serviceName, serviceDuration, proId, fullDate) => {
    const key = makeKey(memberId, serviceName);
    setSelectedDates(prev => ({ ...prev, [key]: fullDate }));
    setSelectedTimes(prev => ({ ...prev, [key]: null }));
    fetchTimeSlots(proId, fullDate, serviceDuration);
  };

  const handleTimeClick = (key, slotId, isBooked, slot) => {
    if (isBooked) return;
    if (slot?.isLeave || slot?.isSessionConflict || slot?.insufficientGap) {
      setConflictModalData({
        type: slot.isLeave ? "leave" : slot.isSessionConflict ? "session" : "gap",
        startTime: slot.startTime,
        leaveReason: slot.leaveReason,
        conflictService: slot.sessionConflictService,
        conflictMember: slot.sessionConflictMember,
        availableGapMins: slot.availableGapMins,
        nextAppointmentTime: slot.nextAppointmentTime,
      });
      return;
    }
    setSelectedTimes(prev => ({ ...prev, [key]: slotId }));
  };

  const computeEndTime = (startTime, durationStr) => {
    if (!startTime) return "";
    const parts = String(durationStr).split(" ");
    let minutes = 0;
    for (let i = 0; i < parts.length; i += 2) {
      const val = parseInt(parts[i]);
      const unit = (parts[i + 1] || "").toLowerCase();
      if (unit.includes("hour")) minutes += (isNaN(val) ? 0 : val) * 60;
      else if (unit.includes("min")) minutes += isNaN(val) ? 0 : val;
    }
    if (minutes === 0 && !isNaN(Number(durationStr))) minutes = Number(durationStr);
    const [h, m] = startTime.split(":").map(Number);
    const total = h * 60 + m + minutes;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  // Get slots for display for a given member+service
  const getSlotsForService = useCallback((member, service) => {
    const proId = member.professional?._id || member.professional || "any";
    const key = makeKey(member.id, service.name);
    const date = selectedDates[key] || dates[0]?.fullDate;
    const durationMins = durationToMinutes(service.duration);
    const slotKey = `${proId || "any"}-${date}-${durationMins}`;
    const rawSlots = availableSlots[slotKey] || [];
    return { slots: Array.isArray(rawSlots) ? rawSlots : [], date, proId };
  }, [availableSlots, selectedDates, dates]);

  // Check all services of current member have a time selected
  const allCurrentMemberTimesSelected = currentMemberServices.every(service => {
    const key = makeKey(currentMember?.id, service.name);
    return !!selectedTimes[key];
  });

  // Move to next member or confirm booking
  const handleNextOrConfirm = () => {
    if (!allCurrentMemberTimesSelected) {
      alert(`Please select a time for all services for ${currentMember?.name || 'this member'}.`);
      return;
    }

    // Build appointment objects for current member
    const newAppointments = currentMemberServices.map(service => {
      const key = makeKey(currentMember.id, service.name);
      const slotId = selectedTimes[key];
      const date = selectedDates[key];
      const { slots } = getSlotsForService(currentMember, service);
      const selectedSlot = slots.find(s => (s._id && s._id === slotId) || (s.id && s.id === slotId) || (s.startTime && s.startTime === slotId));
      const startTime = selectedSlot?.startTime || selectedSlot?.start;
      const endTime = selectedSlot?.endTime || computeEndTime(startTime, service.duration);
      const proId = currentMember.professional?._id === "any" ? selectedSlot?.assignedProfessionalId : currentMember.professional?._id;

      return {
        memberName: currentMember.name,
        memberCategory: currentMember.category,
        serviceName: service.name,
        price: service.price,
        duration: service.duration,
        date,
        startTime,
        endTime,
        professionalId: proId || "any",
        professionalName: currentMember.professional?.name || "Any Professional",
        salonId: salon?._id,
        slotIds: selectedSlot?.slotIds || [selectedSlot?._id].filter(Boolean),
      };
    });

    const updatedBooked = [...bookedAppointments, ...newAppointments];
    setBookedAppointments(updatedBooked);

    if (!isLastMember) {
      setCurrentMemberIndex(prev => prev + 1);
    } else {
      // Navigate to checkout
      const totalAmount = updatedBooked.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      const confirmationData = {
        salonName: salon?.name || "Our Salon",
        appointmentDetails: updatedBooked,
        totalAmount,
        bookingId: `booking-${Date.now()}`,
        customerName: user?.name || "Guest",
        isGroupBooking: true,
        salonLocation: salon?.location,
        salon,
        user,
      };

      localStorage.removeItem('bookedAppointments');
      localStorage.removeItem('groupMembersWithServices');
      localStorage.removeItem('selectedSalon');
      localStorage.removeItem('isGroupBooking');

      navigate("/checkoutpage", { state: confirmationData });
    }
  };

  if (membersWithServices.length === 0) {
    return (
      <div className="select-services-container">
        <div className="left-column">
          <h2>No members found</h2>
          <button onClick={() => navigate(-1)}>Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="SelectTimePage-container">
      <div className="left-column">
        <p className="breadcrumb">Services &gt; Professional &gt; <b>Time</b> &gt; Confirmation</p>
        <h2 className="heading-with-search">Select Time</h2>

        {/* ── Member Tabs ── */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #e5e7eb', marginTop: '16px', marginBottom: '20px' }}>
          {membersWithServices.map((member, index) => {
            const done = index < currentMemberIndex;
            const isActive = index === currentMemberIndex;
            return (
              <button
                key={member.id}
                onClick={() => index <= currentMemberIndex && setCurrentMemberIndex(index)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #111827' : '2px solid transparent',
                  background: 'none',
                  cursor: index <= currentMemberIndex ? 'pointer' : 'default',
                  color: isActive ? '#111827' : done ? '#059669' : '#9ca3af',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {member.name}
                {done && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '18px', height: '18px', fontSize: '11px', fontWeight: '900',
                    background: '#059669', color: '#fff', borderRadius: '50%'
                  }}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current member info */}
        {currentMember && (
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
            Selecting time for <strong style={{ color: '#111827' }}>{currentMember.name}</strong>
            <span style={{ marginLeft: '8px', fontSize: '12px' }}>({currentMember.category})</span>
            {currentMember.professional && currentMember.professional._id !== 'any' && (
              <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                — Professional: <strong>{currentMember.professional.name}</strong>
              </span>
            )}
          </p>
        )}

        {/* ── Services for current member ── */}
        {currentMemberServices.map((service, sIdx) => {
          const key = makeKey(currentMember.id, service.name);
          const proId = currentMember.professional?._id || "any";
          const { slots, date: selectedDate } = getSlotsForService(currentMember, service);
          const isSalonClosedOnSelected = selectedDate ? checkIsSalonClosed(selectedDate).closed : false;

          return (
            <div key={service._id || sIdx} style={{ marginBottom: '32px' }}>
              <h3 style={{ fontWeight: '800', fontSize: '16px', color: '#111827', marginBottom: '12px' }}>
                {service.name}
                <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '14px', marginLeft: '8px' }}>
                  {service.duration} — LKR {service.price?.toLocaleString()}
                </span>
              </h3>

              {/* Date picker */}
              <div className="date-buttons">
                {dates.map(day => {
                  const isClosed = checkIsSalonClosed(day.fullDate).closed;
                  return (
                    <button
                      key={day.fullDate}
                      className={`date-button ${selectedDates[key] === day.fullDate ? "selected" : ""} ${isClosed ? "closed" : ""}`}
                      onClick={() => !isClosed && handleDateClick(currentMember.id, service.name, service.duration, proId, day.fullDate)}
                      disabled={isClosed}
                    >
                      <span>{day.date}</span>
                      <small>{isClosed ? "Closed" : day.day}</small>
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              <div className="SelectTimePage-list">
                {!selectedDate ? (
                  <p>Please select a date</p>
                ) : isSalonClosedOnSelected ? (
                  <div className="salon-closed-alert">
                    <p className="alert-title">🔒 Salon is Closed</p>
                    <p className="alert-desc">{getSalonClosedReason(selectedDate)}</p>
                  </div>
                ) : slots.length === 0 ? (
                  <p>No available time slots for {new Date(selectedDate + 'T12:00:00').toLocaleDateString()}</p>
                ) : (
                  slots.map(slot => {
                    const slotId = slot._id || slot.id || slot.startTime;
                    const isSelected = selectedTimes[key] === slotId;
                    const isBooked = !!slot.isBooked;
                    const isLeave = !!slot.isLeave;
                    const isLimited = !!slot.insufficientGap;
                    const isSessionConflict = !!slot.isSessionConflict;

                    return (
                      <div
                        key={slotId}
                        className={`SelectTimePage-card ${isBooked ? "disabled" : isLeave ? "off-duty" : isSessionConflict ? "session-conflict" : isLimited ? "limited" : isSelected ? "selected" : ""}`}
                        onClick={() => handleTimeClick(key, slotId, isBooked, slot)}
                        style={{ pointerEvents: isBooked ? "none" : "auto", opacity: isBooked ? 0.5 : 1 }}
                      >
                        <p>{slot.startTime} - {slot.endTime}</p>
                        {isBooked ? (
                          <p>❌ Booked</p>
                        ) : isLeave ? (
                          <p className="off-duty-text">💤 Off-Duty</p>
                        ) : isSessionConflict ? (
                          <p className="session-conflict-text">📅 Taken</p>
                        ) : isLimited ? (
                          <p className="limited-text">⚠️ Limited</p>
                        ) : (
                          <p>LKR {service.price?.toLocaleString()}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Right Summary ── */}
      <div className="right-column">
        <div className="summary-box">
          <img
            src={salon?.image ? getSalonImageUrl(salon.image) : "https://picsum.photos/150/150?random=5"}
            alt="Salon"
            className="salon-image"
          />
          <div className="salon-info">
            <h4>{salon?.name}</h4>
            <p>{salon?.location}</p>

            {/* Already-booked members summary */}
            {bookedAppointments.length > 0 && (
              <div className="booked-familyappointments-summary">
                <h5>Confirmed so far:</h5>
                {bookedAppointments.map((appt, i) => (
                  <div key={i} className="familyappointment-item">
                    <p><strong>👤 {appt.memberName}</strong> ({appt.memberCategory})</p>
                    <p>💇 {appt.serviceName}</p>
                    <p><CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                      {new Date(appt.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p><ClockIcon className="h-4 w-4 inline mr-1" />{appt.startTime} - {appt.endTime}</p>
                    <p className="price-tag">LKR {appt.price?.toLocaleString()}</p>
                    {i < bookedAppointments.length - 1 && <hr />}
                  </div>
                ))}
              </div>
            )}

            {/* Current member's selected times (preview) */}
            {currentMember && currentMemberServices.some(s => selectedTimes[makeKey(currentMember.id, s.name)]) && (
              <div className="booked-familyappointments-summary" style={{ marginTop: '12px' }}>
                <h5>{currentMember.name}'s selection:</h5>
                {currentMemberServices.map((service, i) => {
                  const key = makeKey(currentMember.id, service.name);
                  const slotId = selectedTimes[key];
                  const date = selectedDates[key];
                  if (!slotId) return null;
                  const { slots } = getSlotsForService(currentMember, service);
                  const slot = slots.find(s => (s._id && s._id === slotId) || (s.startTime && s.startTime === slotId));
                  return (
                    <div key={i} className="familyappointment-item">
                      <p>💇 {service.name}</p>
                      {date && <p><CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                        {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>}
                      {slot && <p><ClockIcon className="h-4 w-4 inline mr-1" />{slot.startTime} - {slot.endTime}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="total-section">
            <p>Total Amount</p>
            <p><strong>LKR {grandTotal.toLocaleString()}</strong></p>
          </div>

          <div className="booking-buttons">
            <button
              className="continue-button"
              onClick={handleNextOrConfirm}
              disabled={!allCurrentMemberTimesSelected || loading}
            >
              {loading ? "Processing..." : isLastMember
                ? `Confirm Booking (LKR ${grandTotal.toLocaleString()})`
                : `Next Member →`}
            </button>
          </div>
        </div>
      </div>

      {/* Conflict Modal */}
      {conflictModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm" onClick={() => setConflictModalData(null)}></div>
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl relative z-10 fade-in slide-up border border-amber-100">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ClockIcon className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-center text-gray-900 mb-2">
              {conflictModalData.type === "leave" ? "Staff Off-Duty"
                : conflictModalData.type === "session" ? "Time Already Taken"
                : "Insufficient Time"}
            </h3>
            <p className="text-center text-gray-500 text-sm mb-6">
              {conflictModalData.type === "leave"
                ? `This professional is off-duty at ${conflictModalData.startTime}. Reason: ${conflictModalData.leaveReason || "Off-Duty"}`
                : conflictModalData.type === "session"
                ? `This time slot (${conflictModalData.startTime}) is already selected for ${conflictModalData.conflictMember} (${conflictModalData.conflictService}).`
                : `Only ${conflictModalData.availableGapMins} mins available before ${conflictModalData.nextAppointmentTime}.`}
            </p>
            <button
              className="w-full py-3.5 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
              onClick={() => setConflictModalData(null)}
            >
              Got it, Choose Another Time
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loader">
            <div className="loader-dots"><div></div><div></div><div></div></div>
            <p>Processing your group booking...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectTimePage;