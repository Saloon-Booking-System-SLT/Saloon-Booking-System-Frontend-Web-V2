import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../Api/axios';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import RevenueReport from './RevenueReport';
import {
  HomeIcon,
  CalendarDaysIcon,
  ScissorsIcon,
  ChatBubbleBottomCenterTextIcon,
  UserGroupIcon,
  ClockIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  SunIcon,
  ClipboardDocumentListIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';
import logo from '../../Assets/logo.png';

const API_BASE_URL = process.env.REACT_APP_API_URL ?
  process.env.REACT_APP_API_URL.replace(/\/api$/, '') :
  "";

// Format functions
const formatDate = (dateStr) => dayjs(dateStr).format('ddd, DD MMM YYYY');
const formatTimeRange = (start, end) => {
  if (!start || !end) return "Time pending";
  const s = dayjs(`2000-01-01T${start}`);
  const e = dayjs(`2000-01-01T${end}`);
  return `${s.format("h:mm A")} – ${e.format("h:mm A")}`;
};

// Sidebar component
const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('dashboard');

  const menuItems = [
    { icon: HomeIcon, path: '/dashboard', key: 'dashboard', title: 'Home' },
    { icon: CalendarDaysIcon, path: '/calendar', key: 'calendar', title: 'Calendar' },
    { icon: ScissorsIcon, path: '/services', key: 'services', title: 'Services' },
    { icon: ChatBubbleBottomCenterTextIcon, path: '/feedbacks', key: 'feedbacks', title: 'Feedbacks' },
    { icon: UserGroupIcon, path: '/professionals', key: 'professionals', title: 'Professionals' },
    { icon: ClockIcon, path: '/timeslots', key: 'timeslots', title: 'Time Slots' },
  ];

  const handleNavigation = (path, key) => {
    setActiveItem(key);
    navigate(path);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-dark-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed inset-y-0 left-0 bg-white w-64 border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-20 xl:w-64 flex flex-col ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-center border-b border-gray-100 xl:justify-start xl:px-6">
          <img src={logo} alt="Brand Logo" className="h-10 w-auto" />
          <span className="ml-3 font-heading font-bold text-xl text-dark-900 hidden xl:block">SalonPro</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.path, item.key)}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                title={item.title}
              >
                <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                <span className={`font-medium xl:block lg:hidden text-sm ${isActive ? 'font-semibold' : ''}`}>{item.title}</span>
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  );
};

