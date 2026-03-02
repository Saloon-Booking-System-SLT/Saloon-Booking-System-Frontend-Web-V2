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
import { useAuth } from "../../contexts/AuthContext";
import Footer from "../Shared/Footer";

// Banner Images
const BANNER_IMAGES = [
  `${process.env.PUBLIC_URL || ''}/Banner/Banner1.jpg`,
  `${process.env.PUBLIC_URL || ''}/Banner/Banner2.jpg`,
  `${process.env.PUBLIC_URL || ''}/Banner/Banner3.jpg`,
  `${process.env.PUBLIC_URL || ''}/Banner/Banner4.jpg`,
  `${process.env.PUBLIC_URL || ''}/Banner/Banner5.jpg`
];

// Elegant carousel typography pairings
const BANNER_CONTENT = [
  { title: "Tap into Beauty & Wellness", subtitle: "Your journey to self-care starts here. Book premium appointments instantly.", tag: "Discover Your Glow" },
  { title: "Elevate Your Style", subtitle: "Expert stylists and modern techniques tailored specifically for your lifestyle.", tag: "Signature Looks" },
  { title: "Unwind & Destress", subtitle: "Immerse yourself in deeply relaxing spa treatments designed to rejuvenate your soul.", tag: "Serene Escapes" },
  { title: "Precision & Care", subtitle: "Experience world-class nail care, aesthetics, and grooming by verified professionals.", tag: "Flawless Execution" },
  { title: "Luxury at Your Fingertips", subtitle: "Seamlessly browse, book, and pay for your favorite salon services all in one place.", tag: "Modern Convenience" }
];

const Home = () => {
  const { user: authUser, logout, firebaseUser } = useAuth();

  // Create a combined user object for the UI to use
  // Priority: 1. Guest User, 2. AuthContext User, 3. Firebase User
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // Carousel Auto-Play Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === BANNER_IMAGES.length - 1 ? 0 : prev + 1));
    }, 5000); // 5 seconds per slide
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const guestUser = localStorage.getItem("guestUser");
    if (guestUser) {
      setUser(JSON.parse(guestUser));
      setIsGuest(true);
    } else if (authUser) {
      setUser(authUser);
      setIsGuest(false);
    } else if (firebaseUser) {
      setUser({
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        role: 'customer'
      });
      setIsGuest(false);
    } else {
      setUser(null);
      setIsGuest(false);
    }
  }, [authUser, firebaseUser]);

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
    logout();
    setMenuOpen(false);
    navigate("/login/customer");
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
      {/* Hero Section with Navigation and Slider */}
      <div className="relative bg-dark-900 min-h-[500px] lg:min-h-[600px] xl:min-h-[700px] flex flex-col overflow-hidden">

        {/* Animated Background Slider */}
        {BANNER_IMAGES.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-[2000ms] ease-in-out ${index === currentSlide ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-slate-900/40 z-10" />
            <img
              src={img}
              alt={`Salon Banner ${index + 1}`}
              className="w-full h-full object-cover object-center transform scale-105 animate-[kenburns_20s_ease-out_infinite]"
            />
          </div>
        ))}
        {/* Navigation Bar */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 z-20">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <img src={salonLogo} alt="Salon Logo" className="h-10 w-auto group-hover:scale-105 transition-transform" />

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
        <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-20 lg:py-32 relative z-10 text-center w-full overflow-hidden">
          <div className="w-full max-w-7xl mx-auto flex flex-col items-center">

            <div className="relative h-[250px] sm:h-[300px] md:h-[350px] w-full flex flex-col items-center justify-center">
              {BANNER_CONTENT.map((content, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-[1500ms] ease-in-out transform w-full px-2 sm:px-8 ${index === currentSlide ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-24 scale-90 pointer-events-none'}`}
                >
                  <span className="text-primary-300 font-extrabold tracking-[0.25em] uppercase text-xs sm:text-base mb-4 sm:mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] z-10">
                    {content.tag}
                  </span>
                  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black text-white mb-6 leading-[1.1] font-heading drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] text-center w-full max-w-6xl z-10">
                    {content.title}
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-50 mb-8 max-w-4xl font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] text-center w-full leading-relaxed z-10">
                    {content.subtitle}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4 sm:px-0 mt-4 md:mt-8 relative z-20">
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
              <button className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 py-4 px-8 text-lg w-full sm:w-auto rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-xl">
                <DevicePhoneMobileIcon className="w-5 h-5 opacity-80" />
                Download App
              </button>
            </div>
          </div>
        </main>

        {/* Carousel Indicators */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-3">
          {BANNER_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 rounded-full ${index === currentSlide ? 'w-8 h-2.5 bg-primary-500 shadow-[0_0_10px_rgba(var(--color-primary-500),0.5)]' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
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

      <Footer />
    </div>
  );
};

export default Home;