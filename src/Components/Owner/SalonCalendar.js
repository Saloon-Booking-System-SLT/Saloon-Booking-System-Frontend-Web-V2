import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileModal from './ProfileModal';
import logo from '../../Assets/logo.png';
import dayjs from 'dayjs';
import './SalonCalendar.css';
import { API_BASE_URL } from '../../config/api';
import { CalendarDaysIcon, UserIcon } from '@heroicons/react/24/outline';

const SalonCalendar = () => {
  const navigate = useNavigate();
  const salon = JSON.parse(localStorage.getItem("salonUser"));
  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const timeSlots = Array.from({ length: 10 }, (_, i) => `${(9 + i).toString().padStart(2, '0')}:00`);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/professionals/${salon.id}`);
        setProfessionals(res.data);
        setSelectedProfessionalId(res.data[0]?._id || '');
      } catch (err) {
        console.error("❌ Error loading professionals", err);
      }
    };
    fetchProfessionals();
  }, [salon.id]);

  useEffect(() => {
    if (!selectedProfessionalId) return;

    const fetchAppointments = async () => {
      try {
        const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");
        const res = await axios.get(`${API_BASE_URL}/appointments/salon/${salon.id}`, {
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
  }, [selectedDate, selectedProfessionalId, salon.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Booked': return '#60a5fa';
      case 'Confirmed': return '#10b981';
      case 'Arrived': return '#f59e0b';
      case 'Started': return '#8b5cf6';
      case 'Completed': return '#22c55e';
      case 'Cancel': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getAppointmentStyle = (appointment) => {
    const [startHour, startMin] = appointment.startTime.split(':').map(Number);
    const [endHour, endMin] = appointment.endTime.split(':').map(Number);
    const startMins = (startHour - 9) * 60 + startMin;
    const endMins = (endHour - 9) * 60 + endMin;
    const top = (startMins / 60) * 80;
    const height = ((endMins - startMins) / 60) * 80;
    return { top: `${top}px`, height: `${height}px` };
  };

  const formatDate = (date) => ({
    day: date.getDate().toString(),
    month: date.toLocaleDateString('en-US', { month: 'short' })
  });

  const handleAppointmentClick = (appointment) => {
    setSelectedClient(appointment.clientData);
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    setSelectedClient(null);
  };

  const dateInfo = formatDate(selectedDate);

  return (
    <div className="calendar-container">
      <aside className="modern-sidebar">
        <img src={logo} alt="Brand Logo" className="modern-logo" />
        <i className="fas fa-home" title="Home" onClick={() => navigate('/dashboard')}></i>
        <i className="fas fa-calendar-alt active" title="Calendar" onClick={() => navigate('/calendar')}></i>
        <i className="fas fa-smile" title="Customers" onClick={() => navigate('/services')}></i>
        <i className="fas fa-comment" title="Feedbacks" onClick={() => navigate("/feedbacks")}></i>
        <i className="fas fa-users" title="Professionals" onClick={() => navigate('/professionals')}></i>
        <i className='fas fa-calendar-check' title='Book An Appointment' onClick={() => navigate('/book-appointment')}></i>
        <i className="fas fa-clock" title="Time Slots" onClick={() => navigate('/timeslots')}></i>
      </aside>

      <div className="main-content">
        <header className="header">
          <h1 className="header-title">Calendar</h1>
          <div>
            <label className="input-label">
              <CalendarDaysIcon className="h-5 w-5" />
              <input
                type="date"
                value={selectedDate.toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </label>
            <label className="input-label">
              <UserIcon className="h-5 w-5" />
              <select
                value={selectedProfessionalId}
                onChange={(e) => setSelectedProfessionalId(e.target.value)}
              >
                {professionals.map((pro) => (
                  <option key={pro._id} value={pro._id}>{pro.name}</option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <div className="calendar-content">
          <div className="calendar-header">
            <div className="date-info">
              <span className="date-number">{dateInfo.day}</span>
              <span className="date-month">{dateInfo.month}</span>
            </div>
            <div className="salon-name">{salon?.name}</div>
          </div>

          <div className="calendar-grid">
            <div className="time-column">
              {timeSlots.map((time, idx) => (
                <div key={idx} className="time-slot">
                  <span className="time-label">{time}</span>
                </div>
              ))}
            </div>

            <div className="appointments-column">
              <div className="appointments-container">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="appointment-block"
                    style={{
                      ...getAppointmentStyle(appointment),
                      backgroundColor: getStatusColor(appointment.clientData.appointments[0].status)
                    }}
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    <div className="appointment-time">
                      {appointment.startTime} - {appointment.endTime}
                    </div>
                    <div className="appointment-client">{appointment.clientName}</div>
                    <div className="appointment-service">{appointment.service}</div>
                    <div className="appointment-status-label">{appointment.clientData.appointments[0].status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
