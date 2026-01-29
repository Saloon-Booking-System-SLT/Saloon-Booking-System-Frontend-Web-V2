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
  XMarkIcon,
  ChartBarIcon
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
      title: 'Revenue Report',
      icon: ChartBarIcon,
      path: '/revenue-report',
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
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
        w-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
        text-white min-h-screen flex flex-col shadow-2xl border-r border-slate-700 
        transition-transform duration-300 ease-in-out z-40
      `}>
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Brand Logo" className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white">Owner</span>
            <span className="text-xs text-slate-400">Dashboard</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 transform scale-105'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white hover:transform hover:scale-105'
              }`}
            >
              <IconComponent className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0" />
              <span className="font-medium text-sm tracking-wide truncate">{item.title}</span>
              {isActive(item.path) && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-90 flex-shrink-0"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/50 p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-red-600/20 hover:text-red-400 rounded-xl transition-all duration-300 group"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-medium text-sm">Logout</span>
        </button>
        <p className="text-xs text-slate-500 text-center mt-3 opacity-75">
          © 2024 Salon Owner
        </p>
      </div>
    </div>
    </>
  );
};

export default OwnerSidebar;