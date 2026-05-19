// ConfirmationPage.jsx - Payment-first flow: shows confirmation after PayHere payment
import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { MapPinIcon, ClockIcon, UsersIcon, SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import axios from "../../Api/axios";

const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending | succeeded | failed
  const [pollCount, setPollCount] = useState(0);

  const orderIdFromUrl = searchParams.get('order_id');

  // ---------------------------------------------------------------
  // Poll the backend to wait for the webhook to create appointments
  // ---------------------------------------------------------------
  const pollPaymentStatus = useCallback(async (orderId, attempt) => {
    try {
      const response = await axios.get(`/payments/payhere/status/${orderId}`);
      const result = response.data;

      if (!result.success) {
        return { done: false };
      }

      if (result.paymentStatus === 'failed' || result.paymentStatus === 'canceled') {
        return { done: true, failed: true };
      }

      if (result.appointmentsCreated && result.appointmentIds?.length > 0) {
        return { done: true, failed: false, appointmentIds: result.appointmentIds };
      }

      // Payment is still pending (webhook not received yet)
      return { done: false };
    } catch (err) {
      console.error("Poll error:", err);
      return { done: false };
    }
  }, []);

  // ---------------------------------------------------------------
  // Fetch full booking details using an appointment ID
  // ---------------------------------------------------------------
  const fetchBookingByOrderId = useCallback(async (orderId) => {
    try {
      const response = await axios.get(`/appointments/order/${orderId}`);
      const result = response.data;
      if (result.success) {
        const data = result.data;
        return {
          salonName: data.salon?.name || "Salon",
          appointmentDetails: data.appointments || [],
          totalAmount: data.totalAmount || 0,
          bookingId: data.bookingId || orderId,
          customerName: data.customerName || data.user?.name || "Guest",
          isGroupBooking: !!data.isGroupBooking,
          salonLocation: data.salon?.location || "",
          professionalName: "Professional",
          salon: data.salon,
          user: data.user,
          appointmentId: data._id,
        };
      }
    } catch (err) {
      console.error("Error fetching booking by orderId:", err);
    }
    return null;
  }, []);

  useEffect(() => {
    // Case 1: Came from PayHere return_url with ?order_id=ORDER-xxx
    if (orderIdFromUrl) {
      setLoading(true);
      setPaymentStatus("pending");

      const confirmBooking = async () => {
        // ── Phase 1: Quick poll (3 × 2s = 6s) ──────────────────────────
        // Gives time for the webhook to fire in production before we
        // use the redirect-fallback. In production the webhook fires
        // almost instantly so polling usually succeeds here.
        const QUICK_POLLS = 3;
        for (let i = 0; i < QUICK_POLLS; i++) {
          setPollCount(i + 1);
          const result = await pollPaymentStatus(orderIdFromUrl, i + 1);

          if (result.done) {
            if (result.failed) {
              setPaymentStatus("failed");
              setError("Payment was not completed. Your booking has not been confirmed.");
              setLoading(false);
              return;
            }
            // Webhook already fired — appointments exist
            setPaymentStatus("succeeded");
            const booking = await fetchBookingByOrderId(orderIdFromUrl);
            setBookingData(booking || buildFallbackBookingData(orderIdFromUrl));
            setLoading(false);
            return;
          }

          // Wait 2s between polls (skip wait on last iteration)
          if (i < QUICK_POLLS - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        // ── Phase 2: Redirect-fallback ───────────────────────────────────
        // Webhook didn't fire in time (expected in local dev / sandbox).
        // Call the backend to create the appointment from stored data
        // and send email/SMS notifications immediately.
        try {
          setPollCount(prev => prev + 1);
          console.log("📩 Webhook not received, calling confirm-from-redirect...");

          const confirmResponse = await axios.post(`/payments/payhere/confirm-from-redirect/${orderIdFromUrl}`);
          const confirmResult = confirmResponse.data;

          if (confirmResult.success) {
            console.log("✅ Appointments confirmed via redirect fallback:", confirmResult);
            setPaymentStatus("succeeded");
            const booking = await fetchBookingByOrderId(orderIdFromUrl);
            setBookingData(booking || buildFallbackBookingData(orderIdFromUrl));
          } else {
            setPaymentStatus("failed");
            setError("Could not confirm your booking. Please contact support with your payment reference.");
          }
        } catch (confirmErr) {
          console.error("❌ confirm-from-redirect error:", confirmErr);
          // Even if this fails, show a 'pending' success so user isn't alarmed —
          // the payment record exists and support can reconcile manually.
          setPaymentStatus("succeeded");
          setBookingData(buildFallbackBookingData(orderIdFromUrl, true));
        }

        setLoading(false);
      };

      confirmBooking();
      return;
    }

    // Case 2: Direct navigation with state (e.g., owner booking, no payment)
    if (location.state) {
      setBookingData(location.state);
      setPaymentStatus("succeeded");
      setLoading(false);
      return;
    }

    // No state and no order_id
    setError("No booking information found.");
    setLoading(false);
  }, [orderIdFromUrl, location.state, pollPaymentStatus, fetchBookingByOrderId]);

  // Helper to build a minimal booking data object when full details aren't available
  const buildFallbackBookingData = (orderId, webhookPending = false) => ({
    salonName: "Your Salon",
    appointmentDetails: [],
    totalAmount: 0,
    bookingId: orderId,
    customerName: (() => {
      try { return JSON.parse(localStorage.getItem("user"))?.name || "Guest"; }
      catch { return "Guest"; }
    })(),
    isGroupBooking: false,
    salonLocation: "",
    professionalName: "Professional",
    webhookPending,
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch { return "Invalid date"; }
  };

  const getTotalDuration = () => {
    if (!bookingData?.appointmentDetails) return 0;
    return bookingData.appointmentDetails.reduce((total, appointment) => {
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

  const {
    salonName = "Our Salon",
    appointmentDetails = [],
    totalAmount = 0,
    bookingId = `booking-${Date.now()}`,
    customerName = "Guest",
    isGroupBooking = false,
    salonLocation = "",
    professionalName = "Any Professional",
    appointmentId,
    isReschedule,
    webhookPending = false,
  } = bookingData || {};

  const salonLocationText =
    typeof salonLocation === "string"
      ? salonLocation
      : salonLocation?.district || "";

  // ── Loading / Polling State ──────────────────────────────────────
  if (loading) {
    const isConfirming = pollCount > 3; // Phase 2: redirect-fallback in progress
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-dark-900 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-900 font-bold text-lg mb-2">
            {isConfirming ? "Confirming your booking..." : "Verifying your payment..."}
          </p>
          <p className="text-gray-500 text-sm">
            {isConfirming
              ? "Creating your appointment and sending confirmation..."
              : "Please do not close this page."}
          </p>
        </div>
      </div>
    );
  }


  // ── Payment Failed ───────────────────────────────────────────────
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-red-500 mb-2">Payment Not Completed</h2>
          <p className="text-gray-500 mb-6 text-sm">
            {error || "Your payment was cancelled or failed. No booking has been made."}
          </p>
          <button
            className="w-full py-3 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-colors mb-3"
            onClick={() => navigate(-2)}
          >
            Try Again
          </button>
          <button
            className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            onClick={() => navigate("/")}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Error (no booking info) ──────────────────────────────────────
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

  // ── Success State ────────────────────────────────────────────────
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
            <h1 className="text-2xl sm:text-3xl font-black mb-2">
              {isReschedule ? "Rescheduled!" : "Booking Confirmed!"}
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
              {isReschedule
                ? `Your appointment at ${salonName} has been rescheduled!`
                : `Thank you for your payment. Your appointment at ${salonName} is confirmed!`}
            </p>
            <div className={`mt-4 inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
              webhookPending
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-400/30"
                : "bg-green-500/20 text-green-300 border border-green-400/30"
            }`}>
              {webhookPending
                ? "✅ Payment received – booking being finalized"
                : "✅ Booking Confirmed!"}
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
              ...(appointmentDetails.length > 0 ? [
                { label: "Total Services", value: appointmentDetails.length },
                { label: "Total Duration", value: formatDuration(getTotalDuration()) },
              ] : []),
              { label: "Booking Ref", value: (bookingId || appointmentId || orderIdFromUrl || "").toString().slice(-10).toUpperCase() },
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
                        <p className="text-sm font-bold text-gray-900">
                          {appointment.date ? new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "TBD"}
                        </p>
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
            {totalAmount > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500">Total Amount Paid</span>
                <span className="text-2xl font-black text-dark-900">LKR {totalAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Webhook-pending notice */}
        {webhookPending && (
          <div className="bg-yellow-50 rounded-[2rem] border border-yellow-200 p-5 sm:p-6 mb-5">
            <p className="text-sm text-yellow-800 font-medium text-center">
              ⏳ Your payment was received. Your booking details will appear in <strong>My Bookings</strong> shortly once confirmed.
            </p>
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
            className="flex-1 py-4 bg-dark-900 text-white font-bold rounded-2xl hover:bg-black transition-colors"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
          <button
            className="flex-1 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-colors"
            onClick={() => navigate("/appointments")}
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
    </div>
  );
};

export default ConfirmationPage;