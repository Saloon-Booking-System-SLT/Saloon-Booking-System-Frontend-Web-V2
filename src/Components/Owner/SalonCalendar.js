import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../Api/axios';
import ProfileModal from './ProfileModal';
import dayjs from 'dayjs';
import OwnerSidebar from './OwnerSidebar';
import OwnerHeader from './OwnerHeader';
import { CalendarDaysIcon, UserIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const SalonCalendar = () => {
  const navigate = useNavigate();
  const salon = JSON.parse(localStorage.getItem("salonUser"));
  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const timeSlots = Array.from({ length: 11 }, (_, i) => `${(9 + i).toString().padStart(2, '0')}:00`);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const res = await axios.get(`/professionals/${salon.id}`);
        setProfessionals(res.data);
        if (res.data.length > 0) {
          setSelectedProfessionalId(res.data[0]._id);
        }
      } catch (err) {
        console.error("❌ Error loading professionals", err);
      }
    };
    if (salon?.id) {
      fetchProfessionals();
    }
  }, [salon?.id]);

  useEffect(() => {
    if (!selectedProfessionalId || !salon?.id) return;

    const fetchAppointments = async () => {
      try {
        const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");
        const res = await axios.get(`/appointments/salon/${salon.id}`, {
          params: { date: formattedDate, professionalId: selectedProfessionalId }
        });

        const mapped = res.data.map((a) => ({
          id: a._id,
          startTime: a.startTime,
          endTime: a.endTime,
          clientName: a.user?.name || 'Unknown',
          service: a.services[0]?.name || '',
          duration: a.services[0]?.duration || '',
          price: a.services[0]?.price || '',
          clientData: {
            name: a.user?.name || '',
            email: a.user?.email || '',
            avatar: a.user?.name?.charAt(0)?.toUpperCase() || 'U',
            appointments: [
              {
                id: a._id,
                service: a.services[0]?.name,
                date: formattedDate,
                time: a.startTime,
                price: `LKR ${a.services[0]?.price}`,
                status: a.status
              }
            ]
          }
        }));

        setAppointments(mapped);
      } catch (err) {
        console.error("❌ Error loading appointments", err);
      }
    };

    fetchAppointments();
  }, [selectedDate, selectedProfessionalId, salon?.id]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'booked': return 'bg-blue-100 border-blue-400 text-blue-800';
      case 'confirmed': return 'bg-emerald-100 border-emerald-400 text-emerald-800';
      case 'arrived': return 'bg-amber-100 border-amber-400 text-amber-800';
      case 'started': return 'bg-purple-100 border-purple-400 text-purple-800';
      case 'completed': return 'bg-green-100 border-green-500 text-green-900';
      case 'cancelled':
      case 'cancel': return 'bg-red-100 border-red-400 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getAppointmentStyle = (appointment) => {
    const [startHour, startMin] = appointment.startTime.split(':').map(Number);
    const [endHour, endMin] = appointment.endTime.split(':').map(Number);
    const startMins = (startHour - 9) * 60 + startMin;
    const endMins = (endHour - 9) * 60 + endMin;

    // Scale: 80px per hour
    const top = (startMins / 60) * 80;
    const height = ((endMins - startMins) / 60) * 80;

    return { top: `${top}px`, height: `${height}px` };
  };

  const formatDate = (date) => ({
    day: date.getDate().toString(),
    month: date.toLocaleDateString('en-US', { month: 'long' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
    year: date.getFullYear()
  });

  const handleAppointmentClick = (appointment) => {
    setSelectedClient(appointment.clientData);
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    setSelectedClient(null);
  };

  // Date Navigation
  const prevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const dateInfo = formatDate(selectedDate);

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
                <CalendarDaysIcon className="w-7 h-7 text-primary-600" />
                Appointment Calendar
              </h1>
              <p className="text-gray-500 mt-1 ml-10">Manage schedule and view daily appointments.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              {/* Date Picker */}
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={selectedDate.toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all w-full min-w-[180px]"
                />
              </div>

              {/* Professional Dropdown */}
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={selectedProfessionalId}
                  onChange={(e) => setSelectedProfessionalId(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none w-full min-w-[180px]"
                >
                  {professionals.length === 0 ? (
                    <option value="">No professionals</option>
                  ) : (
                    professionals.map((pro) => (
                      <option key={pro._id} value={pro._id}>{pro.name}</option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[600px]">
            {/* Calendar Header with Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center">
                <div className="bg-primary-50 text-primary-600 rounded-2xl p-3 flex flex-col items-center justify-center min-w-[70px]">
                  <span className="text-xl font-black leading-none">{dateInfo.day}</span>
                  <span className="text-xs font-bold uppercase tracking-wide mt-1">{dateInfo.month.substring(0, 3)}</span>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">{dateInfo.weekday}</h2>
                  <p className="text-sm text-gray-500">{dateInfo.month} {dateInfo.day}, {dateInfo.year}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={prevDay} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedDate(new Date())} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700">
                  Today
                </button>
                <button onClick={nextDay} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Body Area */}
            <div className="flex-1 overflow-y-auto relative p-6 bg-slate-50/30 w-full">
              <div className="relative min-h-[800px] w-full max-w-4xl mx-auto">
                {/* Time Background Grid */}
                <div className="absolute inset-0 flex">
                  {/* Time Axis */}
                  <div className="w-20 shrink-0 border-r border-gray-200 relative pt-3 flex flex-col bg-white rounded-l-xl z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    {timeSlots.map((time, idx) => (
                      <div key={idx} className="h-[80px] w-full relative">
                        <span className="absolute -top-3 right-3 text-xs font-bold text-gray-500 bg-white px-1">{time}</span>
                      </div>
                    ))}
                  </div>

                  {/* Day Content Area */}
                  <div className="flex-1 relative border-r border-b border-t border-gray-200 bg-white rounded-r-xl pt-3">
                    {/* Horizontal Grid lines */}
                    {timeSlots.map((_, idx) => (
                      <div key={idx} className="h-[80px] border-b border-gray-100 border-dashed w-full opacity-60"></div>
                    ))}

                    {/* The Appointments Container */}
                    <div className="absolute inset-x-0 inset-y-0 mt-3 mr-4 ml-2">
                      {appointments.map((appointment) => {
                        const style = getAppointmentStyle(appointment);
                        const colorClasses = getStatusColor(appointment.clientData.appointments[0].status);

                        return (
                          <div
                            key={appointment.id}
                            onClick={() => handleAppointmentClick(appointment)}
                            className={`absolute left-0 right-0 mx-2 rounded-xl border-l-4 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden z-10 group opacity-95 hover:opacity-100 hover:scale-[1.01] ${colorClasses}`}
                            style={style}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold opacity-80 tracking-wide mb-1 block">
                                {appointment.startTime} - {appointment.endTime}
                              </span>
                              <span className="bg-white/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm shadow-sm hidden md:block">
                                {appointment.clientData.appointments[0].status}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm md:text-base leading-tight mt-0.5 line-clamp-1">{appointment.clientName}</h4>
                            <p className="text-xs md:text-sm opacity-80 mt-1 line-clamp-1 flex items-center gap-1.5 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 block"></span>
                              {appointment.service}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={closeProfileModal}
        selectedClient={selectedClient}
      />
    </div>
  );
};

export default SalonCalendar;
