import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  UsersIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import logo from '../../Assets/logo.png';

const OwnerSidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: HomeIcon,
      path: '/dashboard',
    },
    {
      title: 'Calendar',
      icon: CalendarDaysIcon,
      path: '/calendar',
    },
    {
      title: 'Services',
      icon: WrenchScrewdriverIcon,
      path: '/services',
    },
    {
      title: 'Professionals',
      icon: UsersIcon,
      path: '/professionals',
    },
    {
      title: 'Time Slots',
      icon: ClockIcon,
      path: '/timeslots',
    },
    {
      title: 'Feedback',
      icon: ChatBubbleBottomCenterTextIcon,
      path: '/feedbacks',
    },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      navigate('/OwnerLogin');
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
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-sm"
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
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:relative
        w-64 bg-white 
        min-h-screen flex flex-col border-r border-gray-200 
        transition-transform duration-300 ease-in-out z-40
      `}>
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray-100 px-6">
          <div className="flex items-center justify-center w-full">
            <img src={logo} alt="Brand Logo" className="h-10 w-auto" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 ${active
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <IconComponent className={`h-6 w-6 shrink-0 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                <span className={`font-medium text-sm tracking-wide truncate ${active ? 'font-semibold' : ''}`}>{item.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-3 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6 shrink-0" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default OwnerSidebar;