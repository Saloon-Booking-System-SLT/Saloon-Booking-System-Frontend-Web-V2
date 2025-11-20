import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
      <header className="navbar">
        <div className="logo" onClick={() => navigate("/")}>Mobitel Salon</div>
        <nav className="nav-menu">
          <button className="nav-btn-light" onClick={() => navigate("/business")}>For Business</button>
          {!user ? (
            <>
              <button className="nav-link" onClick={() => navigate("/login/customer")}>Log In</button>
              <div className="menu-container">
                <button className="nav-menu-btn" onClick={toggleMenu}>☰</button>
                {menuOpen && (
                  <div className="dropdown-menu">
                    <ul>
                      <li>For Customers</li>
                      <li onClick={() => navigate("/login")}>Login or Sign Up</li>
                      <li>Download the App</li>
                      <li>Help & Support</li>
                      <li>සිංහල</li>
                      <li className="dropdown-divider"></li>
                      <li>For Business →</li>
                    </ul>
                  </div>
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
                    <li onClick={() => navigate("/profile")}>👤 Profile</li>
                    <li onClick={() => navigate("/appointments")}>📅 Appointments</li>
                    <li onClick={handleLogout}>🚪 Logout</li>
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

      <main className="home-main-content">
        <div className="hero-text">
          <h1>Tap into Beauty & Wellness</h1>
          <p className="hero-description">
            Your journey to self-care starts here. Elite salons & spas at your fingertips.
          </p>
          <div className="cta-buttons">
            <button className="cta-primary" onClick={() => navigate("/searchsalon")}>Find a Salon</button>
            <button className="cta-secondary">Download App 📱</button>
          </div>
        </div>
      </main>

      <section className="spotlight">
        <div className="spot-item">
          <h3>✨ Top Rated Salons</h3>
          <p>Only the best, carefully curated.</p>
        </div>
        <div className="spot-item">
          <h3>💆 Spa Treatments</h3>
          <p>Relaxation & luxury at your convenience.</p>
        </div>
        <div className="spot-item">
          <h3>💳 Easy Payment</h3>
          <p>Safe and cashless transactions.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
