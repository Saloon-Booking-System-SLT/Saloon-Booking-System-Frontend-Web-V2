import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, BuildingStorefrontIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import hairdresserImage from '../../Assets/selection.jpg';

const LoginSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans selection:bg-primary-100">
      {/* Left side - Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-24 bg-white shadow-2xl z-10">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors self-start mb-12"
        >
          <div className="p-2 rounded-full border border-gray-200 group-hover:bg-gray-50 transition-colors">
            <ArrowLeftIcon className="h-4 w-4" />
          </div>
          Back
        </button>

        <div className="max-w-md w-full mx-auto md:mx-0">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 mb-4">
            Welcome to <span className="text-primary-600">Our Platform</span>
          </h2>
          <p className="text-gray-500 text-lg mb-10">
            Sign in or register to start your beauty journey or manage your business.
          </p>

          <div className="space-y-4">
            {/* Customer Option */}
            <div
              onClick={() => navigate('/login/customer')}
              className="group relative bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-primary-500 hover:shadow-xl hover:shadow-primary-500/10 cursor-pointer transition-all duration-300"
            >
              <div className="flex items-center gap-5">
                <div className="flex-shrink-0 w-14 h-14 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">I'm a Customer</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Book appointments instantly at trusted salons near you.</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-300 group-hover:text-primary-500 transform group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </div>

            {/* Business Option */}
            <div
              onClick={() => window.location.href = 'http://localhost:3001'}
              className="group relative bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-dark-900 hover:shadow-xl hover:shadow-dark-900/10 cursor-pointer transition-all duration-300"
            >
              <div className="flex items-center gap-5">
                <div className="flex-shrink-0 w-14 h-14 bg-gray-100 text-dark-900 rounded-full flex items-center justify-center group-hover:bg-dark-900 group-hover:text-white transition-colors duration-300">
                  <BuildingStorefrontIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">I'm a Business Owner</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Manage your salon, track bookings, and grow your brand.</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-300 group-hover:text-dark-900 transform group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Right side - Image Background */}
      <div className="hidden md:block flex-1 relative bg-dark-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/20 to-transparent z-10"></div>
        <img
          src={hairdresserImage}
          alt="Hairdresser working"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-16">
          <div className="backdrop-blur-md bg-white/10 p-8 rounded-2xl border border-white/20 max-w-lg">
            <h2 className="text-3xl font-bold text-white mb-3">Elevate Your Style</h2>
            <p className="text-gray-200 text-lg">Connect with top-rated beauty professionals or take your salon business to the next level.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;
