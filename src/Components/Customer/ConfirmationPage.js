// ConfirmationPage.jsx - Fixed Version
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserIcon, CreditCardIcon, DevicePhoneMobileIcon, MapPinIcon, ClockIcon, UsersIcon, ArrowPathIcon, PencilIcon, SparklesIcon } from '@heroicons/react/24/outline';
import "./ConfirmationPage.css";

const API_BASE_URL = process.env.REACT_APP_API_URL ? 
  process.env.REACT_APP_API_URL.replace('/api', '') : 
  'https://saloon-booking-system-backend-v2.onrender.com';

const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("pending"); // pending, success, error, skipped
  
  const {
    salonName = "Our Salon",
    appointmentDetails = [],
    totalAmount = 0,
    bookingId = `booking-${Date.now()}`,
    customerName = "Guest",
    isGroupBooking = false,
    salonLocation = "",
    professionalName = "Any Professional",
    // services = [], // Commented out unused variable
    // groupMembers = [], // Commented out unused variable
    salon,
    user = JSON.parse(localStorage.getItem("user")) || {},
    appointmentId, // This indicates individual booking was already saved
    isReschedule // This indicates it's a reschedule
  } = location.state || {};

  console.log("📋 Confirmation Page Data:", {
    salonName,
    appointmentDetails,
    totalAmount,
    bookingId,
    customerName,
    isGroupBooking,
    user,
    salon,
    appointmentId,
    isReschedule,
    appointmentDetailsRaw: appointmentDetails
  });

  // Save appointments to backend when confirmation page loads - ONLY FOR GROUP BOOKINGS
  useEffect(() => {
    const saveAppointmentsToBackend = async () => {
      // 🚨 FIX: Skip saving for individual bookings (they're already saved)
      if (!isGroupBooking) {
        console.log("✅ Individual booking - appointments already saved, skipping backend save");
        setSaveStatus("skipped");
        
        // Clear localStorage for individual bookings too
        localStorage.removeItem('selectedServices');
        localStorage.removeItem('selectedProfessional');
        localStorage.removeItem('selectedSalon');
        localStorage.removeItem('bookedAppointments');
        
        return;
      }

      if (appointmentDetails.length === 0) {
        console.log("❌ No appointment details to save");
        setSaveStatus("error");
        return;
      }

      // Check if we've already saved these appointments
      const savedKey = `appointments_saved_${bookingId}`;
      if (localStorage.getItem(savedKey)) {
        console.log("✅ Appointments already saved, skipping...");
        setSaveStatus("success");
        return;
      }

      setIsSaving(true);
      setSaveStatus("pending");
      
      try {
        // Transform data for backend - only for group bookings
        const appointmentData = {
          phone: user?.phone || "",
          email: user?.email || "",
          name: customerName,
          appointments: appointmentDetails.map(appt => ({
            salonId: appt.salonId || salon?._id,
            professionalId: appt.professionalId,
            serviceName: appt.serviceName,
            price: appt.price,
            duration: appt.duration,
            date: appt.date,
            startTime: appt.startTime,
            endTime: appt.endTime,
            // Include member info for group bookings
            memberName: appt.memberName,
            memberCategory: appt.memberCategory,
            professionalName: appt.professionalName
          })),
          isGroupBooking: true // Only true for group bookings
        };

        console.log("💾 Saving GROUP appointments to backend:", appointmentData);

        const response = await fetch(`${API_BASE_URL}/api/appointments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(appointmentData),
        });

        const result = await response.json();
        
        if (result.success) {
          console.log("✅ Group appointments saved successfully:", result.data);
          setSaveStatus("success");
          
          // Mark as saved to prevent duplicate saves
          localStorage.setItem(savedKey, "true");
          
          // Clear localStorage after successful save
          localStorage.removeItem('bookedAppointments');
          localStorage.removeItem('selectedServices');
          localStorage.removeItem('selectedProfessional');
          localStorage.removeItem('selectedSalon');
          localStorage.removeItem('isGroupBooking');
          localStorage.removeItem('groupMembers');
        } else {
          console.error("❌ Failed to save group appointments:", result.message);
          setSaveStatus("error");
        }
      } catch (error) {
        console.error("❌ Error saving group appointments:", error);
        setSaveStatus("error");
      } finally {
        setIsSaving(false);
      }
    };

    saveAppointmentsToBackend();
  }, [appointmentDetails, isGroupBooking, customerName, user, salon, bookingId]);

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

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleViewBookings = () => {
    navigate("/appointments");
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

  // Get status message for saving appointments
  const getStatusMessage = () => {
    if (isSaving) return "Saving your appointments...";
    if (saveStatus === "success") return "✅ Appointments saved successfully!";
    if (saveStatus === "skipped") return "✅ Booking confirmed!";
    if (saveStatus === "error") return "There was an issue saving your appointments. Please check your bookings page.";
    return "Processing your booking...";
  };

  // Get appropriate header message
  const getHeaderMessage = () => {
    if (isReschedule) {
      return "Appointment Rescheduled!";
    }
    return "Booking Confirmed!";
  };

  // Get appropriate thank you message
  const getThankYouMessage = () => {
    if (isReschedule) {
      return `Your appointment has been successfully rescheduled at ${salonName}!`;
    }
    return `Thank you for choosing ${salonName}! Your ${isGroupBooking ? 'group appointments have' : 'appointment has'} been successfully booked. We're excited to make your visit special.`;
  };

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-header">
          <div className="success-icon">✅</div>
          <h1>{getHeaderMessage()}</h1>
          <p className="thank-you-message">
            {getThankYouMessage()}
          </p>
          
          {/* Status indicator */}
          <div className={`save-status ${saveStatus}`}>
            {getStatusMessage()}
          </div>
        </div>

        <div className="confirmation-details">
          <div className="booking-summary">
            <h2>Booking Summary</h2>
            
            <div className="summary-grid">
              <div className="summary-item">
                <span>Customer Name:</span>
                <strong>{customerName}</strong>
              </div>

              <div className="summary-item">
                <span>Salon:</span>
                <strong>{salonName}</strong>
              </div>

              {salonLocation && (
                <div className="summary-item">
                  <span>Location:</span>
                  <span>{salonLocation}</span>
                </div>
              )}

              <div className="summary-item">
                <span>Total Services:</span>
                <strong>{getTotalServices()}</strong>
              </div>

              <div className="summary-item">
                <span>Total Duration:</span>
                <strong>{formatDuration(getTotalDuration())}</strong>
              </div>

              {appointmentId && !isGroupBooking && (
                <div className="summary-item">
                  <span>Booking ID:</span>
                  <strong>{appointmentId}</strong>
                </div>
              )}
            </div>

            {appointmentDetails.length > 0 && (
              <div className="appointments-list">
                <h3>{isGroupBooking ? 'Group Appointments Details' : 'Appointment Details'}</h3>
                {appointmentDetails.map((appointment, index) => (
                  <div key={index} className="appointment-card">
                    {isGroupBooking && (
                      <div className="member-info">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-5 w-5 text-gray-600" />
                          <strong>{appointment.memberName || customerName}</strong>
                        </div>
                        {appointment.memberCategory && (
                          <span className="member-category">({appointment.memberCategory})</span>
                        )}
                      </div>
                    )}
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

          <div className="important-notes">
            <h3>Important Information</h3>
            <ul>
              <li className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-blue-600" />
                Please arrive 10-15 minutes before your scheduled appointment
              </li>
              <li className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-orange-600" />
                Late arrivals may result in reduced service time
              </li>
              <li className="flex items-center gap-2">
                <CreditCardIcon className="h-4 w-4 text-green-600" />
                Payment will be collected at the salon
              </li>
              {isGroupBooking && (
                <li className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-purple-600" />
                  All group members should arrive together for their appointments
                </li>
              )}
              <li className="flex items-center gap-2">
                <DevicePhoneMobileIcon className="h-4 w-4 text-blue-600" />
                You will receive a confirmation SMS and email shortly
              </li>
              <li className="flex items-center gap-2">
                <ArrowPathIcon className="h-4 w-4 text-gray-600" />
                Changes or cancellations can be made up to 24 hours before the appointment
              </li>
              {isReschedule && (
                <li className="flex items-center gap-2">
                  <PencilIcon className="h-4 w-4 text-indigo-600" />
                  Your original appointment has been updated with the new time
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="confirmation-actions">
          <button 
            className="btn-primary"
            onClick={handleBackToHome}
            disabled={isSaving}
          >
            {isSaving ? "Processing..." : "Back to Home"}
          </button>
          <button 
            className="btn-secondary"
            onClick={handleViewBookings}
            disabled={isSaving}
          >
            {isSaving ? "Processing..." : "View My Bookings"}
          </button>
        </div>

        <div className="confirmation-footer">
          <p className="flex items-center justify-center gap-2">
            We can't wait to see you at {salonName}!
            <SparklesIcon className="h-5 w-5 text-yellow-500" />
          </p>
          <p className="footer-note">A confirmation has been sent to your registered email and phone number.</p>
        </div>
      </div>

      {/* Loading overlay - only show for group bookings */}
      {isSaving && isGroupBooking && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Saving your appointments...</p>
        </div>
      )}
    </div>
  );
};

export default ConfirmationPage;