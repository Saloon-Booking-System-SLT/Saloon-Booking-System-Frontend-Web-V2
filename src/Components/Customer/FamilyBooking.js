import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarDaysIcon, ClockIcon, UserIcon, ScissorsIcon, CheckCircleIcon, ArrowRightIcon, TrashIcon } from '@heroicons/react/24/outline';

const FamilyBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [salon, setSalon] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([{
    id: Date.now(),
    name: '',
    relationship: ''
  }]);
  const [bookedAppointments, setBookedAppointments] = useState([]);

  // Get salon data and existing appointments from location state or localStorage
  useEffect(() => {
    const salonFromState = location.state?.salon;
    const salonFromStorage = JSON.parse(localStorage.getItem('selectedSalon'));
    const bookedFromState = location.state?.bookedAppointments || [];
    const bookedFromStorage = JSON.parse(localStorage.getItem('bookedAppointments')) || [];

    if (salonFromState) {
      setSalon(salonFromState);
      localStorage.setItem('selectedSalon', JSON.stringify(salonFromState));
    } else if (salonFromStorage) {
      setSalon(salonFromStorage);
    }

    // Load booked appointments
    const existingBookings = bookedFromState.length > 0 ? bookedFromState : bookedFromStorage;
    if (existingBookings.length > 0) {
      setBookedAppointments(existingBookings);
    }
  }, [location.state]);

  const updateFamilyMember = (id, field, value) => {
    setFamilyMembers(familyMembers.map(member =>
      member.id === id ? { ...member, [field]: value } : member
    ));
  };

  const removeFamilyMember = (id) => {
    if (familyMembers.length > 1) {
      setFamilyMembers(familyMembers.filter(member => member.id !== id));
    }
  };

  // Calculate total for booked appointments only
  const calculateBookedTotal = () => {
    return bookedAppointments.reduce((total, appointment) => {
      return total + (Number(appointment.price) || 0);
    }, 0);
  };

  const handleContinue = () => {
    if (!salon) {
      alert('No salon selected. Please go back and select a salon first.');
      return;
    }

    // Validate all family members have name and relationship
    const incompleteMembers = familyMembers.filter(member =>
      !member.name.trim() || !member.relationship
    );

    if (incompleteMembers.length > 0) {
      alert('Please complete all family member details (name and relationship)');
      return;
    }

    // Prepare group members data
    const groupMembers = familyMembers.map(member => ({
      name: member.name,
      category: member.relationship
    }));

    // Store data in localStorage
    localStorage.setItem('isGroupBooking', JSON.stringify(true));
    localStorage.setItem('groupMembers', JSON.stringify(groupMembers));
    localStorage.setItem('bookedAppointments', JSON.stringify(bookedAppointments));

    // Navigate to select service page (not time page yet)
    navigate(`/familybookingselectservice/${salon._id}`, {
      state: {
        salon,
        isGroupBooking: true,
        groupMembers: groupMembers,
        bookedAppointments: bookedAppointments,
        fromFamilyBooking: true
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="text-2xl font-black text-dark-900 tracking-tighter">SalonPro</div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-500 hover:text-dark-900 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors"
          >
            Back
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 fade-in slide-up">

        <div className="text-center mb-10">
          <div className="w-16 h-1 bg-dark-900 mx-auto rounded-full mb-6"></div>
          <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Group Booking</h1>
          <p className="text-gray-500">Plan a group appointment for friends, family, or special occasions.</p>
        </div>

        {/* Show booked appointments summary if any */}
        {bookedAppointments.length > 0 && (
          <div className="bg-green-50 rounded-2xl p-6 border border-green-200 mb-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>

            <div className="flex items-center gap-2 mb-6 relative z-10">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-green-800">Booked Appointments ({bookedAppointments.length})</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6 relative z-10">
              {bookedAppointments.map((appointment, index) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-green-100 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👤</span>
                      <strong className="text-gray-900 font-bold">{appointment.memberName}</strong>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                      {appointment.memberCategory}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 flex-grow">
                    <p className="flex items-center gap-2">
                      <ScissorsIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <strong className="text-gray-900 truncate">{appointment.serviceName}</strong>
                    </p>
                    <p className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{appointment.professionalName}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      {new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      {appointment.startTime} - {appointment.endTime}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                    <p className="text-green-600 font-black text-lg">LKR {appointment.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-green-100 font-bold relative z-10">
              <span className="text-gray-600">Total Booked Amount</span>
              <span className="text-xl text-dark-900">LKR {calculateBookedTotal().toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Add New Members Section */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-10 mb-8 relative">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900">
              {bookedAppointments.length > 0 ? 'Add More Appointments' : 'Add First Appointment'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">Enter details for the member receiving the service.</p>
          </div>

          <div className="space-y-6 mb-10">
            {familyMembers.map((member, index) => (
              <div key={member.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-dark-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Member Details</h3>
                  </div>

                  {familyMembers.length > 1 && (
                    <button
                      onClick={() => removeFamilyMember(member.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold"
                      title="Remove Member"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={member.name}
                      onChange={(e) => updateFamilyMember(member.id, 'name', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-900 focus:border-transparent outline-none transition-all placeholder-gray-400 text-gray-900"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Category</label>
                    <div className="relative">
                      <select
                        value={member.relationship}
                        onChange={(e) => updateFamilyMember(member.id, 'relationship', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-900 focus:border-transparent outline-none transition-all appearance-none text-gray-900 pb-3"
                      >
                        <option value="" disabled>Select Category</option>
                        <option value="Lady">Lady</option>
                        <option value="Gentleman">Gentleman</option>
                        <option value="Teenager">Teenager</option>
                        <option value="Kid">Kid</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-4 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
          >
            <span>Continue to Select Service</span>
            <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default FamilyBooking;