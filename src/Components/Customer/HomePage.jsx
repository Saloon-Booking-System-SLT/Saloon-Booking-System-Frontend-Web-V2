import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  UserIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  BuildingStorefrontIcon,
  CreditCardIcon,
  UserCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import salonLogo from "../../Assets/salonlogo.png";
import heroBg from "../../Assets/hero-image.jpg";

const Home = () => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for regular user
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsGuest(false);
    }

    // Check for guest user
    const guestUser = localStorage.getItem("guestUser");
    if (guestUser) {
      const guestData = JSON.parse(guestUser);
      setUser(guestData);
      setIsGuest(true);
    }
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleNavigateToProfile = () => {
    if (user && user.role === 'owner') {
      navigate(`/profile/${user.id || user._id}`);
    } else {
      navigate("/profile");
    }
    setMenuOpen(false);
  };

  const handleNavigateToAppointments = () => {
    if (user && user.role === 'owner') {
      navigate("/dashboard");
    } else {
      navigate("/appointments");
    }
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("guestUser");
    setUser(null);
    setIsGuest(false);
    setMenuOpen(false);
    navigate("/login");
  };

  const handleGuestLogout = () => {
    localStorage.removeItem("guestUser");
    setUser(null);
    setIsGuest(false);
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {/* Hero Section with Navigation */}
      <div
        className="relative bg-dark-900 min-h-[500px] lg:min-h-[600px] xl:min-h-[700px] flex flex-col"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.6)), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Navigation Bar */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 z-20">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <img src={salonLogo} alt="Salon Logo" className="h-10 w-auto group-hover:scale-105 transition-transform" />
            <span className="text-xl md:text-2xl font-bold text-white tracking-tight">Mobitel Salon</span>
          </div>

          <nav className="flex items-center gap-4">
            {!user ? (
              <>
                <button
                  className="hidden sm:block px-5 py-2 text-sm font-medium text-white hover:text-primary-300 transition-colors"
                  onClick={() => navigate("/login/customer")}
                >
                  Log In
                </button>
                <div className="relative">
                  <button
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    onClick={toggleMenu}
                  >
                    <Bars3Icon className="w-6 h-6" />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl p-2 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-4">
                        <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
                          For Customers
                        </div>
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => navigate("/login")}
                        >
                          Login or Sign Up
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                          Download the App
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                          Help & Support
                        </button>
                        <div className="h-px bg-gray-100 my-2"></div>
                        <button
                          onClick={() => navigate("/OwnerLogin")}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex justify-between items-center"
                        >
                          For Business
                          <ArrowRightOnRectangleIcon className="w-4 h-4 ml-2" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="relative flex items-center gap-3">
                <button
                  className="flex items-center justify-center rounded-full overflow-hidden border-2 border-white/20 hover:border-white transition-colors focus:outline-none focus:ring-2 focus:ring-white bg-white/10"
                  onClick={toggleMenu}
                >
                  {isGuest ? (
                    <UserCircleIcon className="w-9 h-9 text-white/90" />
                  ) : (
                    <img
                      src={user.photoURL || "https://ui-avatars.com/api/?name=User&background=random"}
                      alt="Profile"
                      className="w-9 h-9 object-cover"
                    />
                  )}
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl p-2 z-50 border border-gray-100 fade-in slide-up">
                      <div className="px-4 py-4 border-b border-gray-100 mb-2 bg-gray-50/50 rounded-t-xl flex flex-col items-start">
                        <span className="text-sm font-semibold text-gray-900 truncate w-full">
                          {isGuest ? "Guest User" : user.name}
                        </span>
                        {isGuest && <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800">Guest</span>}
                      </div>

                      {!isGuest && (
                        <>
                          <button onClick={handleNavigateToProfile} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-lg transition-colors flex items-center gap-3">
                            <UserIcon className="h-4 w-4" /> Profile
                          </button>
                          <button onClick={handleNavigateToAppointments} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-lg transition-colors flex items-center gap-3">
                            <CalendarDaysIcon className="h-4 w-4" /> Appointments
                          </button>
                        </>
                      )}

                      <div className="h-px bg-gray-100 my-2"></div>

                      <button
                        onClick={isGuest ? handleGuestLogout : handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        {isGuest ? "Exit Guest Mode" : "Logout"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </nav>
        </header>

        {/* Hero Content */}
        <main className="flex-grow flex items-center justify-center px-6 py-20 lg:py-32 relative z-10 text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center slide-up">
            <span className="text-primary-300 font-semibold tracking-wider uppercase text-sm mb-4">Discover Your Glow</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight font-heading">
              Tap into Beauty <br className="hidden sm:block" />& Wellness
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl font-light">
              Your journey to self-care starts here. Book premium appointments at top-rated salons and spas instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4 sm:px-0">
              <button
                className="btn-primary py-4 px-8 text-lg w-full sm:w-auto shadow-primary-600/30 font-semibold"
                onClick={() => {
                  if (user || isGuest) {
                    navigate("/searchsalon");
                  } else {
                    navigate("/login/customer");
                  }
                }}
              >
                Find a Salon
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 py-4 px-8 text-lg w-full sm:w-auto rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5">
                <DevicePhoneMobileIcon className="w-5 h-5 opacity-80" />
                Download App
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Features Spotlight */}
      <section className="max-w-7xl mx-auto w-full px-6 py-16 lg:py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card card-body flex flex-col items-center text-center p-8 group">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform bg-gradient-to-br from-amber-50 to-amber-100">
            <SparklesIcon className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-dark-900">Top Rated Salons</h3>
          <p className="text-gray-500">Only the best, carefully curated professionals ready to give you exceptional service.</p>
        </div>

        <div className="card card-body flex flex-col items-center text-center p-8 group">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform bg-gradient-to-br from-primary-50 to-primary-100">
            <BuildingStorefrontIcon className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-dark-900">Spa Treatments</h3>
          <p className="text-gray-500">Relaxation and luxury at your convenience. Escape the daily grind with a single tap.</p>
        </div>

        <div className="card card-body flex flex-col items-center text-center p-8 group">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CreditCardIcon className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-dark-900">Easy Payment</h3>
          <p className="text-gray-500">Safe, cashless transactions. Focus on your self-care while we handle the checkout seamlessly.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;