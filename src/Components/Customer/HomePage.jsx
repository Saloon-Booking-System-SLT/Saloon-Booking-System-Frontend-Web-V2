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
  const [showDownloadModal, setShowDownloadModal] = useState(false);
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
                          onClick={() => {
                            setMenuOpen(false);
                            navigate("/login/customer");
                          }}
                        >
                          Login or Sign Up
                        </button>
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => {
                            setMenuOpen(false);
                            // Assuming there might be a download page in the future
                            alert("App downloads coming soon!");
                          }}
                        >
                          Download the App
                        </button>
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => {
                            setMenuOpen(false);
                            // Assuming there's a support page or email anchor
                            window.location.href = "mailto:support@saloonbooking.com";
                          }}
                        >
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
              <button
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 py-4 px-8 text-lg w-full sm:w-auto rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-xl"
                onClick={() => setShowDownloadModal(true)}
              >
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

      {/* Download App — Coming Soon Modal */}
      {showDownloadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowDownloadModal(false)}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Gradient */}
            <div className="bg-gradient-to-br from-slate-900 via-primary-900 to-primary-700 px-8 pt-10 pb-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-5">
                <DevicePhoneMobileIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">App Coming Soon!</h2>
              <p className="text-white/70 text-sm leading-relaxed">
                Our mobile app is currently under development and will be available on both stores shortly.
              </p>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-7">
              {/* Store Badges */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-4">Available Soon On</p>
              <div className="flex flex-col sm:flex-row gap-3 mb-7">
                {/* Google Play Badge */}
                <div className="flex-1 flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 opacity-60 cursor-not-allowed select-none">
                  <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M3.18 23.5c.37.21.8.23 1.19.07l11.7-6.76-2.58-2.58L3.18 23.5z" fill="#EA4335"/>
                    <path d="M20.82 10.3c-.43-.26-1.1-.26-1.53 0l-2.22 1.28-2.85-2.85 2.85-2.85 2.22 1.28c.43.25.86.67.86 1.28s-.43 1.03-.33.86z" fill="#FBBC04"/>
                    <path d="M3.18.5C2.82.7 2.5 1.1 2.5 1.63v20.74c0 .53.32.93.68 1.13l11.31-11.5L3.18.5z" fill="#4285F4"/>
                    <path d="M4.37 23.57l11.7-6.76-2.58-2.58-9.12 9.34z" fill="#34A853"/>
                    <path d="M17.07 6.27l-2.58 2.46-9.31-9.23L17.07 6.27z" fill="#34A853"/>
                  </svg>
                  <div>
                    <div className="text-[10px] text-gray-500 leading-none">Get it on</div>
                    <div className="text-sm font-bold text-gray-800 leading-snug">Google Play</div>
                  </div>
                </div>
                {/* App Store Badge */}
                <div className="flex-1 flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 opacity-60 cursor-not-allowed select-none">
                  <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div>
                    <div className="text-[10px] text-gray-500 leading-none">Download on the</div>
                    <div className="text-sm font-bold text-gray-800 leading-snug">App Store</div>
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-3 bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3 mb-6">
                <span className="text-primary-500 text-lg mt-0.5">🔔</span>
                <p className="text-sm text-primary-800 leading-relaxed">
                  We're working hard to bring the app to your phone. Stay tuned — it'll be worth the wait!
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowDownloadModal(false)}
                className="w-full btn-primary py-3.5 text-base font-semibold rounded-xl"
              >
                Got it, I'll wait!
              </button>
            </div>

            {/* Close X */}
            <button
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;