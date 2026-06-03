// Individual Booking SelectTimePage.jsx - Updated for Dynamic Conflict-Based Slots
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDaysIcon, ClockIcon, ChevronRightIcon, ShieldExclamationIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { durationToMinutes, timeStringToMinutes } from "../../Utils/slotUtils";

import { API_URL, getSalonImageUrl } from "../../Utils/apiConfig";

const API_BASE_URL = API_URL;

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
  const [conflictModalData, setConflictModalData] = useState(null);

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

  // Stable dates for next 14 days (extended from 7 to match architecture)
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

      console.log("Time check:", {
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

  // Check if salon is closed (weekly or temporary range) on a date
  const checkIsSalonClosed = useCallback((dateStr) => {
    if (!salon) return { closed: false };

    // 1. Check temporary closures
    if (salon.temporaryClosures && salon.temporaryClosures.length > 0) {
      const matchingClosure = salon.temporaryClosures.find(closure => {
        return dateStr >= closure.startDate && dateStr <= closure.endDate;
      });
      if (matchingClosure && matchingClosure.type === "full") {
        return {
          closed: true,
          reason: matchingClosure.reason || "Holiday",
          closure: matchingClosure
        };
      }
    }

    // 2. Check weekly closed day
    if (salon.closedDay && salon.closedDay.toLowerCase() !== "none") {
      const [y, m, d] = dateStr.split("-").map(Number);
      const parsedDate = new Date(y, m - 1, d);
      const dayOfWeek = parsedDate.toLocaleDateString("en-US", { weekday: "long" });
      if (dayOfWeek.toLowerCase() === salon.closedDay.toLowerCase()) {
        return {
          closed: true,
          reason: `Weekly Closed Day (${salon.closedDay}s)`
        };
      }
    }

    return { closed: false };
  }, [salon]);

  // Get explanation message for salon closure
  const getSalonClosedReason = useCallback((dateStr) => {
    const result = checkIsSalonClosed(dateStr);
    if (!result.closed) return null;

    if (result.closure) {
      const c = result.closure;
      const reasonStr = c.reason ? ` (Reason: ${c.reason})` : "";
      const rangeStr = c.startDate === c.endDate
        ? `on ${c.startDate}`
        : `from ${c.startDate} to ${c.endDate}`;
      return `Our salon is closed ${rangeStr}${reasonStr}. Please select another date.`;
    }

    return `Our salon is closed on ${salon.closedDay}s. Please select another date.`;
  }, [salon, checkIsSalonClosed]);

  // Add this function to resolve professional for a specific service
  const resolveProfessionalForService = useCallback((serviceId) => {
    if (!selectedProfessional) return null;

    // If selectedProfessional is an object with service IDs as keys
    if (selectedProfessional[serviceId]) {
      return selectedProfessional[serviceId];
    }

    // If it's a single professional object (for single service booking)
    if (selectedProfessional._id && selectedProfessional._id !== "any") {
      return selectedProfessional;
    }

    // If it's "any" professional
    if (selectedProfessional._id === "any") {
      return { _id: "any", name: "Any Professional" };
    }

    return null;
  }, [selectedProfessional]);

  // Fetch time slots — passes duration so backend generates correctly-sized slots
  const fetchTimeSlots = useCallback(async (professionalId, date, serviceDuration) => {
    if (!date) {
      console.warn("fetchTimeSlots: missing date");
      return;
    }
    if (!serviceDuration) {
      console.warn("fetchTimeSlots: missing serviceDuration");
      return;
    }

    // Convert duration string to minutes
    const durationMins = typeof serviceDuration === "number"
      ? serviceDuration
      : durationToMinutes(serviceDuration);

    // Build query URL
    let url;
    if (!professionalId || professionalId === "any") {
      // "Any professional" mode — backend picks the first available pro for each slot
      const sId = salon?._id;
      if (!sId) {
        console.warn("fetchTimeSlots: salonId needed for 'any' professional mode");
        return;
      }
      url = `${API_BASE_URL}/api/timeslots?professionalId=any&salonId=${sId}&date=${date}&duration=${durationMins}`;
    } else {
      url = `${API_BASE_URL}/api/timeslots?professionalId=${professionalId}&date=${date}&duration=${durationMins}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const key  = `${professionalId || "any"}-${date}-${durationMins}`;

      // Backend returns { startTime, endTime, conflicting, assignedProfessionalId? }
      // Filter out past time slots before setting state
      const filteredData = Array.isArray(data) ? data.filter(slot => {
        if (!slot.startTime) return false;
        return !isPastTimeSlot(date, slot.startTime);
      }) : [];

      setAvailableSlots(prev => ({ ...prev, [key]: filteredData }));
      console.debug(`[timeslots] fetched key=${key} total=${data.length} visible=${filteredData.length}`);
    } catch (err) {
      console.error("Error fetching time slots:", err);
      const key = `${professionalId || "any"}-${date}-${durationMins}`;
      setAvailableSlots(prev => ({ ...prev, [key]: [] }));
    }
  }, [isPastTimeSlot, salon]);

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
        setShowGuestAlert(false);
      } else if (guestUser) {
        const guestData = JSON.parse(guestUser);
        setUser(guestData);
        setIsGuest(true);
      } else {
        setUser(null);
        setIsGuest(false);
      }
    };

    checkAuthStatus();
  }, [location]);

  // Check for login success in location state
  useEffect(() => {
    if (location.state?.loginSuccess && location.state?.userData) {
      setUser(location.state.userData);
      setIsGuest(false);
      setShowGuestAlert(false);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Restore booking data after login
  useEffect(() => {
    const pendingBookingData = localStorage.getItem('pendingBookingData');

    if (pendingBookingData && user && !isGuest) {
      try {
        const data = JSON.parse(pendingBookingData);

        console.log(" Restoring booking data after login:", data);

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

        localStorage.removeItem('pendingBookingData');
        setRenderKey(prev => prev + 1);

      } catch (error) {
        console.error("Error restoring booking data:", error);
        localStorage.removeItem('pendingBookingData');
      }
    }
  }, [user, isGuest]);

  // Fetch initial slots when component loads
  useEffect(() => {
    if (selectedServices.length === 0) return;

    const currentService = selectedServices[currentServiceIndex.current];
    if (!currentService) return;

    const professional = resolveProfessionalForService(currentService._id);
    const professionalId = professional?._id;

    // For reschedule: use the appointment's date, otherwise use today
    const defaultDate = isReschedule && rescheduleAppointment?.date
      ? rescheduleAppointment.date
      : dates[0]?.fullDate;

    if (defaultDate) {
      setSelectedDates((prev) => ({ ...prev, [currentService._id]: defaultDate }));
      setSelectedTimes(prev => ({ ...prev, [currentService._id]: null }));
      fetchTimeSlots(professionalId, defaultDate, currentService.duration);
    }
  }, [selectedServices, isReschedule, rescheduleAppointment, dates, fetchTimeSlots, resolveProfessionalForService]);

  // Initialize reschedule data
  useEffect(() => {
    if (!isReschedule || !rescheduleAppointment) return;

    console.log(" Initializing reschedule data:", rescheduleAppointment);

    if (rescheduleAppointment.professionalId) {
      setSelectedProfessional(rescheduleAppointment.professionalId);
    }

    if (rescheduleAppointment.services?.length) {
      const mapped = rescheduleAppointment.services.map(s => ({
        _id: s.serviceId || s._id,
        name: s.name,
        price: s.price,
        duration: s.duration || "30 minutes",
      }));
      setSelectedServices(mapped);

      // Set selected date and time for the rescheduled appointment
      const serviceId = mapped[0]?._id;
      if (serviceId && rescheduleAppointment.date) {
        setSelectedDates(prev => ({ ...prev, [serviceId]: rescheduleAppointment.date }));
      }
    }
  }, [isReschedule, rescheduleAppointment]);

  // Build derived values for current service
  const currentService = useMemo(() => {
    return selectedServices[currentServiceIndex.current] || {};
  }, [selectedServices, currentServiceIndex.current]);

  const serviceKey = currentService._id || "service";
  const professional = resolveProfessionalForService(serviceKey);
  const professionalId = professional?._id;
  const selectedDate = selectedDates[serviceKey] || dates[0]?.fullDate;

  // Build cache key — includes duration so different services don't share cached slots
  const durationMins = durationToMinutes(currentService.duration);
  const slotKey = selectedDate ? `${professionalId || "any"}-${selectedDate}-${durationMins}` : null;
  const rawSlots = slotKey ? (availableSlots[slotKey] || []) : [];
  const safeSlots = Array.isArray(rawSlots) ? rawSlots : [];

  // Backend already returns correctly-sized slots — no need to filter by duration.
  // Map `conflicting` flag to `isBooked` for rendering consistency.
  // Also check against local `bookedAppointments` to prevent conflicts within the same booking session.
  const displaySlots = useMemo(() => {
    return safeSlots
      .filter(slot => slot.startTime && !isPastTimeSlot(selectedDate, slot.startTime))
      .map(slot => {
        const displayStartTime = slot.startTime;
        const slotDurationMins = durationToMinutes(currentService.duration);
        const resolvedProId = slot.assignedProfessionalId || professionalId;

        // Check if there's an existing backend conflict
        let isBooked = slot.conflicting;
        let insufficientGap = slot.insufficientGap || false;
        let availableGapMins = slot.availableGapMins || null;
        let nextAppointmentTime = slot.nextAppointmentTime || null;
        let isLeave = slot.isLeave || false;
        let leaveReason = slot.leaveReason || null;

        // If it is an insufficient gap conflict or a leave off-duty window, we don't treat it as hard-booked.
        // We want the user to be able to click it and see the informative modal.
        if (isBooked && (insufficientGap || isLeave)) {
          isBooked = false;
        }

        let isSessionConflict = false;
        let sessionConflictService = null;
        let sessionConflictMember = null;
        let sessionConflictProId = null;
        let sessionConflictProName = null;

        // Check if there's a local conflict with other selected services in this multi-service session
        // For individual booking: guest cannot be in two places at once, so check overlap regardless of professional!
        if (!isBooked && bookedAppointments.length > 0) {
          // Check if slot start time is covered by any session appointment
          const localConflictingAppt = bookedAppointments.find((appt) => {
            if (appt.date !== selectedDate) return false;

            const startMins = timeStringToMinutes(displayStartTime);
            const bStart = timeStringToMinutes(appt.startTime);
            const bEnd = timeStringToMinutes(appt.endTime);

            return startMins >= bStart && startMins < bEnd;
          });

          if (localConflictingAppt) {
            isSessionConflict = true;
            sessionConflictService = localConflictingAppt.serviceName;
            sessionConflictMember = localConflictingAppt.memberName;
            sessionConflictProId = localConflictingAppt.professionalId;
            sessionConflictProName = localConflictingAppt.professionalName;
          } else {
            // Check if the full duration overlaps
            const localOverlapAppt = bookedAppointments.find((appt) => {
              if (appt.date !== selectedDate) return false;

              const newStart = timeStringToMinutes(displayStartTime);
              const newEnd = newStart + slotDurationMins;
              const bStart = timeStringToMinutes(appt.startTime);
              const bEnd = timeStringToMinutes(appt.endTime);

              return newStart < bEnd && newEnd > bStart;
            });

            if (localOverlapAppt) {
              insufficientGap = true;
              
              // Find the next session appointment that starts after this slot
              const slotStartMins = timeStringToMinutes(displayStartTime);
              const futureAppts = bookedAppointments.filter((appt) => {
                if (appt.date !== selectedDate) return false;
                return timeStringToMinutes(appt.startTime) > slotStartMins;
              });

              futureAppts.sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));
              const nextAppt = futureAppts[0];
              if (nextAppt) {
                nextAppointmentTime = nextAppt.startTime;
                availableGapMins = timeStringToMinutes(nextAppt.startTime) - slotStartMins;
              }
            }
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
  }, [safeSlots, selectedDate, isPastTimeSlot, bookedAppointments, professionalId, currentService.duration]);

  // Handlers
  const handleDateClick = (serviceId, profId, fullDate) => {
    setSelectedDates(prev => ({ ...prev, [serviceId]: fullDate }));
    setSelectedTimes(prev => ({ ...prev, [serviceId]: null }));
    const service = selectedServices.find(s => s._id === serviceId);
    fetchTimeSlots(profId, fullDate, service?.duration);
  };

  const handleTimeClick = (serviceId, slotId, isBooked, slot) => {
    if (isBooked) return;

    if (slot?.isLeave) {
      const currentService = selectedServices[currentServiceIndex.current];
      const pro = resolveProfessionalForService(serviceId);
      setConflictModalData({
        isLeave: true,
        serviceName: currentService?.name || "Service",
        startTime: slot.startTime,
        proName: pro?.name || "Professional",
        leaveReason: slot.leaveReason || "Off-Duty"
      });
      return;
    }

    if (slot?.isSessionConflict) {
      // Trigger the beautiful interactive session conflict modal
      const currentService = selectedServices[currentServiceIndex.current];
      const pro = resolveProfessionalForService(serviceId);
      
      const isSamePro = slot.sessionConflictProId && pro && String(slot.sessionConflictProId) === String(pro._id);

      setConflictModalData({
        isSessionConflict: true,
        serviceName: currentService?.name || "Service",
        conflictService: slot.sessionConflictService,
        conflictMember: slot.sessionConflictMember,
        startTime: slot.startTime,
        proName: pro?.name || "Professional",
        conflictProName: slot.sessionConflictProName || "Professional",
        isSamePro: isSamePro
      });
      return;
    }

    if (slot?.insufficientGap) {
      // Trigger the beautiful interactive warning modal
      const currentService = selectedServices[currentServiceIndex.current];
      const pro = resolveProfessionalForService(serviceId);
      setConflictModalData({
        serviceName: currentService?.name || "Service",
        requiredDuration: currentService?.duration || "30 minutes",
        availableGapMins: slot.availableGapMins,
        nextAppointmentTime: slot.nextAppointmentTime,
        startTime: slot.startTime,
        endTime: slot.endTime,
        proName: pro?.name || "Professional"
      });
      return;
    }

    // Check if rescheduling within 24 hours
    if (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)) {
      setRescheduleError("❌ Cannot reschedule appointment within 24 hours.");
      return;
    }

    setSelectedTimes(prev => ({ ...prev, [serviceId]: slotId }));
  };

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

  // Update getCurrentAppointmentData function
  const getCurrentAppointmentData = useCallback(() => {
    const currentService = selectedServices[currentServiceIndex.current];
    const serviceId = currentService?._id;
    const slotId = selectedTimes[serviceId];
    const date = selectedDates[serviceId];
    const professional = resolveProfessionalForService(serviceId);

    // For "any professional" bookings, use the assignedProfessionalId from the chosen slot
    const selectedSlot = displaySlots.find(s =>
      (s._id && s._id === slotId) ||
      (s.id && s.id === slotId) ||
      (s.startTime && s.startTime === slotId)
    );

    const startTime = selectedSlot?.startTime || selectedSlot?.start || "";
    // Use backend-provided endTime if available, otherwise compute it
    const endTime = selectedSlot?.endTime
      ? selectedSlot.endTime
      : computeEndFromStartAndDuration(startTime, currentService?.duration);

    // For "any professional", the backend assigns which professional covers this slot
    const resolvedProfessionalId = (
      professional?._id === "any" || !professional?._id
    ) ? selectedSlot?.assignedProfessionalId : professional?._id;

    console.log(" Current appointment data:", {
      startTime,
      endTime,
      duration: currentService.duration,
      resolvedProfessionalId,
      assignedFromSlot: selectedSlot?.assignedProfessionalId,
    });

    return {
      salonId: salon?._id,
      professionalId: resolvedProfessionalId || professional?._id,
      professionalName: professional?.name || "Any Professional",
      serviceId: serviceId,
      serviceName: currentService?.name,
      price: currentService?.price,
      duration: currentService?.duration,
      date: date,
      startTime: startTime,
      endTime: endTime,
      memberName: user?.name || "Guest",
      phone: user?.phone || "",
      email: user?.email || "",
    };
  }, [selectedTimes, selectedDates, displaySlots, selectedServices, currentServiceIndex.current, salon, user, resolveProfessionalForService, professional]);

  // Check if user is authorized to book
  const isUserAuthorized = !isGuest && (user?.id !== 'guest');

  // Create appointment via API
  const createAppointment = async (appointmentData) => {
    try {
      setLoading(true);
      console.log(" Sending appointment data:", appointmentData);

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
      console.log(" Server response:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create appointment");
      }

      return result.data[0];
    } catch (error) {
      console.error(" Error creating appointment:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle reschedule for individual booking
  const handleReschedule = async () => {
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

    if (isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)) {
      setRescheduleError("❌ You cannot reschedule an appointment that is within 24 hours. Please contact customer support.");
      return;
    }

    setLoading(true);
    try {
      const currentAppointment = getCurrentAppointmentData();

      if (!currentAppointment.startTime || !currentAppointment.endTime) {
        throw new Error("Invalid time selection. Please select a valid time slot.");
      }

      console.log(" Sending reschedule request:", {
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
      console.log(" Reschedule API response:", result);

      if (result.success) {
        alert("✅ Appointment rescheduled successfully!");
        navigate("/appointments");
      } else {
        throw new Error(result.message || "Reschedule failed");
      }
    } catch (err) {
      console.error(" Reschedule failed:", err);
      alert(`❌ Reschedule failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Update handleContinue function to use service IDs
  const handleContinue = async () => {
    // Check if user is guest
    if (!isUserAuthorized) {
      setShowGuestAlert(true);
      return;
    }

    const currentService = selectedServices[currentServiceIndex.current];
    const serviceId = currentService?._id;

    console.log(" handleContinue called for service:", currentService?.name);

    if (!selectedTimes[serviceId]) {
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

      console.log(" Saving appointment for:", currentAppointment.serviceName);
      console.log(" Total booked after save:", updatedBookedAppointments.length);

      setBookedAppointments(updatedBookedAppointments);

      // Move to next service
      currentServiceIndex.current += 1;
      setRenderKey(k => k + 1);

      const nextService = selectedServices[currentServiceIndex.current];
      if (nextService) {
        const nextServiceId = nextService._id;
        setSelectedTimes(prev => ({ ...prev, [nextServiceId]: null }));

        // Auto-fetch slots for next service
        const nextProfessional = resolveProfessionalForService(nextServiceId);
        const nextProfessionalId = nextProfessional?._id;
        const nextDefaultDate = dates[0]?.fullDate;
        if (nextDefaultDate) {
          setSelectedDates(prev => ({ ...prev, [nextServiceId]: nextDefaultDate }));
          fetchTimeSlots(nextProfessionalId, nextDefaultDate, nextService?.duration);
        }
      }
    } else {
      // All services selected — navigate to checkout WITHOUT creating appointments yet
      const currentAppointment = getCurrentAppointmentData();
      const finalAppointments = [...bookedAppointments, currentAppointment];

      console.log(" Final appointments (pending, not yet in DB):", finalAppointments.length);

      // Navigate to checkout with raw data — appointment created only after payment
      navigateToCheckout(finalAppointments);
    }
  };

  // Navigate to checkout with RAW booking data (NO DB creation yet - happens after payment)
  const navigateToCheckout = (appointments) => {
    const isMulti = appointments.length > 1;

    // For single appointment, we need specific props expected by CheckoutPage
    const singleProps = !isMulti ? {
      service: {
        name: appointments[0].serviceName,
        price: appointments[0].price,
        duration: appointments[0].duration
      },
      professional: {
        name: appointments[0].professionalName || "Any Professional"
      },
      selectedDate: appointments[0].date,
      selectedTime: appointments[0].startTime,
      salon: salon
    } : {};

    const checkoutData = {
      ...singleProps,
      salonName: salon?.name || "Our Salon",
      // Raw appointment data - not yet saved to DB
      pendingAppointments: appointments,
      appointmentDetails: appointments.map(appt => ({
        serviceName: appt.serviceName,
        price: appt.price,
        duration: appt.duration,
        date: appt.date,
        startTime: appt.startTime,
        endTime: appt.endTime,
        professionalName: appt.professionalName || "Any Professional",
        professionalId: appt.professionalId,
        salonId: appt.salonId,
        serviceId: appt.serviceId,
        memberName: appt.memberName || user?.name || "Guest",
        phone: user?.phone || "",
        email: user?.email || "",
      })),
      totalAmount: totalAmount,
      customerName: user?.name || "Guest",
      customerPhone: user?.phone,
      customerEmail: user?.email,
      isGroupBooking: isMulti,
      salonLocation: salon?.location,
      salon: salon,
      user: user,
      // Mark as pending - no appointmentId yet
      appointmentId: null,
      bookingId: null,
    };

    console.log(" Navigating to checkout with PENDING data (no DB yet):", checkoutData);

    // Clear localStorage
    localStorage.removeItem('selectedServices');
    localStorage.removeItem('selectedProfessional');
    localStorage.removeItem('selectedSalon');
    localStorage.removeItem('pendingBookingData');

    navigate("/checkoutpage", { state: checkoutData });
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

    setShowGuestAlert(false);
  };

  const appointmentsToDisplay = getAllAppointmentsForDisplay();
  const displayTotalAmount = appointmentsToDisplay.reduce((total, appointment) => {
    return total + (Number(appointment.price) || 0);
  }, 0);
  // No services selected
  if (selectedServices.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50 font-sans flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldExclamationIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">No Services Selected</h2>
          <p className="text-sm text-gray-500 mb-6">Please select at least one service to continue booking.</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
          >
            Go back to services
          </button>
        </div>
      </div>
    );
  }

  // Render
  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-28 lg:pb-12 relative" key={renderKey}>
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate("/")}
          >

          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-500 hover:text-dark-900 transition-colors"
          >
            Back
          </button>
        </div>
      </header>

      {/* Guest Alert Modal */}
      {showGuestAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm" onClick={() => setShowGuestAlert(false)}></div>
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl relative z-10 fade-in slide-up">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <LockClosedIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-center text-gray-900 mb-2">Sign In Required</h3>
            <p className="text-center text-gray-500 text-sm mb-6">
              You're currently browsing as a guest. To book appointments, please sign in or create an account.
            </p>
            <div className="space-y-3">
              <button
                className="w-full py-3.5 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                onClick={handleNavigateToLogin}
              >
                Sign In / Sign Up
              </button>
              <button
                className="w-full py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                onClick={() => setShowGuestAlert(false)}
              >
                Continue as Guest (View Only)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Warning Modal */}
      {conflictModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm" onClick={() => setConflictModalData(null)}></div>
          {conflictModalData.isLeave ? (
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl relative z-10 fade-in slide-up border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <ClockIcon className="w-8 h-8 text-gray-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-center text-gray-900 mb-2">Staff Off-Duty</h3>
              <div className="text-center text-gray-500 text-sm mb-6 leading-relaxed">
                <p className="mb-4">
                  <span className="font-bold text-gray-800">{conflictModalData.proName}</span> is not available at <span className="font-bold text-gray-800">{conflictModalData.startTime}</span> because they are off-duty or on leave.
                </p>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left text-gray-700 mb-4">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Reason for Absence:</span>
                    <span className="text-gray-950 font-bold">{conflictModalData.leaveReason}</span>
                  </div>
                </div>
                <p>Please select another available time slot or pick a different professional.</p>
              </div>
              <div className="space-y-3">
                <button
                  className="w-full py-3.5 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                  onClick={() => setConflictModalData(null)}
                >
                  Got it, Choose Another Time
                </button>
              </div>
            </div>
          ) : conflictModalData.isSessionConflict ? (
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl relative z-10 fade-in slide-up border border-indigo-100">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CalendarDaysIcon className="w-8 h-8 text-indigo-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-center text-gray-900 mb-2">Time Already Selected</h3>
              <div className="text-center text-gray-500 text-sm mb-6 leading-relaxed">
                <p className="mb-4">
                  You have already selected this time slot (<span className="font-bold text-gray-800">{conflictModalData.startTime}</span>) for <span className="font-bold text-indigo-600">{conflictModalData.conflictService}</span> in this session.
                </p>
                {conflictModalData.isSamePro ? (
                  <p>
                    Since you cannot receive two services at once and <span className="font-bold text-gray-800">{conflictModalData.proName}</span> cannot be double-booked, please choose a different time slot for <span className="font-bold text-gray-800">{conflictModalData.serviceName}</span>.
                  </p>
                ) : (
                  <p>
                    Since you cannot receive two services at the same time (even with different professionals like <span className="font-bold text-gray-800">{conflictModalData.conflictProName}</span> and <span className="font-bold text-gray-800">{conflictModalData.proName}</span>), please choose a different time slot for <span className="font-bold text-gray-800">{conflictModalData.serviceName}</span>.
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <button
                  className="w-full py-3.5 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                  onClick={() => setConflictModalData(null)}
                >
                  Got it, Choose Another Time
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl relative z-10 fade-in slide-up border border-amber-100">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <ClockIcon className="w-8 h-8 text-amber-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-center text-gray-900 mb-2">Insufficient Time</h3>
              <div className="text-center text-gray-500 text-sm mb-6 leading-relaxed">
                <p className="mb-4">
                  Your selected service (<span className="font-bold text-gray-800">{conflictModalData.serviceName}</span>) requires <span className="font-bold text-gray-800">{conflictModalData.requiredDuration}</span>.
                </p>
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-left text-amber-900 space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-medium opacity-80">
                    <span>Available Time Slot:</span>
                    <span className="font-bold">{conflictModalData.startTime}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium opacity-80">
                    <span>Next Appointment Starts:</span>
                    <span className="font-bold">{conflictModalData.nextAppointmentTime}</span>
                  </div>
                  <hr className="border-amber-100" />
                  <div className="flex justify-between text-xs font-black">
                    <span>Free Window Duration:</span>
                    <span className="text-amber-700">{conflictModalData.availableGapMins} mins</span>
                  </div>
                </div>
                <p>
                  However, <span className="font-bold text-gray-800">{conflictModalData.proName}</span> is only free for <span className="font-black text-amber-700">{conflictModalData.availableGapMins} minutes</span> before their next booked appointment.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  className="w-full py-3.5 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                  onClick={() => setConflictModalData(null)}
                >
                  Got it, Choose Another Time
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-dark-900 rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-bold text-gray-900 animate-pulse">
            Processing your {isReschedule ? 'reschedule' : 'appointment'}...
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:gap-12">

          {/* Main Content (Left) */}
          <div className="lg:col-span-8 flex flex-col">

            {/* Breadcrumb */}
            <nav className="flex items-center flex-wrap gap-2 text-sm font-bold text-gray-400 mb-8">
              <span className="text-dark-900 cursor-pointer hover:underline" onClick={() => navigate("/")}>1. Services</span>
              <ChevronRightIcon className="w-4 h-4 text-gray-300" />
              <span className="text-dark-900 cursor-pointer hover:underline" onClick={() => navigate(-1)}>2. Professional</span>
              <ChevronRightIcon className="w-4 h-4 text-gray-300" />
              <span className="text-dark-900 bg-gray-100 px-3 py-1 rounded-full">{isReschedule ? 'Reschedule' : '3. Time'}</span>
              <ChevronRightIcon className="w-4 h-4 text-gray-300" />
              <span className="opacity-60">{isReschedule ? 'Confirm' : '4. Confirm'}</span>
            </nav>

            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                {isReschedule ? "Reschedule" : "Select Time"}
                <span className="block text-xl sm:text-2xl text-primary-500 font-bold mt-1">for {currentService.name}</span>
              </h1>
            </div>

            {/* Notifications */}
            {isGuest && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                <LockClosedIcon className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  You're browsing as a guest. <button onClick={() => setShowGuestAlert(true)} className="font-bold underline">Sign in to book</button>
                </p>
              </div>
            )}

            {isReschedule && rescheduleAppointment && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <CalendarDaysIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-blue-900">Rescheduling Existing Appointment</h4>
                    <p className="text-sm text-blue-800/80 mt-1">
                      Current: {new Date(rescheduleAppointment.date).toLocaleDateString()} at {rescheduleAppointment.startTime} - {rescheduleAppointment.endTime}
                    </p>
                    {isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime) && (
                      <p className="text-xs font-bold text-red-600 mt-2 bg-red-100 px-2 py-1 rounded-md inline-block">
                        Within 24 hours - cannot reschedule
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {rescheduleError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 font-medium mb-6">
                {rescheduleError}
              </div>
            )}

            {/* Service Progress */}
            {selectedServices.length > 1 && !isReschedule && (
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-primary-500 uppercase tracking-widest bg-primary-50 px-2.5 py-1 rounded-md">
                    {currentServiceIndex.current + 1} of {selectedServices.length}
                  </span>
                  <span className="text-base font-bold text-gray-400">Services</span>
                </div>
                {bookedAppointments.length > 0 && (
                  <span className="text-sm font-bold text-green-600 flex items-center gap-1.5 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {bookedAppointments.length} scheduled
                  </span>
                )}
              </div>
            )}

            {/* Dates Selection */}
            {!professionalId ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center text-yellow-800 font-medium mb-8">
                No professional selected for this service.
              </div>
            ) : (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                  <h3 className="font-bold text-gray-900">Select Date</h3>
                </div>

                <div className="flex overflow-x-auto gap-3 pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                  {currentService && dates.map(day => {
                    const serviceId = currentService._id;
                    const isSelected = selectedDates[serviceId] === day.fullDate;
                    
                    // Timezone-safe day of week parsing
                    const isSalonClosed = checkIsSalonClosed(day.fullDate).closed;
                    
                    const isDisabled = isGuest || isSalonClosed || (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime));

                    return (
                      <button
                        key={`${serviceId}-${day.fullDate}`}
                        onClick={() => professionalId && handleDateClick(serviceId, professionalId, day.fullDate)}
                        disabled={isDisabled}
                        className={`flex flex-col flex-none items-center justify-center p-3 rounded-2xl border-2 min-w-[4.5rem] sm:min-w-[5rem] transition-all duration-200 ${
                          isSelected
                            ? 'bg-dark-900 border-dark-900 shadow-md shadow-dark-900/20 scale-105'
                            : isSalonClosed
                            ? 'bg-red-50/40 border-red-200 text-red-600'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } ${isDisabled && !isSalonClosed ? 'opacity-50 cursor-not-allowed' : isSalonClosed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-gray-300' : isSalonClosed ? 'text-red-500' : 'text-gray-400'}`}>
                          {isSalonClosed ? "Closed" : day.day}
                        </span>
                        <span className={`text-xl sm:text-2xl font-black ${isSelected ? 'text-white' : isSalonClosed ? 'text-red-700' : 'text-gray-900'}`}>
                          {day.date}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time Slots Grid */}
            {professionalId && selectedDate && (() => {
              const isSalonClosedOnSelectedDate = checkIsSalonClosed(selectedDate).closed;

              return (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">Available Times</h3>
                  </div>

                  {isSalonClosedOnSelectedDate ? (
                    <div className="bg-red-50/50 border border-red-200 rounded-2xl p-10 text-center">
                      <p className="text-red-800 font-bold text-lg flex items-center justify-center gap-1.5">🔒 Salon is Closed</p>
                      <p className="text-sm mt-2 text-red-600 font-medium">{getSalonClosedReason(selectedDate)}</p>
                    </div>
                  ) : displaySlots.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-10 text-center">
                      <p className="text-gray-500 font-medium">
                        No available time slots on {new Date(selectedDate).toLocaleDateString()}.
                      </p>
                      {isPastTimeSlot(selectedDate, "23:59") && (
                        <p className="text-sm mt-3 text-red-500 font-bold bg-red-50 py-1.5 px-3 rounded-lg inline-block">
                          ⏰ Today's slots have passed. Please select a future date.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {displaySlots.map(slot => {
                        const slotId = slot._id || slot.id || slot.startTime;
                        const serviceId = currentService._id;
                        const isSelected = selectedTimes[serviceId] === slotId;
                        const isBooked = !!slot.isBooked;
                        const isLimited = !!slot.insufficientGap;
                        const isSessionConflict = !!slot.isSessionConflict;
                        const isLeave = !!slot.isLeave;
                        const displayStartTime = slot.startTime || slot.start;
                        const displayEndTime = computeEndFromStartAndDuration(displayStartTime, currentService.duration);
                        const isDisabled = isGuest || isBooked || (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime));

                        return (
                          <div
                            key={slotId}
                            onClick={() => {
                              if (isDisabled) return;
                              if (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)) {
                                setRescheduleError("❌ Cannot reschedule appointment within 24 hours.");
                                return;
                              }
                              handleTimeClick(currentService._id, slotId, isBooked, slot);
                            }}
                            className={`relative flex flex-col items-center justify-center py-3.5 px-2 rounded-xl border-2 transition-all duration-200 ${isBooked ? "bg-gray-100 border-gray-200 text-gray-400 border-dashed" :
                              isLeave ? "bg-gray-50 border-gray-200 text-gray-400 border-dashed hover:border-gray-300" :
                              isSessionConflict ? "bg-indigo-50/70 border-indigo-200 hover:border-indigo-400 text-indigo-900 shadow-sm" :
                              isLimited ? "bg-amber-50/50 border-amber-200 hover:border-amber-400 text-amber-900 shadow-sm" :
                              isSelected ? "bg-dark-900 border-dark-900 shadow-lg shadow-dark-900/20" :
                                "bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-sm"
                              } ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <span className={`text-[15px] font-bold ${isSelected ? 'text-white' : (isBooked || isLeave) ? 'text-gray-400' : isSessionConflict ? 'text-indigo-800' : isLimited ? 'text-amber-800' : 'text-gray-900'}`}>
                              {displayStartTime}
                            </span>

                            {/* Booked / Session / Limited / Leave indicator */}
                            {isBooked ? (
                              <span className="text-[10px] uppercase font-bold tracking-widest mt-1">Booked</span>
                            ) : isLeave ? (
                              <span className="text-[10px] uppercase font-bold tracking-widest mt-1 text-gray-500 flex items-center gap-0.5 animate-pulse">
                                <span>💤</span> Off-Duty
                              </span>
                            ) : isSessionConflict ? (
                              <span className="text-[10px] uppercase font-black tracking-wider mt-1 text-indigo-600 flex items-center gap-0.5 animate-pulse">
                                <span>📅</span> Your Slot
                              </span>
                            ) : isLimited ? (
                              <span className="text-[10px] uppercase font-bold tracking-widest mt-1 text-amber-600 flex items-center gap-0.5 animate-pulse">
                                <span>⚠️</span> Limited
                              </span>
                            ) : (
                              <span className={`text-[10px] font-medium mt-1 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                                LKR {currentService.price}
                              </span>
                            )}

                            {isGuest && <LockClosedIcon className="absolute top-1.5 right-1.5 w-3 h-3 opacity-50" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

          </div>

          {/* Sidebar / Summary — DESKTOP ONLY */}
          <div className="hidden lg:block lg:col-span-4 relative">
            <div className="sticky top-28 bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col min-h-[400px]">

              {/* Salon Preview */}
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-6 w-full">
                <img
                  src={salon?.image ? getSalonImageUrl(salon.image) : "https://picsum.photos/100/100?random=9"}
                  alt="Salon"
                  className="w-14 h-14 object-cover rounded-[1rem] border border-gray-100 shadow-sm shrink-0"
                />
                <div className="flex flex-col min-w-0 pr-2">
                  <h4 className="text-sm font-black text-gray-900 line-clamp-1 truncate">{salon?.name || "Salon"}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1 truncate">
                    {typeof salon?.location === 'string' ? salon.location : salon?.location?.district || "Unknown Location"}
                  </p>
                </div>
              </div>

              {/* Current Context */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6">
                <div className="flex gap-3 mb-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <span className="text-sm">💇</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary-500 mb-0.5">Current Service</p>
                    <p className="font-bold text-gray-900 leading-tight truncate">{currentService.name}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">With: {professional?.name || "Any Professional"}</p>
                  </div>
                </div>

                {selectedTimes[serviceKey] && selectedDate ? (
                  <div className="bg-white rounded-xl p-3 border border-gray-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-bold text-gray-900">{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-black text-dark-900">
                        {displaySlots.find(s => (s._id === selectedTimes[serviceKey] || s.id === selectedTimes[serviceKey] || s.startTime === selectedTimes[serviceKey]))?.startTime}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 border-dashed rounded-xl p-3 text-center text-xs font-medium text-gray-400">
                    Select a time slot
                  </div>
                )}
              </div>

              {/* Scheduled Services Summary */}
              {appointmentsToDisplay.length > 0 && (
                <div className="mb-6 max-h-[150px] overflow-y-auto pr-2 hide-scrollbar">
                  <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Scheduled Items ({appointmentsToDisplay.length})
                  </h5>
                  <div className="space-y-3">
                    {appointmentsToDisplay.map((appointment, index) => (
                      <div key={index} className="flex flex-col gap-1 bg-white p-3 rounded-xl border border-gray-100 text-sm shadow-sm relative overflow-hidden fade-in">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-dark-900"></div>
                        <div className="flex justify-between items-start">
                          <strong className="text-gray-900 truncate pr-2">{appointment.serviceName}</strong>
                          <span className="font-bold shrink-0">LKR {appointment.price}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="font-bold text-gray-700">{appointment.startTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Area */}
              <div className="mt-auto pt-6 border-t border-gray-100">
                <div className="flex justify-between items-end mb-5">
                  <p className="text-sm font-bold text-gray-500">Total Amount</p>
                  <p className="text-2xl font-black text-dark-900 leading-none">
                    LKR {displayTotalAmount}
                  </p>
                </div>

                {isGuest ? (
                  <div className="text-center">
                    <button
                      className="w-full py-4 rounded-xl flex justify-center items-center gap-2 bg-gray-100 text-gray-500 font-bold border border-gray-200 hover:bg-gray-200 transition-colors"
                      onClick={() => setShowGuestAlert(true)}
                    >
                      <LockClosedIcon className="w-5 h-5" />
                      Sign In to Book
                    </button>
                    <p className="text-xs text-gray-400 mt-3 font-medium">Guest users cannot make bookings.</p>
                  </div>
                ) : (
                  <button
                    className={`w-full py-4 rounded-xl font-bold flex flex-col items-center justify-center transition-all duration-300 shadow-xl ${!selectedTimes[serviceKey] || loading || (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime))
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200"
                      : "bg-dark-900 text-white hover:bg-black hover:shadow-dark-900/20 active:scale-[0.98]"
                      }`}
                    onClick={handleContinue}
                    disabled={
                      !selectedTimes[serviceKey] ||
                      loading ||
                      !isUserAuthorized ||
                      (isReschedule && isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime))
                    }
                  >
                    <span className="flex items-center gap-2 text-[15px]">
                      {loading ? "Processing..." :
                        isReschedule ?
                          (isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime) ?
                            "Reschedule Not Allowed" :
                            "Confirm Reschedule") :
                          currentServiceIndex.current + 1 < selectedServices.length
                            ? `Next Service (${currentServiceIndex.current + 1}/${selectedServices.length})`
                            : `Confirm & Checkout`
                      }
                      {!loading && (!isReschedule || !isWithin24Hours(rescheduleAppointment.date, rescheduleAppointment.startTime)) && <ChevronRightIcon className="w-5 h-5" />}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl px-4 pt-3 pb-5">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-400 truncate">
              {currentService.name}
            </p>
            <p className="text-lg font-black text-dark-900">
              {selectedTimes[serviceKey] ? `LKR ${displayTotalAmount}` : "Select a time"}
            </p>
          </div>
          {isGuest ? (
            <button
              className="shrink-0 px-5 py-3 rounded-xl font-bold flex items-center gap-1.5 text-sm bg-gray-100 text-gray-500 border border-gray-200"
              onClick={() => setShowGuestAlert(true)}
            >
              <LockClosedIcon className="w-4 h-4" /> Sign In
            </button>
          ) : (
            <button
              className={`shrink-0 px-5 py-3 rounded-xl font-bold flex items-center gap-1.5 text-sm transition-all ${!selectedTimes[serviceKey] || loading || !isUserAuthorized
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-dark-900 text-white hover:bg-black active:scale-95"
                }`}
              onClick={handleContinue}
              disabled={!selectedTimes[serviceKey] || loading || !isUserAuthorized}
            >
              {loading ? "..." : isReschedule ? "Reschedule" :
                currentServiceIndex.current + 1 < selectedServices.length
                  ? `Next (${currentServiceIndex.current + 1}/${selectedServices.length})`
                  : "Checkout"
              } <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectTimePage;