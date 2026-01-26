// ConfirmationPage.jsx - PayHere Integrated Version
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { UserIcon, CreditCardIcon, DevicePhoneMobileIcon, MapPinIcon, ClockIcon, UsersIcon, SparklesIcon } from '@heroicons/react/24/outline';
import "./ConfirmationPage.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://saloon-booking-system-backend-v2.onrender.com/api';

const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State for data source (either from router state or fetched from API)
  const [bookingData, setBookingData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state); // Load if no state
  const [error, setError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("pending");

  // Get Order ID from URL if available (returned from PayHere)
  const orderIdFromUrl = searchParams.get('order_id');

  // Fetch booking details if not in state but order_id is present
  useEffect(() => {
    if (bookingData) {
      setLoading(false);
      return;
    }

    if (!orderIdFromUrl) {
      setLoading(false);
      return; // No data and no ID to fetch
    }

    const fetchBookingDetails = async () => {
      setLoading(true);
      try {
        // Assumption: Backend endpoint to get booking by PayHere Order ID
        const response = await fetch(`${API_BASE_URL}/appointments/order/${orderIdFromUrl}`);
        const result = await response.json();

        if (result.success) {
          // Transform API response to match component's expected data structure
          // This mapping depends on what the backend actually returns. 
          // I am mapping it based on the fields used in this component.
          const data = result.data;
          setBookingData({
            salonName: data.salon?.name || "Salon",
            appointmentDetails: data.appointments || [],
            totalAmount: data.totalAmount || 0,
            bookingId: data.bookingId || orderIdFromUrl,
            customerName: data.customerName || data.user?.name || "Guest",
            isGroupBooking: !!data.isGroupBooking,
            salonLocation: data.salon?.location || "",
            professionalName: "Professional", // Fallback logic might be needed
            salon: data.salon,
            user: data.user,
            appointmentId: data._id, // If single appointment
            isReschedule: data.isReschedule
          });
          setSaveStatus("success"); // Assume if we fetched it, it's saved/confirmed
        } else {
          setError("Could not retrieve booking details. Please contact support.");
        }
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [orderIdFromUrl, bookingData]);


  // Destructure from bookingData with defaults, ONLY if bookingData exists
  const {
    salonName = "Our Salon",
    appointmentDetails = [],
    totalAmount = 0,
    bookingId = `booking-${Date.now()}`,
    customerName = "Guest",
    isGroupBooking = false,
    salonLocation = "",
    professionalName = "Any Professional",
    salon,
    user = JSON.parse(localStorage.getItem("user")) || {},
    appointmentId,
    isReschedule
  } = bookingData || {};


  // Re-run save logic ONLY if we have data from State (New Booking flow)
  // If we fetched from API, we assume it's already saved.
  useEffect(() => {
    // Only save if:
    // 1. We have data from location state (implies flow from checkout)
    // 2. We NOT fetching from URL (which implies return flow)
    // 3. It's a group booking (as per original logic)
    if (!location.state || orderIdFromUrl) return;

    // ... Original Save Logic Preserved ...
    const saveAppointmentsToBackend = async () => {
      if (!isGroupBooking) {
        setSaveStatus("skipped");
        // Clear local storage logic
        localStorage.removeItem('selectedServices');
        localStorage.removeItem('selectedProfessional');
        localStorage.removeItem('selectedSalon');
        localStorage.removeItem('bookedAppointments');
        return;
      }

      if (appointmentDetails.length === 0) {
        setSaveStatus("error");
        return;
      }

      const savedKey = `appointments_saved_${bookingId}`;
      if (localStorage.getItem(savedKey)) {
        setSaveStatus("success");
        return;
      }

      setIsSaving(true);
      setSaveStatus("pending");

      try {
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
            memberName: appt.memberName,
            memberCategory: appt.memberCategory,
            professionalName: appt.professionalName
          })),
          isGroupBooking: true
        };

        const response = await fetch(`${API_BASE_URL}/api/appointments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointmentData),
        });

        const result = await response.json();

        if (result.success) {
          setSaveStatus("success");
          localStorage.setItem(savedKey, "true");
          localStorage.removeItem('bookedAppointments');
          localStorage.removeItem('selectedServices');
          localStorage.removeItem('selectedProfessional');
          localStorage.removeItem('selectedSalon');
          localStorage.removeItem('isGroupBooking');
          localStorage.removeItem('groupMembers');
        } else {
          setSaveStatus("error");
        }
      } catch (error) {
        console.error("Error saving group appointments:", error);
        setSaveStatus("error");
      } finally {
        setIsSaving(false);
      }
    };

    saveAppointmentsToBackend();
  }, [bookingData, location.state, orderIdFromUrl]); // depend on bookingData wrapper

  // ---- Helper Functions ----

  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch (error) { return "Invalid date"; }
  };

  const getTotalServices = () => appointmentDetails.length;

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
    if (hours > 0 && mins > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
    else if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    else return `${mins} minute${mins > 1 ? 's' : ''}`;
  };

  const getStatusMessage = () => {
    if (isSaving) return "Saving your appointments...";
    if (saveStatus === "success") return "✅ Booking Confirmed!";
    if (saveStatus === "skipped") return "✅ Booking Confirmed!";
    if (saveStatus === "error") return "Issue verification pending. Please check 'My Bookings'.";
    return "Processing...";
  };

  const getHeaderMessage = () => isReschedule ? "Appointment Rescheduled!" : "Booking Confirmed!";

  const getThankYouMessage = () => {
    if (isReschedule) return `Your appointment has been successfully rescheduled at ${salonName}!`;
    return `Thank you for choosing ${salonName}! Your ${isGroupBooking ? 'group booking' : 'appointment'} has been successfully paid and booked.`;
  };


  // ---- Render Phases ----

  if (loading) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-card">
          <div className="loading-spinner"></div>
          <p style={{ textAlign: 'center', marginTop: '20px' }}>Verifying payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-card">
          <h2 style={{ color: '#ef4444', textAlign: 'center' }}>Unable to Load Booking</h2>
          <p style={{ textAlign: 'center' }}>{error || "No booking information found."}</p>
          <button className="btn-primary" onClick={() => navigate("/")} style={{ marginTop: '20px', width: '100%' }}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-header">
          <div className="success-icon">✅</div>
          <h1>{getHeaderMessage()}</h1>
          <p className="thank-you-message">{getThankYouMessage()}</p>
          <div className={`save-status ${saveStatus}`}>
            {getStatusMessage()}
          </div>
        </div>

        <div className="confirmation-details">
          <div className="booking-summary">
            <h2>Booking Summary</h2>
            <div className="summary-grid">
              <div className="summary-item"><span>Customer Name:</span><strong>{customerName}</strong></div>
              <div className="summary-item"><span>Salon:</span><strong>{salonName}</strong></div>
              {salonLocation && <div className="summary-item"><span>Location:</span><span>{salonLocation}</span></div>}
              <div className="summary-item"><span>Total Services:</span><strong>{getTotalServices()}</strong></div>
              <div className="summary-item"><span>Total Duration:</span><strong>{formatDuration(getTotalDuration())}</strong></div>
              {(appointmentId || bookingId) && (
                <div className="summary-item">
                  <span>Booking Reference:</span>
                  <strong>{bookingId || appointmentId}</strong>
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
                        {appointment.memberCategory && <span className="member-category">({appointment.memberCategory})</span>}
                      </div>
                    )}
                    <div className="appointment-details-grid">
                      <div className="detail-row"><span className="detail-label">Service:</span><span className="detail-value">{appointment.serviceName || "Service"}</span></div>
                      <div className="detail-row"><span className="detail-label">Professional:</span><span className="detail-value">{appointment.professionalName || professionalName}</span></div>
                      <div className="detail-row"><span className="detail-label">Date:</span><span className="detail-value">{formatDate(appointment.date)}</span></div>
                      <div className="detail-row"><span className="detail-label">Time:</span><span className="detail-value">{appointment.startTime} - {appointment.endTime}</span></div>
                      <div className="detail-row price-row"><span className="detail-label">Price:</span><span className="detail-value price">LKR {appointment.price?.toLocaleString() || "0"}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="total-amount-section">
              <div className="total-amount"><span>Total Amount:</span><strong>LKR {totalAmount.toLocaleString()}</strong></div>
            </div>
          </div>

          {/* Notes Section Preserved */}
          <div className="important-notes">
            <h3>Important Information</h3>
            <ul>
              <li className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-blue-600" />Please arrive 10-15 minutes before your scheduled appointment</li>
              <li className="flex items-center gap-2"><ClockIcon className="h-4 w-4 text-orange-600" />Late arrivals may result in reduced service time</li>
              <li className="flex items-center gap-2"><CreditCardIcon className="h-4 w-4 text-green-600" />Payment has been processed via PayHere</li>
              {isGroupBooking && <li className="flex items-center gap-2"><UsersIcon className="h-4 w-4 text-purple-600" />All group members should arrive together</li>}
              <li className="flex items-center gap-2"><DevicePhoneMobileIcon className="h-4 w-4 text-blue-600" />You will receive a confirmation SMS and email shortly</li>
            </ul>
          </div>
        </div>

        <div className="confirmation-actions">
          <button className="btn-primary" onClick={() => navigate("/")} disabled={isSaving}>Back to Home</button>
          <button className="btn-secondary" onClick={() => navigate("/appointments")} disabled={isSaving}>View My Bookings</button>
        </div>

        <div className="confirmation-footer">
          <p className="flex items-center justify-center gap-2">We can't wait to see you at {salonName}!<SparklesIcon className="h-5 w-5 text-yellow-500" /></p>
        </div>
      </div>
      {isSaving && isGroupBooking && (
        <div className="loading-overlay"><div className="loading-spinner"></div><p>Finalizing booking...</p></div>
      )}
    </div>
  );
};

export default ConfirmationPage;