// ConfirmationPage.jsx - Responsive Tailwind Version
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { MapPinIcon, ClockIcon, UsersIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [bookingData, setBookingData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("pending");

  const orderIdFromUrl = searchParams.get('order_id');

  useEffect(() => {
    if (bookingData) { setLoading(false); return; }
    if (!orderIdFromUrl) { setLoading(false); return; }

    const fetchBookingDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/appointments/order/${orderIdFromUrl}`);
        const result = await response.json();
        if (result.success) {
          const data = result.data;
          setBookingData({
            salonName: data.salon?.name || "Salon",
            appointmentDetails: data.appointments || [],
            totalAmount: data.totalAmount || 0,
            bookingId: data.bookingId || orderIdFromUrl,
            customerName: data.customerName || data.user?.name || "Guest",
            isGroupBooking: !!data.isGroupBooking,
            salonLocation: data.salon?.location || "",
            professionalName: "Professional",
            salon: data.salon,
            user: data.user,
            appointmentId: data._id,
            isReschedule: data.isReschedule
          });
          setSaveStatus("success");
        } else {
          setError("Could not retrieve booking details.");
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

  useEffect(() => {
    if (!location.state || orderIdFromUrl) return;

    const saveAppointmentsToBackend = async () => {
      if (!isGroupBooking) {
        setSaveStatus("skipped");
        localStorage.removeItem('selectedServices');
        localStorage.removeItem('selectedProfessional');
        localStorage.removeItem('selectedSalon');
        localStorage.removeItem('bookedAppointments');
        return;
      }

      if (appointmentDetails.length === 0) { setSaveStatus("error"); return; }

      const savedKey = `appointments_saved_${bookingId}`;
      if (localStorage.getItem(savedKey)) { setSaveStatus("success"); return; }

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
          ['bookedAppointments', 'selectedServices', 'selectedProfessional',
            'selectedSalon', 'isGroupBooking', 'groupMembers'].forEach(k => localStorage.removeItem(k));
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
  }, [bookingData, location.state, orderIdFromUrl]);

  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch { return "Invalid date"; }
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
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${mins} min`;
  };

  const getStatusMessage = () => {
    if (isSaving) return "Saving your appointments...";
    if (saveStatus === "success" || saveStatus === "skipped") return "✅ Booking Confirmed!";
    if (saveStatus === "error") return "Verification pending. Check 'My Bookings'.";
    return "Processing...";
  };

  const getHeaderMessage = () => isReschedule ? "Rescheduled!" : "Booking Confirmed!";
  const getThankYouMessage = () =>
    isReschedule
      ? `Your appointment at ${salonName} has been rescheduled!`
      : `Thank you for choosing ${salonName}!`;

  const salonLocationText =
    typeof salonLocation === "string"
      ? salonLocation
      : salonLocation?.district || "";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-dark-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verifying payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
          <h2 className="text-xl font-black text-red-500 mb-2">Unable to Load Booking</h2>
          <p className="text-gray-500 mb-6 text-sm">{error || "No booking information found."}</p>
          <button
            className="w-full py-3 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
            onClick={() => navigate("/")}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 font-sans">
      <div className="max-w-2xl mx-auto">

        {/* Success Header Card */}
        <div className="bg-dark-900 rounded-[2rem] p-6 sm:p-8 text-white text-center mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-2">{getHeaderMessage()}</h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
              {getThankYouMessage()}
            </p>
            <div className={`mt-4 inline-block px-4 py-1.5 rounded-full text-xs font-bold ${saveStatus === "success" || saveStatus === "skipped"
                ? "bg-green-500/20 text-green-300 border border-green-400/30"
                : saveStatus === "error"
                  ? "bg-red-500/20 text-red-300 border border-red-400/30"
                  : "bg-white/20 text-gray-300"
              }`}>
              {getStatusMessage()}
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-5 sm:p-6 mb-5">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">
            Booking Summary
          </h2>

          <div className="space-y-3 mb-5">
            {[
              { label: "Customer", value: customerName },
              { label: "Salon", value: salonName },
              ...(salonLocationText ? [{ label: "Location", value: salonLocationText }] : []),
              { label: "Total Services", value: appointmentDetails.length },
              { label: "Total Duration", value: formatDuration(getTotalDuration()) },
              ...(appointmentId || bookingId ? [{ label: "Booking Ref", value: (bookingId || appointmentId).toString().slice(-8).toUpperCase() }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4 py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium text-gray-500">{label}</span>
                <span className="text-sm font-bold text-gray-900 text-right max-w-[60%] break-words">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment Details */}
        {appointmentDetails.length > 0 && (
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-5 sm:p-6 mb-5">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">
              {isGroupBooking ? "Group Appointments" : "Appointment Details"}
            </h2>

            <div className="space-y-4">
              {appointmentDetails.map((appointment, index) => (
                <div key={index} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-dark-900 rounded-l-2xl" />
                  <div className="pl-3">
                    {isGroupBooking && (
                      <div className="flex items-center gap-2 mb-2">
                        <UsersIcon className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="font-bold text-sm text-gray-900">{appointment.memberName || customerName}</span>
                        {appointment.memberCategory && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{appointment.memberCategory}</span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Service</p>
                        <p className="text-sm font-bold text-gray-900">{appointment.serviceName || "Service"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Professional</p>
                        <p className="text-sm font-bold text-gray-900">{appointment.professionalName || professionalName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Date</p>
                        <p className="text-sm font-bold text-gray-900">{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Time</p>
                        <p className="text-sm font-bold text-gray-900">{appointment.startTime} – {appointment.endTime}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Price</span>
                      <span className="text-base font-black text-dark-900">LKR {appointment.price?.toLocaleString() || "0"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500">Total Amount</span>
              <span className="text-2xl font-black text-dark-900">LKR {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Important Notes */}
        <div className="bg-amber-50 rounded-[2rem] border border-amber-200 p-5 sm:p-6 mb-5">
          <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-4">
            Important Information
          </h3>
          <ul className="space-y-2.5">
            {[
              { icon: <MapPinIcon className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />, text: "Please arrive 10–15 minutes before your scheduled time" },
              { icon: <ClockIcon className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />, text: "Late arrivals may result in reduced service time" },
              ...(isGroupBooking ? [{ icon: <UsersIcon className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />, text: "All group members should arrive together" }] : []),
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-amber-800 leading-relaxed">
                {icon}
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            className="flex-1 py-4 bg-dark-900 text-white font-bold rounded-2xl hover:bg-black transition-colors disabled:opacity-60"
            onClick={() => navigate("/")}
            disabled={isSaving}
          >
            Back to Home
          </button>
          <button
            className="flex-1 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
            onClick={() => navigate("/appointments")}
            disabled={isSaving}
          >
            View My Bookings
          </button>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            We can't wait to see you at {salonName}!
            <SparklesIcon className="h-4 w-4 text-yellow-500" />
          </p>
        </div>

      </div>

      {isSaving && isGroupBooking && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-dark-900 rounded-full animate-spin mb-4" />
          <p className="text-gray-900 font-bold">Finalizing booking...</p>
        </div>
      )}
    </div>
  );
};

export default ConfirmationPage;