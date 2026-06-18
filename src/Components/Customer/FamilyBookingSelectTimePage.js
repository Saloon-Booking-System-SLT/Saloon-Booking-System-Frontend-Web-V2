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
    if (!professionalId || professionalId === "any" || String(professionalId).startsWith("mock_")) {
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
    const safeSlots = Array.isArray(rawSlots) ? rawSlots : [];

    const processedSlots = safeSlots.map(slot => {
      let isBooked = slot.isBooked || slot.conflicting;
      let insufficientGap = slot.insufficientGap || false;
      let availableGapMins = slot.availableGapMins || null;
      let nextAppointmentTime = slot.nextAppointmentTime || null;
      let isLeave = slot.isLeave || false;
      let leaveReason = slot.leaveReason || null;

      if (isBooked && (insufficientGap || isLeave)) {
        isBooked = false;
      }

      let isSessionConflict = false;
      let sessionConflictService = null;
      let sessionConflictMember = null;
      let sessionConflictProId = null;
      let sessionConflictProName = null;

      const displayStartTime = slot.startTime || slot.start;
      const slotDurationMins = durationMins;
      const resolvedProId = slot.assignedProfessionalId || proId;

      if (!isBooked && bookedAppointments.length > 0) {
        const startMins = timeStringToMinutes(displayStartTime);
        const endMins = startMins + slotDurationMins;

        const conflictingAppt = bookedAppointments.find(appt => {
          if (appt.date !== date) return false;
          
          const bStart = timeStringToMinutes(appt.startTime);
          const bEnd = timeStringToMinutes(appt.endTime);
          const overlaps = startMins < bEnd && endMins > bStart;
          
          const isSamePro = String(appt.professionalId) === String(resolvedProId);
          
          return overlaps && isSamePro;
        });

        if (conflictingAppt) {
          isSessionConflict = true;
          sessionConflictService = conflictingAppt.serviceName;
          sessionConflictMember = conflictingAppt.memberName;
          sessionConflictProId = conflictingAppt.professionalId;
          sessionConflictProName = conflictingAppt.professionalName;
        }
      }

      if (isSessionConflict) {
        isBooked = false;
        insufficientGap = false;
      }

      return {
        ...slot,
        isBooked,
        insufficientGap,
        availableGapMins,
        nextAppointmentTime,
        isSessionConflict,
        sessionConflictService,
        sessionConflictMember,
        sessionConflictProId,
        sessionConflictProName,
        isLeave,
        leaveReason
      };
    });

    return { slots: processedSlots, date, proId };
  }, [availableSlots, selectedDates, dates, bookedAppointments]);

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
      const date = selectedDates[key] || dates[0]?.fullDate;
      const { slots } = getSlotsForService(currentMember, service);
      const selectedSlot = slots.find(s => (s._id && s._id === slotId) || (s.id && s.id === slotId) || (s.startTime && s.startTime === slotId));
      const startTime = selectedSlot?.startTime || selectedSlot?.start;
      const endTime = selectedSlot?.endTime || computeEndTime(startTime, service.duration);
      
      let proId = currentMember.professional?._id || currentMember.professional || "any";
      if (typeof proId === 'object') proId = proId._id || "any";
      if (proId === "any") {
        proId = selectedSlot?.assignedProfessionalId || "any";
      }

      return {
        memberName: currentMember.name,
        memberCategory: currentMember.category,
        serviceName: service.name,
        price: service.price,
        duration: service.duration,
        date,
        startTime,
        endTime,
        professionalId: proId,
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
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                  <h3 className="font-bold text-gray-900">Select Date</h3>
                </div>

                <div className="flex overflow-x-auto gap-3 pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                  {dates.map(day => {
                    const isClosed = checkIsSalonClosed(day.fullDate).closed;
                    const isSelected = selectedDates[key] === day.fullDate;
                    const isDisabled = isClosed;

                    return (
                      <button
                        key={day.fullDate}
                        onClick={() => !isClosed && handleDateClick(currentMember.id, service.name, service.duration, proId, day.fullDate)}
                        disabled={isDisabled}
                        className={`flex flex-col flex-none items-center justify-center p-3 rounded-2xl border-2 min-w-[4.5rem] sm:min-w-[5rem] transition-all duration-200 ${
                          isSelected
                            ? 'bg-dark-900 border-dark-900 shadow-md shadow-dark-900/20 scale-105'
                            : isClosed
                            ? 'bg-red-50/40 border-red-200 text-red-600'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } ${isClosed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-gray-300' : isClosed ? 'text-red-500' : 'text-gray-400'}`}>
                          {isClosed ? "Closed" : day.day}
                        </span>
                        <span className={`text-xl sm:text-2xl font-black ${isSelected ? 'text-white' : isClosed ? 'text-red-700' : 'text-gray-900'}`}>
                          {day.date}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <h3 className="font-bold text-gray-900">Available Times</h3>
                </div>

                {!selectedDate ? (
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-10 text-center">
                    <p className="text-gray-500 font-medium">Please select a date</p>
                  </div>
                ) : isSalonClosedOnSelected ? (
                  <div className="bg-red-50/50 border border-red-200 rounded-2xl p-10 text-center">
                    <p className="text-red-800 font-bold text-lg flex items-center justify-center gap-1.5">🔒 Salon is Closed</p>
                    <p className="text-sm mt-2 text-red-600 font-medium">{getSalonClosedReason(selectedDate)}</p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-10 text-center">
                    <p className="text-gray-500 font-medium">
                      No available time slots on {new Date(selectedDate + 'T12:00:00').toLocaleDateString()}.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {slots.map(slot => {
                      const slotId = slot._id || slot.id || slot.startTime;
                      const isSelected = selectedTimes[key] === slotId;
                      const isBooked = !!slot.isBooked || !!slot.isSessionConflict;
                      const isLimited = !!slot.insufficientGap;
                      const isLeave = !!slot.isLeave;
                      const displayStartTime = slot.startTime || slot.start;
                      const isDisabled = isBooked;

                      return (
                        <div
                          key={slotId}
                          onClick={() => handleTimeClick(key, slotId, isBooked, slot)}
                          className={`relative flex flex-col items-center justify-center py-3.5 px-2 rounded-xl border-2 transition-all duration-200 ${
                            isBooked ? "bg-gray-100 border-gray-200 text-gray-400 border-dashed" :
                            isLeave ? "bg-gray-50 border-gray-200 text-gray-400 border-dashed hover:border-gray-300" :
                            isLimited ? "bg-amber-50/50 border-amber-200 hover:border-amber-400 text-amber-900 shadow-sm" :
                            isSelected ? "bg-dark-900 border-dark-900 shadow-lg shadow-dark-900/20" :
                            "bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-sm"
                          } ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span className={`text-[15px] font-bold ${isSelected ? 'text-white' : (isBooked || isLeave) ? 'text-gray-400' : isLimited ? 'text-amber-800' : 'text-gray-900'}`}>
                            {displayStartTime}
                          </span>

                          {isBooked ? (
                            <span className="text-[10px] uppercase font-bold tracking-widest mt-1">Booked</span>
                          ) : isLeave ? (
                            <span className="text-[10px] uppercase font-bold tracking-widest mt-1 text-gray-500 flex items-center gap-0.5 animate-pulse">
                              <span>💤</span> Off-Duty
                            </span>
                          ) : isLimited ? (
                            <span className="text-[10px] uppercase font-bold tracking-widest mt-1 text-amber-600 flex items-center gap-0.5 animate-pulse">
                              <span>⚠️</span> Limited
                            </span>
                          ) : (
                            <span className={`text-[10px] font-medium mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                              LKR {service.price?.toLocaleString()}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
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