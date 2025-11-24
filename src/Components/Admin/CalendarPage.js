import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import './CalendarPage.css';
import axios from '../../Api/axios'; // Import axios

const CalendarPage = () => {
  const navigate = useNavigate();

  // Set to current date
const [currentDate, setCurrentDate] = useState(new Date()); // Current month
const [selectedDate, setSelectedDate] = useState(new Date()); // Today's date
  const [searchQuery, setSearchQuery] = useState('');
  
  // ✅ NEW: State for appointments from backend
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ NEW: Helper function to convert 24h time to 12h format (9:00 AM)
  const formatTime = useCallback((time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }, []);

  // ✅ NEW: Function to fetch appointments from backend
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required. Please login again.');
        navigate('/admin-login');
        return;
      }
      
      // Format the selected date as YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Make API call to backend with authentication
      const response = await axios.get('/admin/appointments', {
        params: { date: formattedDate },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Transform backend data to match our frontend format
      const transformedAppointments = response.data.map(appt => ({
        id: appt._id,
        time: formatTime(appt.startTime), // Convert 24h to 12h format
        customer: appt.user?.name || 'Guest',
        service: appt.services?.[0]?.name || 'Unknown Service',
        staff: appt.professionalId?.name || 'Not Assigned',
        status: appt.status || 'pending',
        date: appt.date,
        // Keep original data for updates
        _id: appt._id,
        startTime: appt.startTime,
        endTime: appt.endTime,
        professionalId: appt.professionalId?._id
      }));
      
      setAppointments(transformedAppointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/admin-login'), 2000);
      } else {
        setError('Failed to load appointments. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate, navigate, formatTime]); // Dependencies

  // ✅ NEW: Fetch appointments when date changes
  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, fetchAppointments]); // Re-fetch when selected date changes

  // Get calendar data
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  // ✅ UPDATED: Cancel appointment with backend
  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      // Update appointment status to 'cancelled' in backend - FIXED ENDPOINT
      await axios.patch(`/admin/appointments/${appointmentId}/status`, {
        status: 'cancelled'
      });
      
      alert('Appointment cancelled successfully!');
      
      // Refresh appointments list
      fetchAppointments();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Failed to cancel appointment. Please try again.');
    }
  };

  // ✅ UPDATED: Reschedule appointment (basic implementation)
  const handleRescheduleAppointment = (appointmentId) => {
    // For now, just show an alert
    // In the future, you can open a modal to select new date/time
    alert('Reschedule feature coming soon! You would select a new date and time here.');
    
    /* 
    // Future implementation would look like:
    const newDate = prompt('Enter new date (YYYY-MM-DD):');
    const newStartTime = prompt('Enter new start time (HH:mm):');
    const newEndTime = prompt('Enter new end time (HH:mm):');
    
    if (newDate && newStartTime && newEndTime) {
      axios.patch(`/appointments/${appointmentId}/reschedule`, {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime
      }).then(() => {
        alert('Appointment rescheduled!');
        fetchAppointments();
      }).catch(err => {
        alert('Failed to reschedule');
      });
    }
    */
  };

  // Filter appointments by search query only (date filtering already done by API)
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         apt.staff.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Get status badge class
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'booked': return 'status-booked';
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <AdminLayout>
      <div className="appointments-page-container">
        {/* Header */}
        <div className="appointments-header">
          <div>
            <h1 className="appointments-title">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Today's Appointments
            </h1>
            <p className="appointments-subtitle">
              Manage all appointments for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* ✅ NEW: Error message */}
        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fee', 
            color: '#c00', 
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="appointments-search-bar">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by customer, service, or staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Main Content: Calendar + Appointments */}
        <div className="appointments-content">
          {/* Left: Calendar Sidebar */}
          <div className="calendar-sidebar">
            <div className="calendar-widget">
              <div className="calendar-header">
                <button onClick={handlePrevMonth} className="calendar-nav-btn">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="calendar-month">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={handleNextMonth} className="calendar-nav-btn">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <div key={index} className="calendar-weekday">{day}</div>
                ))}
                
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="calendar-day empty"></div>
                ))}
                
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const isToday = day === new Date().getDate() && 
                                  currentDate.getMonth() === new Date().getMonth() &&
                                  currentDate.getFullYear() === new Date().getFullYear();
                  const isSelected = day === selectedDate.getDate() &&
                                     currentDate.getMonth() === selectedDate.getMonth() &&
                                     currentDate.getFullYear() === selectedDate.getFullYear();
                  
                  return (
                    <div 
                      key={day} 
                      className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleDateClick(day)}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar Info */}
            <div className="calendar-info">
              <div className="info-item">
                <div className="info-badge today-badge"></div>
                <span>Today</span>
              </div>
              <div className="info-item">
                <div className="info-badge selected-badge"></div>
                <span>Selected Date</span>
              </div>
            </div>
          </div>

          {/* Right: Appointments Table */}
          <div className="appointments-section">
            <div className="appointments-table-header">
              <h2 className="table-title">Appointments</h2>
              <div className="appointments-count">
                {/* ✅ NEW: Show loading state */}
                {loading ? 'Loading...' : `${filteredAppointments.length} ${filteredAppointments.length === 1 ? 'appointment' : 'appointments'}`}
              </div>
            </div>
            
            <div className="appointments-table-container">
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Staff</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ✅ NEW: Show loading spinner */}
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="no-appointments">
                        <p>Loading appointments...</p>
                      </td>
                    </tr>
                  ) : filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-appointments">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>No appointments found for this date</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="appointment-time">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {appointment.time}
                        </td>
                        <td className="appointment-customer">{appointment.customer}</td>
                        <td className="appointment-service">{appointment.service}</td>
                        <td className="appointment-staff">{appointment.staff}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td>
                          <div className="appointment-actions">
                            <button 
                              className="action-btn cancel-btn"
                              onClick={() => handleCancelAppointment(appointment._id)}
                              title="Cancel Appointment"
                              disabled={appointment.status === 'cancelled'}
                            >
                              Cancel
                            </button>
                            <span className="action-separator">/</span>
                            <button 
                              className="action-btn reschedule-btn"
                              onClick={() => handleRescheduleAppointment(appointment._id)}
                              title="Reschedule Appointment"
                              disabled={appointment.status === 'cancelled'}
                            >
                              Reschedule
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CalendarPage;