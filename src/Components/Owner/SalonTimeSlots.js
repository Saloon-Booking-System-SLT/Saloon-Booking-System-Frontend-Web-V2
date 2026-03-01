import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../Api/axios';
import OwnerSidebar from './OwnerSidebar';
import OwnerHeader from './OwnerHeader';
import {
  ClockIcon,
  CalendarDaysIcon,
  UserIcon,
  PlusIcon,
  TrashIcon,
  BoltIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const SalonTimeSlots = () => {
  const navigate = useNavigate();
  const salon = JSON.parse(localStorage.getItem("salonUser"));

  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newSlot, setNewSlot] = useState({
    startTime: '09:00',
    endTime: '10:00',
  });

  // Fetch professionals on mount
  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const res = await axios.get(`/professionals/${salon.id}`);
        setProfessionals(res.data);
        if (res.data.length > 0) {
          setSelectedProfessionalId(res.data[0]._id);
        }
      } catch (err) {
 console.error("Error fetching professionals:", err);
      }
    };
    if (salon?.id) fetchProfessionals();
  }, [salon?.id]);

  const fetchTimeSlots = useCallback(async () => {
    if (!selectedProfessionalId || !selectedDate) return;
    setLoading(true);
    try {
      const res = await axios.get('/timeslots', {
        params: { professionalId: selectedProfessionalId, date: selectedDate }
      });
      setTimeSlots(res.data);
    } catch (err) {
 console.error("Error fetching time slots:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProfessionalId, selectedDate]);

  // Fetch time slots when professional or date changes
  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  const handleAddTimeSlot = async () => {
    if (!newSlot.startTime || !newSlot.endTime) {
      alert("Please fill all fields");
      return;
    }

    try {
      await axios.post('/timeslots', {
        salonId: salon.id,
        professionalId: selectedProfessionalId,
        date: selectedDate,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime
      });

      setShowAddModal(false);
      setNewSlot({ startTime: '09:00', endTime: '10:00' });
      fetchTimeSlots();
      // Optional: use a proper notification system instead of alert
    } catch (err) {
 console.error("Error adding time slot:", err);
      alert("Failed to add time slot");
    }
  };

  const handleGenerateSlots = async () => {
    if (!window.confirm("Generate time slots from 9:00 AM to 6:00 PM (1-hour intervals)?")) return;

    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      slots.push({
        salonId: salon.id,
        professionalId: selectedProfessionalId,
        date: selectedDate,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
      });
    }

    try {
      await Promise.all(slots.map(slot => axios.post('/timeslots', slot)));
      fetchTimeSlots();
    } catch (err) {
 console.error("Error generating time slots:", err);
      alert("Failed to generate time slots");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Delete this time slot?")) return;

    try {
      await axios.delete(`/timeslots/${slotId}`);
      fetchTimeSlots();
    } catch (err) {
 console.error("Error deleting time slot:", err);
      alert("Failed to delete time slot");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <OwnerSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0 overflow-hidden">
        <OwnerHeader />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-600 rounded-l-2xl"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <ClockIcon className="w-7 h-7 text-primary-600" />
                Time Slots Management
              </h1>
              <p className="text-gray-500 mt-1 ml-10">Configure availability for your professionals.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={handleGenerateSlots}
                className="btn-secondary py-2.5 px-5 whitespace-nowrap flex items-center justify-center gap-2"
                disabled={!selectedProfessionalId}
              >
                <BoltIcon className="w-5 h-5 text-amber-500" />
                Generate Daily Slots
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary py-2.5 px-5 whitespace-nowrap flex items-center justify-center gap-2"
                disabled={!selectedProfessionalId}
              >
                <PlusIcon className="w-5 h-5" />
                Add Time Slot
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-5 items-center">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-400" /> Select Professional
              </label>
              <select
                value={selectedProfessionalId}
                onChange={(e) => setSelectedProfessionalId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              >
                {professionals.length === 0 ? (
                  <option value="">No professionals found</option>
                ) : (
                  professionals.map(pro => (
                    <option key={pro._id} value={pro._id}>{pro.name}</option>
                  ))
                )}
              </select>
            </div>

            <div className="w-full md:w-1/2">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4 text-gray-400" /> Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Slots View */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Available Time Slots</h2>
              <span className="bg-primary-50 text-primary-700 py-1 px-3 rounded-full text-sm font-bold">
                {timeSlots.length} Slots
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <div key={n} className="bg-gray-50 rounded-xl h-24 animate-pulse border border-gray-100"></div>
                ))}
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <ClockIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No Time Slots</h3>
                <p className="text-gray-500 max-w-sm mb-6">There are no time slots available for the selected professional on this date.</p>
                <button
                  onClick={handleGenerateSlots}
                  className="btn-primary"
                  disabled={!selectedProfessionalId}
                >
                  Generate Standard Slots
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {timeSlots.map(slot => (
                  <div
                    key={slot._id}
                    className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all group ${slot.isBooked
                        ? 'bg-gray-50 border-gray-200 opacity-80'
                        : 'bg-white border-emerald-200 hover:border-emerald-300 hover:shadow-md'
                      }`}
                  >
                    <div className="mb-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-lg font-black text-gray-900 tracking-tight">{slot.startTime}</span>
                        {slot.isBooked ? (
                          <span className="bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Booked</span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Available</span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-500">to {slot.endTime}</span>
                    </div>

                    {!slot.isBooked && (
                      <button
                        onClick={() => handleDeleteSlot(slot._id)}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Delete slot"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Time Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            {/* Header Background */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white relative">
              <button
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                onClick={() => setShowAddModal(false)}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold mb-1">Add Time Slot</h2>
              <p className="text-primary-100 text-sm opacity-90">Create a specific availability block.</p>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 btn-primary py-2.5"
                  onClick={handleAddTimeSlot}
                >
                  Save Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonTimeSlots;