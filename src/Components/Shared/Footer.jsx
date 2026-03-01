import React from 'react';
import { Link } from 'react-router-dom';
import salonLogo from "../../Assets/salonlogo.png";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-200 py-10 px-6 sm:px-12 lg:px-20 mt-auto shrink-0 w-full">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center space-y-6 md:space-y-8">

                {/* Brand Logo & Name */}
                <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 bg-dark-900 rounded-xl flex items-center justify-center shadow-lg">
                        <img
                            src={salonLogo}
                            alt="Salon Logo"
                            className="w-7 h-7 object-contain filter brightness-0 invert"
                        />
                    </div>
                    <h2 className="text-xl font-heading font-black tracking-tight text-gray-900 text-center">
                        SLT-Mobitel Saloon Booking System
                    </h2>
                </div>

                {/* Footer Links */}
                <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                    <Link to="/" className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
                        Home
                    </Link>
                    <Link to="/searchsalon" className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
                        Find Salons
                    </Link>
                    <a href="#" className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
                        Term of Service
                    </a>
                    <a href="#" className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
                        Privacy Policy
                    </a>
                    <a href="#" className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors">
                        Help & Support
                    </a>
                </nav>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-70"></div>

                {/* Copyright Text */}
                <p className="text-sm text-gray-400 font-medium text-center">
                    &copy; {currentYear} SLT-Mobitel Saloon Booking System. All rights reserved.
                </p>

            </div>
        </footer>
    );
};

export default Footer;
