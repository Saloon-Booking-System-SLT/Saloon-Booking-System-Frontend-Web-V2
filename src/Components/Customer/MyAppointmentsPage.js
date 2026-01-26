import React, { useEffect, useState } from "react";
import "./MyAppointmentsPage.css";
import { useNavigate } from "react-router-dom";
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL ? 
  process.env.REACT_APP_API_URL.replace('/api', '') : 
  'https://saloon-booking-system-backend-v2.onrender.com';

const MyAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  // Function to check if appointment is within 24 hours
  const isWithin24Hours = (appointmentDate, appointmentStartTime) => {
    if (!appointmentDate || !appointmentStartTime) return false;
    
    try {
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentStartTime}:00`);
      const now = new Date();
      
      // Calculate difference in milliseconds
      const timeDifference = appointmentDateTime.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      
      console.log("⏰ Time check for MyAppointments:", {
        appointmentDateTime,
        now,
        hoursDifference,
        isWithin24Hours: hoursDifference <= 24 && hoursDifference > 0
      });
      
      // Return true if appointment is within next 24 hours (and not in the past)
      return hoursDifference <= 24 && hoursDifference > 0;
    } catch (error) {
      console.error("Error checking time:", error);
      return false;
    }
  };

  // Function to check if appointment is in the past
  const isPastAppointment = (appointmentDate, appointmentStartTime) => {
    if (!appointmentDate || !appointmentStartTime) return false;
    
    try {
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentStartTime}:00`);
      const now = new Date();
      
      return appointmentDateTime < now;
    } catch (error) {
      console.error("Error checking if appointment is past:", error);
      return false;
    }
  };

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        let queryParams = [];
        
        if (user?.email) {
          queryParams.push(`email=${user.email}`);
        }
        if (user?.phone) {
          queryParams.push(`phone=${user.phone}`);
        }
        
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        
        const res = await fetch(
          `${API_BASE_URL}/api/appointments${queryString}`
        );
        const data = await res.json();
        
        // Filter out cancelled appointments and ensure we have valid data
        const activeAppointments = data.filter(a => 
          a && a.status !== "cancelled" && a.status !== "deleted"
        );
        
        console.log("📋 Fetched appointments:", activeAppointments);
        setAppointments(activeAppointments);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      }
    };

    if (user?.email || user?.phone) {
      fetchAppointments();
    }
  }, [user]);

  // Cancel appointment
  const handleCancel = async (id) => {
    const confirm = window.confirm("Are you sure you want to cancel?");
    if (!confirm) return;

    try {
      await fetch(`${API_BASE_URL}/api/appointments/${id}`, {
        method: "DELETE",
      });
      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert("Cancel failed");
    }
  };

  // Handle reschedule - pass the complete appointment with all necessary data
  const handleReschedule = (appointment) => {
    console.log("🔄 Starting reschedule for appointment:", appointment);
    
    // Check if appointment is within 24 hours
    if (isWithin24Hours(appointment.date, appointment.startTime)) {
      alert("❌ You cannot reschedule an appointment that is within 24 hours. Please contact customer support.");
      return;
    }
    
    // Check if appointment is in the past
    if (isPastAppointment(appointment.date, appointment.startTime)) {
      alert("❌ You cannot reschedule a past appointment.");
      return;
    }
    
    const rescheduleData = {
      rescheduleAppointment: {
        _id: appointment._id,
        status: appointment.status, // ✅ Pass current status
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        professionalId: appointment.professionalId?._id || appointment.professionalId,
        salonId: appointment.salonId?._id || appointment.salonId,
        services: appointment.services
      },
      selectedServices: appointment.services.map(service => ({
        name: service.name,
        price: service.price,
        duration: service.duration
      })),
      selectedProfessional: appointment.professionalId?._id || appointment.professionalId,
      salon: appointment.salonId,
      isReschedule: true
    };

    console.log("📦 Reschedule data being sent:", rescheduleData);
    navigate("/select-time", { state: rescheduleData });
  };

  // Get reschedule button text and status
  const getRescheduleButtonInfo = (appointment) => {
    if (isPastAppointment(appointment.date, appointment.startTime)) {
      return {
        text: "🔁 Reschedule ",
        disabled: true,
        title: "Cannot reschedule past appointments"
      };
    }
    
    if (isWithin24Hours(appointment.date, appointment.startTime)) {
      return {
        text: "🔁 Reschedule ",
        disabled: true,
        title: "Cannot reschedule within 24 hours of appointment"
      };
    }
    
    if (appointment.status?.toLowerCase() === "completed") {
      return {
        text: "🔁 Reschedule ",
        disabled: true,
        title: "Cannot reschedule completed appointments"
      };
    }
    
    return {
      text: "🔁 Reschedule",
      disabled: false,
      title: "Click to reschedule this appointment"
    };
  };

  // Get cancel button status
  const isCancelDisabled = (appointment) => {
    return (
      isWithin24Hours(appointment.date, appointment.startTime) ||
      isPastAppointment(appointment.date, appointment.startTime) ||
      appointment.status?.toLowerCase() === "completed"
    );
  };

  // Get cancel button text
  const getCancelButtonText = (appointment) => {
    if (isPastAppointment(appointment.date, appointment.startTime)) {
      return "❌ Cancel ";
    }
    
    if (isWithin24Hours(appointment.date, appointment.startTime)) {
      return "❌ Cancel ";
    }
    
    if (appointment.status?.toLowerCase() === "completed") {
      return "❌ Cancel ";
    }
    
    return "❌ Cancel";
  };

  // Open popup - only if appointment is completed
  const openFeedbackPopup = (appointment) => {
    if (appointment.status?.toLowerCase() !== "completed") {
      alert("You can only add a review after the appointment is completed.");
      return;
    }
    
    setSelectedAppointment(appointment);
    setShowPopup(true);
  };

  // Submit feedback - DEBUG VERSION
  const submitFeedback = async () => {
    if (!rating) {
      alert("Please provide a rating");
      return;
    }

    try {
      // Combine logic: get customer name from appointment or user
      const customerName = selectedAppointment.user?.name || user?.name || user?.username || selectedAppointment.name || 'Anonymous';
      // Prepare feedback data
      const feedbackData = {
        appointmentId: selectedAppointment._id,
        salonId: selectedAppointment.salonId._id,
        professionalId: selectedAppointment.professionalId?._id || selectedAppointment.professionalId,
        userEmail: user?.email || selectedAppointment.user?.email || '',
        customerName,
        rating,
        comment: feedbackText,
      };
      // Debug log
      console.log("=== FEEDBACK DEBUG START ===");
      console.log("selectedAppointment:", selectedAppointment);
      console.log("feedbackData:", feedbackData);
      console.log("=== FEEDBACK DEBUG END ===");
      // Send feedback
      const res = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      });

      const responseText = await res.text();
      console.log("📥 Server response status:", res.status);
      console.log("📥 Server response text:", responseText);
      if (!res.ok) {
        try {
          const errorData = JSON.parse(responseText);
          alert(`Failed to submit feedback: ${errorData.message || "Unknown error"}`);
        } catch {
          alert(`Failed to submit feedback: ${responseText}`);
        }
        return;
      }
      setShowPopup(false);
      setFeedbackText("");
      setRating(0);
      alert("✅ Feedback submitted successfully! It will appear after admin approval.");
      navigate("/", {
        state: {
          salon: selectedAppointment.salonId,
          selectedServices: selectedAppointment.services,
        },
      });
    } catch (err) {
      console.error("❌ Error submitting feedback:", err);
      alert(`Error occurred while submitting feedback: ${err.message}`);
    }
  };

  // Check if review button should be disabled
  const isReviewDisabled = (appointment) => {
    return appointment.status?.toLowerCase() !== "completed";
  };

  // Get review button text
  const getReviewButtonText = (appointment) => {
    if (appointment.status?.toLowerCase() !== "completed") {
      return "📝 Review ";
    }
    return "📝 Add Review";
  };

  return (
    <div className="appointment-page-wrapper">
      <aside className="sidebar">
        <div className="logo" onClick={() => navigate("/", { replace: true })}>
          Salon
        </div>
        <div className="user-name">{user?.name}</div>
        <nav>
          <button
            className="nav-btn"
            onClick={() => navigate("/profile", { replace: true })}
          >
            👤 Profile
          </button>
          <button className="nav-btn active"><CalendarDaysIcon className="h-4 w-4 inline mr-1" /> Appointments</button>
          <button
            className="nav-btn logout"
            onClick={() => {
              localStorage.clear();
              navigate("/login", { replace: true });
            }}
          >
            Log out
          </button>
        </nav>
      </aside>

      <div className="appointment-content">
        <button
          className="back-btn"
          onClick={() => navigate("/", { replace: true })}
        >
          ← Back
        </button>

        <h2>My Appointments</h2>
        
        {/* Information Notice */}
        <div className="appointment-notice">
          <p><strong>⚠️ Note:</strong> Appointments cannot be rescheduled or cancelled within 24 hours of their scheduled time.</p>
          
        </div>
        
        {appointments.length === 0 ? (
          <p className="no-data">No appointments found.</p>
        ) : (
          appointments.map((a) => {
            const rescheduleInfo = getRescheduleButtonInfo(a);
            const cancelDisabled = isCancelDisabled(a);
            const cancelText = getCancelButtonText(a);
            
            return (
              <div className="appointment-card" key={a._id}>
                <div className="appointment-top">
                  <img
                    src={
                      a.salonId?.image
                        ? a.salonId.image.startsWith("http")
                          ? a.salonId.image
                          : `${API_BASE_URL}/uploads/${a.salonId.image}`
                        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100%25' height='100%25' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"
                    }
                    alt={a.salonId?.name || "Salon"}
                  />
                  <div className="salon-info">
                    <h4>{a.salonId?.name}</h4>
                    <p> {a.salonId?.location}</p>
                    <p className="appt-date">
                      {" "}
                      {new Date(a.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="appt-time">
                      {" "}
                      {a.startTime && a.endTime
                        ? `${a.startTime} - ${a.endTime}`
                        : "Time pending"}
                    </p>
                    <p className="appt-status">
                      🔖 <strong>Status:</strong>{" "}
                      <span
                        className={
                          a.status === "confirmed"
                            ? "appt-status-confirmed"
                            : a.status === "completed"
                            ? "appt-status-completed"
                            : "appt-status-pending"
                        }
                      >
                        {a.status || "Pending"}
                      </span>
                    </p>
                    
                
                  </div>
                </div>

                <div className="service-info">
                  {a.services.map((s, i) => (
                    <div key={i} className="service-row">
                      <span>🧾 {s.name}</span>
                      <span>LKR {s.price}</span>
                    </div>
                  ))}
                  <div className="total-row">
                    <strong>Total</strong>
                    <strong>
                      LKR {a.services.reduce((total, s) => total + s.price, 0)}
                    </strong>
                  </div>
                </div>

                <div className="appointment-action-buttons">
                  <button
                    className={`appointment-reschedule-btn ${rescheduleInfo.disabled ? "reschedule-btn-disabled" : ""}`}
                    onClick={() => handleReschedule(a)}
                    disabled={rescheduleInfo.disabled}
                    title={rescheduleInfo.title}
                  >
                    {rescheduleInfo.text}
                  </button>
                  <button
                    className={`appointment-add-review-btn ${
                      isReviewDisabled(a) ? "review-btn-disabled" : ""
                    }`}
                    onClick={() => openFeedbackPopup(a)}
                    disabled={isReviewDisabled(a)}
                    title={
                      a.status?.toLowerCase() !== "completed"
                        ? "Review available after appointment is completed"
                        : "Click to add review"
                    }
                  >
                    {getReviewButtonText(a)}
                  </button>
                  {a.status?.toLowerCase() !== "completed" && (
                    <button
                      className={`appointment-cancel-btn ${cancelDisabled ? "cancel-btn-disabled" : ""}`}
                      onClick={() => !cancelDisabled && handleCancel(a._id)}
                      disabled={cancelDisabled}
                      title={cancelDisabled ? "Cannot cancel this appointment" : "Click to cancel this appointment"}
                    >
                      {cancelText}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Rate {selectedAppointment?.salonId?.name}</h3>
            <textarea
              placeholder="Your feedback..."
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            ></textarea>
            <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    fontSize: 24,
                    color: star <= rating ? "#ff9800" : "#ccc",
                    cursor: "pointer",
                  }}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="popup-actions">
              <button className="btn-cancel" onClick={() => setShowPopup(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={submitFeedback}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointmentsPage;