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
  UserCircleIcon
} from '@heroicons/react/24/outline';
import salonLogo from "../../Assets/salonlogo.png";
import "./Home.css";

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

  

  const handleLogout = () => {
    // Remove both regular and guest user data
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
    <div className="home-wrapper">
      <header className="px-4 navbar md:px-6 lg:px-8">
        <div className="logo" onClick={() => navigate("/")}>
          <img src={salonLogo} alt="Salon Logo" className="home-salon-logo" />
          Mobitel Salon
        </div>
        <nav className="nav-menu">
          
          {!user ? (
            <>
              <button className="hidden nav-link sm:block" onClick={() => navigate("/login/customer")}>Log In</button>
              <div className="relative menu-container">
                <button className="p-2 nav-menu-btn" onClick={toggleMenu}>
                  <Bars3Icon className="w-6 h-6" />
                </button>
                {menuOpen && (
                  <>
                    {/* Mobile overlay */}
                    <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" onClick={() => setMenuOpen(false)} />
                    
                    <div className="absolute right-0 z-50 w-64 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl dropdown-menu">
                      <ul className="py-2">
                        <li className="px-4 py-3 text-sm font-medium text-gray-800 border-b border-gray-100">For Customers</li>
                        <li className="px-4 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50" onClick={() => navigate("/login")}>Login or Sign Up</li>
                        <li className="px-4 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">Download the App</li>
                        <li className="px-4 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">Help & Support</li>
                        <li className="px-4 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">සිංහල</li>
                        <li className="my-1 border-t border-gray-100 dropdown-divider"></li>
                        <li className="px-4 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50">For Business →</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="home-menu-container profile-warp">
              {isGuest ? (
                // Guest user icon
                <div 
                  className="flex items-center justify-center text-gray-700 bg-gray-200 rounded-full cursor-pointer guest-profile-icon"
                  onClick={toggleMenu}
                  style={{
                    width: '40px',
                    height: '40px',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}
                >
                  <UserCircleIcon className="w-8 h-8 text-gray-600" />
                </div>
              ) : (
                // Regular user profile image
                <img
                  src={user.photoURL || "https://via.placeholder.com/40"}
                  alt="Profile"
                  className="profile-icon"
                  onClick={toggleMenu}
                />
              )}
              
              {menuOpen && (
                <div className="dropdown-menu">
                  <div className="user-name">
                    {isGuest ? "Guest User" : user.name}
                    {isGuest && <span className="guest-badge">Guest</span>}
                  </div>
                  <ul>
                    {!isGuest && (
                      <>
                        <li onClick={() => navigate("/profile")} className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          Profile
                        </li>
                        <li onClick={() => navigate("/appointments")} className="flex items-center gap-2">
                          <CalendarDaysIcon className="w-4 h-4" />
                          Appointments
                        </li>
                      </>
                    )}
                    
                    {isGuest ? (
                      <li onClick={handleGuestLogout} className="flex items-center gap-2">
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Exit Guest Mode
                      </li>
                    ) : (
                      <li onClick={handleLogout} className="flex items-center gap-2">
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Logout
                      </li>
                    )}
                    
                    <li className="dropdown-divider"></li>
                    <li>Download the App</li>
                    <li>Help & Support</li>
                    <li>සිංහල</li>
                    <li className="dropdown-divider"></li>
                    <li>For Business →</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </nav>
      </header>

      <main className="px-4 home-main-content md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center hero-text">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl xl:text-6xl md:mb-6">Tap into Beauty & Wellness</h1>
          <p className="max-w-2xl mx-auto mb-6 text-base hero-description md:text-lg lg:text-xl md:mb-8">
            Your journey to self-care starts here. Elite salons & spas at your fingertips.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 cta-buttons sm:flex-row">
            <button className="w-full px-6 py-3 text-base cta-primary sm:w-auto md:px-8 md:py-4 md:text-lg" onClick={() => navigate("/searchsalon")}>Find a Salon</button>
            <button className="flex items-center justify-center w-full gap-2 px-6 py-3 text-base cta-secondary sm:w-auto md:px-8 md:py-4 md:text-lg">
              Download App 
              <DevicePhoneMobileIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      <section className="grid grid-cols-1 gap-4 px-4 py-6 spotlight lg:grid-cols-3 md:gap-6 lg:gap-8 md:px-6 lg:px-8 md:py-8 lg:py-12">
        <div className="p-4 text-center transition-shadow duration-300 bg-white shadow-sm spot-item md:p-6 rounded-xl hover:shadow-md">
          <div className="flex flex-col items-center justify-center gap-2 mb-3 md:mb-4">
            <SparklesIcon className="flex-shrink-0 w-6 h-6 text-yellow-500 md:h-8 md:w-8" />
            <h3 className="text-base font-semibold text-center md:text-lg lg:text-xl">Top Rated Salons</h3>
          </div>
          <p className="text-sm text-gray-600 md:text-base">Only the best, carefully curated.</p>
        </div>
        <div className="p-4 text-center transition-shadow duration-300 bg-white shadow-sm spot-item md:p-6 rounded-xl hover:shadow-md">
          <div className="flex flex-col items-center justify-center gap-2 mb-3 md:mb-4">
            <BuildingStorefrontIcon className="flex-shrink-0 w-6 h-6 text-purple-500 md:h-8 md:w-8" />
            <h3 className="text-base font-semibold text-center md:text-lg lg:text-xl">Spa Treatments</h3>
          </div>
          <p className="text-sm text-gray-600 md:text-base">Relaxation & luxury at your convenience.</p>
        </div>
        <div className="p-4 text-center transition-shadow duration-300 bg-white shadow-sm spot-item md:p-6 rounded-xl hover:shadow-md">
          <div className="flex flex-col items-center justify-center gap-2 mb-3 md:mb-4">
            <CreditCardIcon className="flex-shrink-0 w-6 h-6 text-green-500 md:h-8 md:w-8" />
            <h3 className="text-base font-semibold text-center md:text-lg lg:text-xl">Easy Payment</h3>
          </div>
          <p className="text-sm text-gray-600 md:text-base">Safe and cashless transactions.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;