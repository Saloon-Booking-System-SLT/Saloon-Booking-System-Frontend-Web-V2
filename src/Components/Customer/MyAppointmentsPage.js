import React, { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from '@headlessui/react';
import {
  CalendarDaysIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  ClockIcon,
  MapPinIcon,
  ScissorsIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import Footer from '../Shared/Footer';

const API_BASE_URL = process.env.REACT_APP_API_URL ?
  process.env.REACT_APP_API_URL.replace(/\/api$/, '') :
  "";

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

      const timeDifference = appointmentDateTime.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);

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
    const confirm = window.confirm("Are you sure you want to cancel this appointment?");
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

  // Handle reschedule
  const handleReschedule = (appointment) => {
    if (isWithin24Hours(appointment.date, appointment.startTime)) {
      alert("❌ You cannot reschedule an appointment that is within 24 hours. Please contact customer support.");
      return;
    }

    if (isPastAppointment(appointment.date, appointment.startTime)) {
      alert("❌ You cannot reschedule a past appointment.");
      return;
    }

    const rescheduleData = {
      rescheduleAppointment: {
        _id: appointment._id,
        status: appointment.status,
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

    navigate("/select-time", { state: rescheduleData });
  };

  // View Helpers
  const getRescheduleButtonInfo = (appointment) => {
    if (isPastAppointment(appointment.date, appointment.startTime)) {
      return { text: "Reschedule", disabled: true, title: "Cannot reschedule past appointments" };
    }
    if (isWithin24Hours(appointment.date, appointment.startTime)) {
      return { text: "Reschedule", disabled: true, title: "Cannot reschedule within 24 hours of appointment" };
    }
    if (appointment.status?.toLowerCase() === "completed") {
      return { text: "Reschedule", disabled: true, title: "Cannot reschedule completed appointments" };
    }
    return { text: "Reschedule", disabled: false, title: "Click to reschedule this appointment" };
  };

  const isCancelDisabled = (appointment) => {
    return (
      isWithin24Hours(appointment.date, appointment.startTime) ||
      isPastAppointment(appointment.date, appointment.startTime) ||
      appointment.status?.toLowerCase() === "completed"
    );
  };

  const getCancelButtonText = (appointment) => {
    return "Cancel";
  };

  const openFeedbackPopup = (appointment) => {
    if (appointment.status?.toLowerCase() !== "completed") {
      alert("You can only add a review after the appointment is completed.");
      return;
    }
    setSelectedAppointment(appointment);
    setShowPopup(true);
  };

  const submitFeedback = async () => {
    if (!rating) {
      alert("Please provide a rating");
      return;
    }

    try {
      const customerName = selectedAppointment.user?.name || user?.name || user?.username || selectedAppointment.name || 'Anonymous';
      const feedbackData = {
        appointmentId: selectedAppointment._id,
        salonId: selectedAppointment.salonId._id,
        professionalId: selectedAppointment.professionalId?._id || selectedAppointment.professionalId,
        userEmail: user?.email || selectedAppointment.user?.email || '',
        customerName,
        rating,
        comment: feedbackText,
      };

      const res = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      });

      const responseText = await res.text();
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
        state: { salon: selectedAppointment.salonId, selectedServices: selectedAppointment.services },
      });
    } catch (err) {
      alert(`Error occurred while submitting feedback: ${err.message}`);
    }
  };

  const isReviewDisabled = (appointment) => {
    return appointment.status?.toLowerCase() !== "completed";
  };

  const getReviewButtonText = (appointment) => {
    if (appointment.status?.toLowerCase() !== "completed") return "Review";
    return "Add Review";
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">

      {/* Sidebar matching searchsalon.js */}
      <aside className="w-full md:w-72 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col z-20 sticky top-0 md:h-screen">
        <div className="p-8 border-b border-gray-100">
          <div
            className="text-3xl font-black text-dark-900 tracking-tighter cursor-pointer select-none"
            onClick={() => navigate("/", { replace: true })}
          >

          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 flex items-center justify-center font-bold text-gray-600 shadow-inner">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 leading-tight block">{user?.name || "User"}</span>
              <span className="text-xs text-gray-500">{user?.email || "Customer"}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          <button
            onClick={() => navigate("/profile", { replace: true })}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors font-semibold"
          >
            <UserCircleIcon className="w-5 h-5" />
            Profile
          </button>

          <button
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-dark-900 text-white font-bold shadow-md shadow-dark-900/10"
          >
            <CalendarDaysIcon className="w-5 h-5" />
            Appointments
          </button>
        </div>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/login", { replace: true });
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-bold"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-8 lg:p-12 relative">
        <div className="max-w-5xl mx-auto space-y-8 fade-in slide-up">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">My Appointments</h1>
              <p className="mt-2 text-gray-500 font-medium">Manage your upcoming and past salon visits.</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 sm:p-5 flex gap-3 text-sm">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="font-medium text-yellow-800">
              <strong className="block text-yellow-900 mb-1">Important Notice</strong>
              Appointments cannot be rescheduled or cancelled within 24 hours of their scheduled time.
            </div>
          </div>

          <div className="space-y-6">
            {appointments.length === 0 ? (
              <div className="text-center py-24 bg-white border border-gray-200 border-dashed rounded-[2rem]">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CalendarDaysIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No appointments yet</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">You haven't booked any salon appointments. Start exploring salons to book your first service!</p>
                <button
                  onClick={() => navigate("/", { replace: true })}
                  className="px-8 py-3.5 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                >
                  Explore Salons
                </button>
              </div>
            ) : (
              appointments.map((a) => {
                const rescheduleInfo = getRescheduleButtonInfo(a);
                const cancelDisabled = isCancelDisabled(a);
                const cancelText = getCancelButtonText(a);
                const statusStr = a.status?.toLowerCase() || 'pending';
                const statusClass = statusColors[statusStr] || statusColors.pending;

                return (
                  <div key={a._id} className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group hover:border-gray-200 transition-colors">

                    {/* Status Badge */}
                    <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${statusClass}`}>
                      {statusStr}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                      {/* Left: Salon Info */}
                      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-8 flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                          <img
                            src={
                              a.salonId?.image
                                ? a.salonId.image.startsWith("http")
                                  ? a.salonId.image
                                  : `${API_BASE_URL}/uploads/${a.salonId.image}`
                                : "https://ui-avatars.com/api/?name=Salon&background=random&size=100&color=fff"
                            }
                            alt={a.salonId?.name || "Salon"}
                            className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shadow-sm"
                          />
                          <div className="min-w-0 pr-16"> {/* pr-16 for status pill space */}
                            <h4 className="text-lg font-black text-gray-900 line-clamp-1">{a.salonId?.name}</h4>
                            <p className="text-sm text-gray-500 font-medium line-clamp-1 flex items-center gap-1 mt-0.5">
                              <MapPinIcon className="w-4 h-4 shrink-0" />
                              {a.salonId?.location || 'Location not available'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 mt-auto space-y-3 border border-gray-100/50">
                          <div className="flex items-center gap-3 text-sm font-bold text-gray-900">
                            <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                            {new Date(a.date).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                          </div>
                          <div className="flex items-center gap-3 text-sm font-bold text-gray-900">
                            <ClockIcon className="w-5 h-5 text-gray-400" />
                            {a.startTime && a.endTime ? `${a.startTime} - ${a.endTime}` : "Time pending"}
                          </div>
                        </div>
                      </div>

                      {/* Right: Services & Actions */}
                      <div className="w-full md:w-2/3 flex flex-col">
                        <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Booked Services</h5>

                        <div className="space-y-3 mb-6 flex-1">
                          {a.services.map((s, i) => (
                            <div key={i} className="flex justify-between items-start bg-gray-50 p-3.5 rounded-xl border border-gray-100/60">
                              <div className="flex gap-3">
                                <ScissorsIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                <span className="text-sm font-bold text-gray-900">{s.name}</span>
                              </div>
                              <span className="text-sm font-black text-dark-900 shrink-0">LKR {s.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-100">
                          <div className="flex items-center gap-3 w-full sm:w-auto text-center sm:text-left">
                            <div className="text-sm font-bold text-gray-500">Total</div>
                            <div className="text-2xl font-black text-dark-900">
                              LKR {a.services.reduce((total, s) => total + s.price, 0).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                            {/* Reschedule */}
                            <button
                              disabled={rescheduleInfo.disabled}
                              title={rescheduleInfo.title}
                              onClick={() => handleReschedule(a)}
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${rescheduleInfo.disabled
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                : "bg-white text-dark-900 border border-gray-200 hover:border-dark-900 hover:bg-gray-50 shadow-sm"
                                }`}
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                              {rescheduleInfo.text}
                            </button>

                            {/* Cancel */}
                            {a.status?.toLowerCase() !== "completed" && (
                              <button
                                disabled={cancelDisabled}
                                title={cancelDisabled ? "Cannot cancel this appointment" : "Click to cancel this appointment"}
                                onClick={() => !cancelDisabled && handleCancel(a._id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${cancelDisabled
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                  : "bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white"
                                  }`}
                              >
                                <XCircleIcon className="w-4 h-4" />
                                {cancelText}
                              </button>
                            )}

                            {/* Review */}
                            <button
                              disabled={isReviewDisabled(a)}
                              title={a.status?.toLowerCase() !== "completed" ? "Review available after appointment is completed" : "Click to add review"}
                              onClick={() => openFeedbackPopup(a)}
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${isReviewDisabled(a)
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 hidden sm:flex" // hide on mobile if disabled
                                : "bg-dark-900 text-white shadow-xl shadow-dark-900/20 hover:bg-black"
                                }`}
                            >
                              <CheckBadgeIcon className="w-4 h-4" />
                              {getReviewButtonText(a)}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Review Feedback Modal */}
      <Transition appear show={showPopup} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowPopup(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[2rem] bg-white p-8 text-left align-middle shadow-2xl transition-all border border-gray-100">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-black text-gray-900 tracking-tight text-center mb-2"
                  >
                    Rate Your Experience
                  </Dialog.Title>
                  <div className="text-center text-sm font-medium text-gray-500 mb-8">
                    at <strong className="text-gray-900">{selectedAppointment?.salonId?.name}</strong>
                  </div>

                  <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        {star <= rating ? (
                          <StarIconSolid className="w-10 h-10 text-yellow-400 drop-shadow-sm" />
                        ) : (
                          <StarIconOutline className="w-10 h-10 text-gray-300" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mb-8">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                      Leave a comment (Optional)
                    </label>
                    <textarea
                      placeholder="Share details of your experience..."
                      rows={4}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-dark-900 focus:border-transparent outline-none transition-all placeholder-gray-400 font-medium text-gray-900 resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      className="w-full py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                      onClick={() => setShowPopup(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="w-full py-3.5 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-dark-900/20"
                      onClick={submitFeedback}
                    >
                      Submit Review
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Footer />
    </div>
  );
};

export default MyAppointmentsPage;