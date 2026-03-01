import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircleIcon,
  LightBulbIcon,
  UserIcon,
  UsersIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

const BookSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { salon } = location.state || {};
  const [hoveredCard, setHoveredCard] = useState(null);

  const individualFeatures = [
    "Personalized service selection",
    "Choose your favorite stylist",
    "Flexible scheduling options",
    "Quick and simple process"
  ];

  const groupFeatures = [
    "Book for multiple people",
    "Special group discounts",
    "Coordinated appointments",
    "Perfect for celebrations"
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate("/")}
          >

          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-500 hover:text-dark-900 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors"
          >
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16 fade-in slide-up">
          <div className="w-16 h-1 bg-dark-900 mx-auto rounded-full mb-6"></div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">Choose Booking Type</h1>
          <p className="text-lg text-gray-500">
            Select how you'd like to make your appointment today.
          </p>
        </div>

        {/* Booking Options */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-10 max-w-5xl mx-auto w-full">

          {/* Individual Booking Card */}
          <div
            className={`group relative bg-white rounded-[2rem] border overflow-hidden cursor-pointer transition-all duration-500 flex flex-col ${hoveredCard === 'individual'
              ? 'border-dark-900 shadow-2xl shadow-dark-900/10 -translate-y-1'
              : 'border-gray-200 hover:border-dark-900 hover:shadow-2xl hover:shadow-dark-900/10 hover:-translate-y-1'
              }`}
            onClick={() => navigate(`/select-services/${salon?._id}`, { state: { salon } })}
            onMouseEnter={() => setHoveredCard('individual')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="relative h-56 sm:h-64 overflow-hidden">
              <img
                src="https://i.postimg.cc/rz2dg0L1/individual.png"
                alt="Individual Booking"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                <UserIcon className="w-5 h-5 text-dark-900" />
                <span className="font-bold text-sm text-dark-900">Solo Experience</span>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex flex-col flex-grow">
              <h2 className="text-2xl font-black text-gray-900 mb-3">Individual Booking</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">
                Book personalized salon services for yourself. Choose your preferred stylist, date, and time with ease.
              </p>

              <ul className="space-y-3 mb-8">
                {individualFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                    <CheckCircleIcon className="w-5 h-5 text-dark-900 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className="w-full flex items-center justify-center gap-2 bg-gray-50 text-dark-900 font-bold py-4 rounded-xl border border-gray-200 group-hover:bg-dark-900 group-hover:text-white group-hover:border-dark-900 transition-all duration-300 mt-auto">
                <span>Select Individual</span>
                <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Group Booking Card */}
          <div
            className={`group relative bg-white rounded-[2rem] border overflow-hidden cursor-pointer transition-all duration-500 flex flex-col ${hoveredCard === 'group'
              ? 'border-dark-900 shadow-2xl shadow-dark-900/10 -translate-y-1'
              : 'border-gray-200 hover:border-dark-900 hover:shadow-2xl hover:shadow-dark-900/10 hover:-translate-y-1'
              }`}
            onClick={() => navigate("/familybooking", { state: { salon } })}
            onMouseEnter={() => setHoveredCard('group')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="relative h-56 sm:h-64 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Group Booking"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                <UsersIcon className="w-5 h-5 text-dark-900" />
                <span className="font-bold text-sm text-dark-900">Group Together</span>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex flex-col flex-grow">
              <h2 className="text-2xl font-black text-gray-900 mb-3">Group Booking</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">
                Plan a group appointment for friends, family, or special occasions. Enjoy exclusive group benefits together.
              </p>

              <ul className="space-y-3 mb-8">
                {groupFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                    <CheckCircleIcon className="w-5 h-5 text-dark-900 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className="w-full flex items-center justify-center gap-2 bg-gray-50 text-dark-900 font-bold py-4 rounded-xl border border-gray-200 group-hover:bg-dark-900 group-hover:text-white group-hover:border-dark-900 transition-all duration-300 mt-auto">
                <span>Select Group</span>
                <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

        </div>

        {/* Info Section */}
        <div className="max-w-2xl mx-auto w-full mt-16 fade-in">
          <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LightBulbIcon className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Need Help Choosing?</h3>
            <p className="text-amber-800/80 text-sm leading-relaxed">
              Our team is here to assist you. Contact us for personalized recommendations based on your specific needs and preferences.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-gray-100 mt-auto bg-white shrink-0">
        <p className="text-sm font-medium text-gray-500">
          Questions? <button onClick={() => navigate("/help")} className="text-dark-900 font-bold hover:underline transition-all">Contact Support</button>
        </p>
      </footer>
    </div>
  );
};

export default BookSelectionPage;