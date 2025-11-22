import React, { useEffect, useState, useRef } from 'react';
import './Dashboard.css';
import logo from '../../Assets/logo.png';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../Api/axios';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL ? 
  process.env.REACT_APP_API_URL.replace('/api', '') : 
  'http://localhost:5000';

// ✅ Calendar-style Sidebar component
const Sidebar = () => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('dashboard');

  const menuItems = [
    { icon: 'fas fa-home', path: '/dashboard', key: 'dashboard', title: 'Home' },
    { icon: 'fas fa-calendar-alt', path: '/calendar', key: 'calendar', title: 'Calendar' },
    { icon: 'fas fa-cut', path: '/services', key: 'services', title: 'Services' },
    { icon: 'fas fa-comment-alt', path: '/feedbacks', key: 'feedbacks', title: 'Feedbacks' },
    { icon: 'fas fa-users', path: '/professionals', key: 'professionals', title: 'Professionals' },
    { icon: 'fas fa-clock', path: '/timeslots', key: 'timeslots', title: 'Time Slots' },
  ];

  const handleNavigation = (path, key) => {
    setActiveItem(key);
    navigate(path);
  };

  return (
    <aside className="modern-sidebar">
      {/* Logo */}
      <img src={logo} alt="Brand Logo" className="modern-logo" />
      
      {/* Navigation Menu - Icon Only */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`nav-icon ${activeItem === item.key ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path, item.key)}
            title={item.title}
          >
            <i className={item.icon}></i>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div 
          className="nav-icon" 
          onClick={() => navigate('/help')}
          title="Help & Support"
        >
          <i className="fas fa-question-circle"></i>
        </div>
      </div>
    </aside>
  );
};

// ✅ Format functions
const formatDate = (dateStr) => dayjs(dateStr).format('ddd, DD MMM YYYY');

const formatTimeRange = (start, end) => {
  if (!start || !end) return "Time pending";
  const s = dayjs(`2000-01-01T${start}`);
  const e = dayjs(`2000-01-01T${end}`);
  return `${s.format("h:mm A")} – ${e.format("h:mm A")}`;
};

// ✅ Main Dashboard component
const ModernDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [salon, setSalon] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const notifRef = useRef();
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();

  // ✅ Logout function
  const handleLogout = () => {
    const confirmLogout = window.confirm("Do you really want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("salonUser");
      authLogout(); // Use auth context logout
      navigate("/OwnerLogin"); // redirect to owner login page
    }
  };

  // ✅ Show confirmation when user tries to refresh/back
  useEffect(() => {
    const beforeUnloadHandler = (e) => {
      e.preventDefault();
      e.returnValue = "Do you really want to logout?";
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
    };
  }, []);

  // ✅ Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Fetch salon data and appointments
  useEffect(() => {
    // Try to get salon data from auth context first, then localStorage
    let salonData = null;
    
    if (user && user.role === 'owner') {
      salonData = user;
    } else {
      const storedSalon = localStorage.getItem("salonUser");
      if (storedSalon) {
        try {
          salonData = JSON.parse(storedSalon);
        } catch (e) {
          console.error('Failed to parse salon data from localStorage:', e);
        }
      }
    }
    
    if (!salonData?.id) {
      setError('Salon data not found. Please log in again.');
      setLoading(false);
      navigate('/OwnerLogin');
      return;
    }
    
    setSalon(salonData);

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching appointments for salon:', salonData.id);
        
        const response = await axiosInstance.get(`/appointments/salon/${salonData.id}`);
        const all = response.data;

        console.log('✅ Fetched appointments:', all.length);

        const today = dayjs().format("YYYY-MM-DD");

        const todayList = all.filter(a => a.date === today);
        const upcomingList = all.filter(a => dayjs(a.date).isAfter(today));

        setAppointments(all);
        setTodayAppointments(todayList);
        setUpcomingAppointments(upcomingList);
      } catch (err) {
        console.error("❌ Failed to fetch appointments:", err);
        const errorMessage = err.response?.data?.message || 'Failed to load appointments';
        setError(errorMessage);
        
        // If it's an auth error, redirect to login
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/OwnerLogin');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, navigate]);

  const salonId = salon?.id;

  // Quick Stats
  const stats = {
    total: appointments.length,
    today: todayAppointments.length,
    upcoming: upcomingAppointments.length,
    pending: appointments.filter(a => a.status?.toLowerCase() === "pending").length
  };

  if (loading) {
    return (
      <div className="modern-full-page">
        <div className="modern-layout">
          <Sidebar />
          <main className="modern-main-content">
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading dashboard...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-full-page">
        <div className="modern-layout">
          <Sidebar />
          <main className="modern-main-content">
            <div className="error-state">
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Error Loading Dashboard</h3>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="retry-btn"
              >
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-full-page">
      <div className="modern-layout">
        <Sidebar />

        {/* Main Content */}
        <main className="modern-main-content">
          {/* Header */}
          <header className="modern-header">
            <div className="header-left">
              <h2>Salon Dashboard</h2>
              <p className="welcome-message">
                Welcome back, <strong>{salon?.name || 'Salon Owner'}</strong>! 
                {stats.today > 0 
                  ? ` You have ${stats.today} appointment${stats.today > 1 ? 's' : ''} today.`
                  : ' No appointments scheduled for today.'
                }
              </p>
            </div>
            
            <div className="modern-header-right" ref={notifRef}>
              {/* Quick Stats */}
              <div className="quick-stats">
                <div className="stat-item">
                  <i className="fas fa-calendar-day"></i>
                  <span>{stats.today} Today</span>
                </div>
                <div className="stat-item">
                  <i className="fas fa-clock"></i>
                  <span>{stats.pending} Pending</span>
                </div>
              </div>

              {/* Notification Bell */}
              <div className="notif-wrapper">
                <i
                  className="fas fa-bell"
                  title="Notifications"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  {stats.pending > 0 && (
                    <span className="notif-count">
                      {stats.pending}
                    </span>
                  )}
                </i>

                {showNotifications && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <h4>Notifications</h4>
                      <span className="notif-badge">{stats.pending} pending</span>
                    </div>
                    {stats.pending === 0 ? (
                      <p className="notif-empty">No pending appointments</p>
                    ) : (
                      appointments
                        .filter(a => a.status?.toLowerCase() === "pending")
                        .slice(0, 5)
                        .map(appt => (
                          <div key={appt._id} className="notif-item">
                            <div className="notif-content">
                              <strong>{appt.user?.name || 'Customer'}</strong>
                              <span className="notif-service">{appt.services[0]?.name}</span>
                              <small>{formatDate(appt.date)} · {formatTimeRange(appt.startTime, appt.endTime)}</small>
                            </div>
                            <button
                              className="notif-read-btn"
                              onClick={async () => {
                                try {
                                  await axiosInstance.patch(`/appointments/${appt._id}/status`, { status: "confirmed" });
                                  setAppointments(prev =>
                                    prev.map(a => a._id === appt._id ? { ...a, status: "confirmed" } : a)
                                  );
                                  // Update today appointments if it's today's appointment
                                  setTodayAppointments(prev =>
                                    prev.map(a => a._id === appt._id ? { ...a, status: "confirmed" } : a)
                                  );
                                } catch (err) {
                                  console.error("Failed to confirm appointment:", err);
                                  alert("Error confirming appointment: " + (err.response?.data?.message || 'Unknown error'));
                                }
                              }}
                            >
                              Confirm
                            </button>
                          </div>
                        ))
                    )}
                    {stats.pending > 5 && (
                      <div className="notif-footer">
                        <button onClick={() => navigate('/calendar')}>
                          View all appointments
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile image clickable to Salon Profile */}
              {salonId && (
                <Link to={`/profile/${salonId}`} className="profile-link">
                  <img
                    src={
                      salon.image
                        ? salon.image.startsWith("http")
                          ? salon.image
                          : `${API_BASE_URL}/uploads/${salon.image}`
                        : "https://ui-avatars.com/api/?name=User&background=random&size=40"
                    }
                    alt="Profile"
                    className="modern-profile"
                  />
                  <span className="profile-name">{salon.name}</span>
                </Link>
              )}

              {/* Logout Button */}
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          </header>

          {/* Content */}
          <section className="modern-content-area">
            {/* Stats Overview */}
            <div className="stats-overview">
              <div className="stat-card">
                <div className="stat-icon total">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div className="stat-info">
                  <h3>{stats.total}</h3>
                  <p>Total Appointments</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon today">
                  <i className="fas fa-sun"></i>
                </div>
                <div className="stat-info">
                  <h3>{stats.today}</h3>
                  <p>Today's Appointments</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon upcoming">
                  <i className="fas fa-calendar-week"></i>
                </div>
                <div className="stat-info">
                  <h3>{stats.upcoming}</h3>
                  <p>Upcoming</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon pending">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stat-info">
                  <h3>{stats.pending}</h3>
                  <p>Pending Approval</p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
              {/* All Appointments */}
              <div className="modern-appointments">
                <div className="section-header">
                  <h3><i className="fas fa-list-alt"></i> All Appointments</h3>
                  <span className="section-badge">{appointments.length}</span>
                </div>
                {appointments.length === 0 ? (
                  <div className="modern-empty">
                    <i className="fas fa-calendar-times"></i>
                    <h4>No Appointments Yet</h4>
                    <p>Start by creating your first appointment in the calendar section.</p>
                  </div>
                ) : (
                  <div className="appointments-list">
                    {appointments.slice(0, 6).map((appt) => (
                      <div key={appt._id} className="modern-card">
                        <div className="modern-left">
                          <div className="date-badge">
                            <span className="date-day">{dayjs(appt.date).format("DD")}</span>
                            <span className="date-month">{dayjs(appt.date).format("MMM")}</span>
                          </div>
                          <div className="appt-details">
                            <h4>{appt.services[0]?.name}</h4>
                            <small>{formatDate(appt.date)} · {formatTimeRange(appt.startTime, appt.endTime)}</small>
                            <small>{appt.services[0]?.duration} · {appt.user?.name}</small>
                            <span className={`modern-tag modern-${appt.status?.toLowerCase()}`}>
                              {appt.status}
                            </span>
                          </div>
                        </div>
                        <div className="modern-right">
                          <strong>LKR {appt.services[0]?.price}</strong>
                        </div>
                      </div>
                    ))}
                    {appointments.length > 6 && (
                      <button 
                        className="view-all-btn"
                        onClick={() => navigate('/calendar')}
                      >
                        View All Appointments ({appointments.length})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Today & Upcoming Sidebar */}
              <div className="modern-side-content">
                {/* Today Appointments */}
                <div className="modern-today">
                  <div className="section-header">
                    <h3><i className="fas fa-sun"></i> Today's Appointments</h3>
                    <span className="section-badge today-badge">{todayAppointments.length}</span>
                  </div>
                  {todayAppointments.length === 0 ? (
                    <div className="modern-empty small">
                      <i className="fas fa-clock"></i>
                      <h4>No Appointments Today</h4>
                      <p>Visit the calendar to schedule appointments.</p>
                    </div>
                  ) : (
                    todayAppointments.map((appt) => (
                      <div key={appt._id} className="modern-card compact">
                        <div className="modern-left">
                          <h4>{appt.services[0]?.name}</h4>
                          <small>{formatTimeRange(appt.startTime, appt.endTime)}</small>
                          <small>{appt.user?.name}</small>
                        </div>
                        <div className="modern-right">
                          <strong>LKR {appt.services[0]?.price}</strong>
                          <span className={`status-dot ${appt.status?.toLowerCase()}`}></span>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Upcoming */}
                  <div className="upcoming-section">
                    <div className="section-header">
                      <h3><i className="fas fa-calendar-week"></i> Upcoming</h3>
                      <span className="section-badge upcoming-badge">{upcomingAppointments.length}</span>
                    </div>
                    {upcomingAppointments.length === 0 ? (
                      <div className="modern-empty small">
                        <i className="fas fa-calendar-times"></i>
                        <h4>No Upcoming</h4>
                        <p>Future appointments will appear here.</p>
                      </div>
                    ) : (
                      upcomingAppointments.slice(0, 3).map((appt) => (
                        <div key={appt._id} className="modern-card compact">
                          <div className="modern-left">
                            <h4>{appt.services[0]?.name}</h4>
                            <small>{formatDate(appt.date)} · {formatTimeRange(appt.startTime, appt.endTime)}</small>
                            <small>{appt.user?.name}</small>
                          </div>
                          <div className="modern-right">
                            <strong>LKR {appt.services[0]?.price}</strong>
                            <span className={`status-dot ${appt.status?.toLowerCase()}`}></span>
                          </div>
                        </div>
                      ))
                    )}
                    {upcomingAppointments.length > 3 && (
                      <button 
                        className="view-more-btn"
                        onClick={() => navigate('/calendar')}
                      >
                        View More Upcoming
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ModernDashboard;