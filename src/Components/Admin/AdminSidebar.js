import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterTextIcon,
  MegaphoneIcon,
  StarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import logo from '../../Assets/logo.png';

const AdminSidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: HomeIcon,
      path: '/admin-dashboard',
    },
    {
      title: 'Salons',
      icon: BuildingStorefrontIcon,
      path: '/salons',
    },
    {
      title: 'Customers',
      icon: UsersIcon,
      path: '/customers',
    },
    {
      title: 'Appointments',
      icon: CalendarDaysIcon,
      path: '/admincalendar',
    },
    {
      title: 'Feedback',
      icon: ChatBubbleBottomCenterTextIcon,
      path: '/feedback',
    },
    {
      title: 'Promotions',
      icon: MegaphoneIcon,
      path: '/promotions',
    },
    {
      title: 'Loyalty',
      icon: StarIcon,
      path: '/loyalty',
    },
    {
      title: 'Financial Insights',
      icon: ChartBarIcon,
      path: '/financial',
    },
    {
      title: 'Settings',
      icon: Cog6ToothIcon,
      path: '/settings',
    },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      navigate('/admin-login');
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dark-900 text-white rounded-lg shadow-lg"
        onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed
        w-64 bg-dark-900
        text-white h-screen flex flex-col shadow-2xl border-r border-dark-800 
        transition-transform duration-300 ease-in-out z-40
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Brand Logo" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg text-white">Admin</span>
              <span className="text-xs text-gray-400">Dashboard</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive(item.path)
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                  : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                  }`}
              >
                <IconComponent className={`h-5 w-5 flex-shrink-0 transition-transform ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`text-sm tracking-wide truncate ${isActive(item.path) ? 'font-semibold' : 'font-medium'}`}>{item.title}</span>
                {isActive(item.path) && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full opacity-90 flex-shrink-0 shadow-sm"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-dark-800 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 group"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="font-medium text-sm">Logout</span>
          </button>
          <p className="text-xs text-gray-500 text-center mt-4">
            © 2024 SLT-Mobitel Saloon Booking System Admin
          </p>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;