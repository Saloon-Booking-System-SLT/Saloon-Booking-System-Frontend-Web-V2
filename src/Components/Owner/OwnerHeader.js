import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const OwnerHeader = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();

  const API_BASE_URL = process.env.REACT_APP_API_URL ? 
    process.env.REACT_APP_API_URL.replace('/api', '') : 
    'http://localhost:5000';

  // Get salon data
  let salon = null;
  if (user && user.role === 'owner') {
    salon = user;
  } else {
    const storedSalon = localStorage.getItem("salonUser");
    if (storedSalon) {
      try {
        salon = JSON.parse(storedSalon);
      } catch (e) {
        console.error('Failed to parse salon data:', e);
      }
    }
  }

  const notifications = [
    { id: 1, message: "New appointment pending", time: "5 min ago" },
    { id: 2, message: "Customer feedback received", time: "10 min ago" },
    { id: 3, message: "Appointment confirmed", time: "1 hour ago" },
  ];

  const handleLogout = () => {
    const confirmLogout = window.confirm("Do you really want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("salonUser");
      authLogout();
      navigate("/OwnerLogin");
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search appointments, customers, services..."
              className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4 ml-6">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition"
                    >
                      <p className="text-sm text-gray-800">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-200 text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition"
            >
              <img
                src={
                  salon?.image
                    ? salon.image.startsWith("http")
                      ? salon.image
                      : `${API_BASE_URL}/uploads/${salon.image}`
                    : "https://ui-avatars.com/api/?name=Salon&background=random&size=40"
                }
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover border-2 border-white"
              />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">{salon?.name || 'Salon Owner'}</p>
                <p className="text-xs text-gray-500">Salon Owner</p>
              </div>
              <svg
                className="h-4 w-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <button
                  onClick={() => navigate(`/profile/${salon?.id}`)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                >
                  My Profile
                </button>
                <button
                  onClick={() => navigate('/calendar')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                >
                  Calendar
                </button>
                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerHeader;