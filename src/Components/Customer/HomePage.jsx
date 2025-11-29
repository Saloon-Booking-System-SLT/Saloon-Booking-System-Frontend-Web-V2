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
  CreditCardIcon
} from '@heroicons/react/24/outline';
import "./Home.css";

const Home = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <div className="home-wrapper">
      <header className="navbar px-4 md:px-6 lg:px-8">
        <div className="logo" onClick={() => navigate("/")}>Mobitel Salon</div>
        <nav className="nav-menu">
          <button className="nav-btn-light hidden md:block" onClick={() => navigate("/business")}>For Business</button>
          {!user ? (
            <>
              <button className="nav-link hidden sm:block" onClick={() => navigate("/login/customer")}>Log In</button>
              <div className="menu-container relative">
                <button className="nav-menu-btn p-2" onClick={toggleMenu}>
                  <Bars3Icon className="h-6 w-6" />
                </button>
                {menuOpen && (
                  <>
                    {/* Mobile overlay */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setMenuOpen(false)} />
                    
                    <div className="dropdown-menu absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                      <ul className="py-2">
                        <li className="px-4 py-3 text-sm font-medium text-gray-800 border-b border-gray-100">For Customers</li>
                        <li className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer" onClick={() => navigate("/login")}>Login or Sign Up</li>
                        <li className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">Download the App</li>
                        <li className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">Help & Support</li>
                        <li className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">සිංහල</li>
                        <li className="dropdown-divider border-t border-gray-100 my-1"></li>
                        <li className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">For Business →</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="home-menu-container profile-warp">
              <img
                src={user.photoURL || "https://via.placeholder.com/40"}
                alt="Profile"
                className="profile-icon"
                onClick={toggleMenu}
              />
              {menuOpen && (
                  <div className="dropdown-menu">
                    <div className="user-name">{user.name}</div>
                    <ul>
                      <li onClick={() => navigate("/profile")} className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Profile
                      </li>
                      <li onClick={() => navigate("/appointments")} className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-4 w-4" />
                        Appointments
                      </li>
                      <li onClick={handleLogout} className="flex items-center gap-2">
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        Logout
                      </li>
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

      <main className="home-main-content px-4 md:px-6 lg:px-8">
        <div className="hero-text text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6">Tap into Beauty & Wellness</h1>
          <p className="hero-description text-base md:text-lg lg:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
            Your journey to self-care starts here. Elite salons & spas at your fingertips.
          </p>
          <div className="cta-buttons flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="cta-primary w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg" onClick={() => navigate("/searchsalon")}>Find a Salon</button>
            <button className="cta-secondary w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg flex items-center justify-center gap-2">
              Download App 
              <DevicePhoneMobileIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </main>

      <section className="spotlight grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        <div className="spot-item text-center p-4 md:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col items-center justify-center gap-2 mb-3 md:mb-4">
            <SparklesIcon className="h-6 w-6 md:h-8 md:w-8 text-yellow-500 flex-shrink-0" />
            <h3 className="text-base md:text-lg lg:text-xl font-semibold text-center">Top Rated Salons</h3>
          </div>
          <p className="text-sm md:text-base text-gray-600">Only the best, carefully curated.</p>
        </div>
        <div className="spot-item text-center p-4 md:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col items-center justify-center gap-2 mb-3 md:mb-4">
            <BuildingStorefrontIcon className="h-6 w-6 md:h-8 md:w-8 text-purple-500 flex-shrink-0" />
            <h3 className="text-base md:text-lg lg:text-xl font-semibold text-center">Spa Treatments</h3>
          </div>
          <p className="text-sm md:text-base text-gray-600">Relaxation & luxury at your convenience.</p>
        </div>
        <div className="spot-item text-center p-4 md:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col items-center justify-center gap-2 mb-3 md:mb-4">
            <CreditCardIcon className="h-6 w-6 md:h-8 md:w-8 text-green-500 flex-shrink-0" />
            <h3 className="text-base md:text-lg lg:text-xl font-semibold text-center">Easy Payment</h3>
          </div>
          <p className="text-sm md:text-base text-gray-600">Safe and cashless transactions.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