// Main Dashboard component
const ModernDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [salon, setSalon] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const notifRef = useRef();
  const navigate = useNavigate();
  const { user, logout: authLogout, loading: authLoading, isAuthenticated } = useAuth();

  const handleLogout = () => {
    if (window.confirm("Do you really want to logout?")) {
      localStorage.removeItem("salonUser");
      authLogout();
      navigate("/OwnerLogin");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user || user.role !== 'owner') {
      setError('Access denied. Owner account required.');
      setLoading(false);
      navigate('/OwnerLogin');
      return;
    }

    const salonData = { ...user };
    if (!salonData.id && salonData._id) salonData.id = salonData._id;
    setSalon(salonData);

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/appointments/salon/${salonData.id}`);
        const all = response.data;
        const today = dayjs().format("YYYY-MM-DD");
        setAppointments(all);
        setTodayAppointments(all.filter(a => a.date === today));
        setUpcomingAppointments(all.filter(a => dayjs(a.date).isAfter(today)));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load appointments');
        if (err.response?.status === 401 || err.response?.status === 403) navigate('/OwnerLogin');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [user, authLoading, navigate, isAuthenticated]);

  if (salon && salon.approvalStatus !== 'approved') {
    return (
      <div className="flex h-screen bg-gray-50 font-sans">
        <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-card p-10 max-w-lg text-center border border-gray-100">
            {salon.approvalStatus === 'pending' ? (
              <>
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ClockIcon className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-dark-900 mb-4">Approval Pending</h2>
                <p className="text-gray-600 mb-6">
                  Your salon registration is currently under review. You will be able to access all features once approved.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-left">
                  <ExclamationCircleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-800 text-sm">This usually takes 24-48 hours. We'll notify you via email once approved.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircleIcon className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-dark-900 mb-4">Registration Rejected</h2>
                <p className="text-gray-600 mb-6">We're sorry, but your salon registration was not approved.</p>
                {salon.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left mb-6">
                    <strong className="text-red-800 text-sm block mb-1">Reason:</strong>
                    <p className="text-red-700 text-sm">{salon.rejectionReason}</p>
                  </div>
                )}
              </>
            )}
            <button
              onClick={handleLogout}
              className="mt-8 btn-secondary w-full"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </main>
      </div>
    );
  }

  const salonId = salon?.id;
  const stats = {
    total: appointments.length,
    today: todayAppointments.length,
    upcoming: upcomingAppointments.length,
    pending: appointments.filter(a => a.status?.toLowerCase() === "pending").length
  };

  if (loading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-sm text-center border border-gray-100">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-dark-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary w-full">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg" onClick={() => setIsMobileSidebarOpen(true)}>
              <Bars3Icon className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-dark-900 hidden sm:block">Dashboard Overview</h2>
              <p className="text-sm text-gray-500 hidden md:block">Welcome back, {salon?.name}!</p>
            </div>
          </div>

          <div className="flex items-center gap-6" ref={notifRef}>
            {/* Quick Stats Desktop */}
            <div className="hidden md:flex items-center gap-6 border-r border-gray-200 pr-6 h-10">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <SunIcon className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-dark-900">{stats.today}</span> Today
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClockIcon className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-dark-900">{stats.pending}</span> Pending
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <BellIcon className="w-6 h-6" />
                {stats.pending > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm border border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden z-50 fade-in">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h4 className="font-semibold text-dark-900 text-sm">Notifications</h4>
                    {stats.pending > 0 && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">{stats.pending} pending</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {stats.pending === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">No pending requests at the moment.</div>
                    ) : (
                      appointments.filter(a => a.status?.toLowerCase() === "pending").slice(0, 5).map(appt => (
                        <div key={appt._id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <p className="font-semibold text-sm text-dark-900">{appt.user?.name || 'Customer'}</p>
                          <p className="text-xs text-primary-600 font-medium my-0.5">{appt.services[0]?.name}</p>
                          <p className="text-xs text-gray-500 mb-3">{formatDate(appt.date)} · {formatTimeRange(appt.startTime, appt.endTime)}</p>
                          <button
                            className="bg-primary-600 text-white text-xs px-4 py-1.5 rounded-lg font-medium hover:bg-primary-700 transition"
                            onClick={async () => {
                              try {
                                await axiosInstance.patch(`/appointments/${appt._id}/status`, { status: "confirmed" });
                                setAppointments(prev => prev.map(a => a._id === appt._id ? { ...a, status: "confirmed" } : a));
                                setTodayAppointments(prev => prev.map(a => a._id === appt._id ? { ...a, status: "confirmed" } : a));
                              } catch (err) {
                                alert("Error confirming appointment");
                              }
                            }}
                          >
                            Confirm Appointment
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  {stats.pending > 5 && (
                    <button className="w-full p-3 text-xs font-semibold text-primary-600 hover:bg-gray-50 text-center border-t border-gray-100" onClick={() => navigate('/calendar')}>
                      View all notifications
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown logic omitted, using simple profile display */}
            <div className="flex items-center gap-3">
              {salonId && (
                <Link to={`/profile/${salonId}`} className="flex items-center gap-3 group">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-dark-900 leading-none mb-1 group-hover:text-primary-600 transition">{salon.name}</p>
                    <p className="text-xs text-gray-500 leading-none">Owner Panel</p>
                  </div>
                  <img
                    src={salon.image && salon.image.startsWith("http") ? salon.image : salon.image ? `${API_BASE_URL}/uploads/${salon.image}` : "https://ui-avatars.com/api/?name=User&background=random"}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border border-gray-200 object-cover group-hover:border-primary-400 transition"
                  />
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="card card-body flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <ClipboardDocumentListIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Appts</p>
                <h3 className="text-2xl font-bold text-dark-900">{stats.total}</h3>
              </div>
            </div>
            <div className="card card-body flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <SunIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Today</p>
                <h3 className="text-2xl font-bold text-dark-900">{stats.today}</h3>
              </div>
            </div>
            <div className="card card-body flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <CalendarDaysIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Upcoming</p>
                <h3 className="text-2xl font-bold text-dark-900">{stats.upcoming}</h3>
              </div>
            </div>
            <div className="card card-body flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                <ClockIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending</p>
                <h3 className="text-2xl font-bold text-dark-900">{stats.pending}</h3>
              </div>
            </div>
          </div>

          {/* Revenue Component Slot */}
          <div className="mb-8">
            <RevenueReport salonId={salonId} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
            {/* Main Appointments List */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                    <QueueListIcon className="w-5 h-5 text-gray-500" /> All Appointments
                  </h3>
                  <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-md">{appointments.length} Total</span>
                </div>

                {appointments.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <CalendarDaysIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-gray-900 font-medium">No Appointments Yet</h4>
                    <p className="text-sm text-gray-500 mt-1">When customers book services, they will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {appointments.slice(0, 6).map((appt) => (
                      <div key={appt._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition">
                        <div className="flex items-start gap-4">
                          <div className="bg-primary-50 text-primary-700 w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border border-primary-100">
                            <span className="text-sm font-bold leading-none">{dayjs(appt.date).format("DD")}</span>
                            <span className="text-[10px] font-medium uppercase mt-0.5">{dayjs(appt.date).format("MMM")}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-dark-900 leading-tight mb-1">{appt.services[0]?.name || 'Service'}</h4>
                            <p className="text-xs text-gray-500 mb-2">
                              {formatTimeRange(appt.startTime, appt.endTime)} · {appt.services[0]?.duration}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-medium truncate max-w-[120px]">
                                {appt.user?.name || 'Guest'}
                              </span>
                              <span className={`status-badge ${appt.status?.toLowerCase() === 'pending' ? 'pending' : appt.status?.toLowerCase() === 'confirmed' ? 'info' : appt.status?.toLowerCase() === 'completed' ? 'success' : 'error'}`}>
                                {appt.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center sm:block">
                          <span className="font-bold text-dark-900">LKR {appt.services[0]?.price}</span>
                        </div>
                      </div>
                    ))}
                    {appointments.length > 6 && (
                      <div className="p-4 text-center bg-gray-50/30">
                        <button className="text-sm font-semibold text-primary-600 hover:text-primary-700" onClick={() => navigate('/calendar')}>
                          View All Appointments →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Side Panel: Today & Upcoming */}
            <div className="flex flex-col gap-6 md:gap-8">
              {/* Today */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-amber-50/30 flex justify-between items-center">
                  <h3 className="font-heading font-semibold text-amber-900 flex items-center gap-2 text-sm">
                    <SunIcon className="w-4 h-4 text-amber-500" /> Today's Schedule
                  </h3>
                  <span className="text-amber-700 font-bold bg-amber-100 px-2 rounded-md text-xs py-0.5">{todayAppointments.length}</span>
                </div>
                <div className="p-0">
                  {todayAppointments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">Free schedule today!</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {todayAppointments.map((appt) => (
                        <div key={appt._id} className="p-4 hover:bg-gray-50 transition">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-sm text-dark-900 truncate pr-4">{appt.services[0]?.name}</h4>
                            <span className="text-sm font-semibold text-dark-900 shrink-0">Rs {appt.services[0]?.price}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="text-xs text-gray-500 flex flex-col gap-1">
                              <span>{formatTimeRange(appt.startTime, appt.endTime)}</span>
                              <span className="font-medium text-gray-700">{appt.user?.name}</span>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${appt.status?.toLowerCase() === 'pending' ? 'bg-orange-400' : 'bg-green-500'}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-blue-50/30 flex justify-between items-center">
                  <h3 className="font-heading font-semibold text-blue-900 flex items-center gap-2 text-sm">
                    <CalendarDaysIcon className="w-4 h-4 text-blue-500" /> Upcoming
                  </h3>
                </div>
                <div className="p-0">
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No upcoming bookings.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {upcomingAppointments.slice(0, 4).map((appt) => (
                        <div key={appt._id} className="p-4 hover:bg-gray-50 transition">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-sm text-dark-900 truncate pr-4">{appt.services[0]?.name}</h4>
                            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded shrink-0">{dayjs(appt.date).format('MMM DD')}</span>
                          </div>
                          <div className="text-xs text-gray-500 flex justify-between items-center">
                            <span>{appt.user?.name}</span>
                            <span>{formatTimeRange(appt.startTime, appt.endTime)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ModernDashboard;