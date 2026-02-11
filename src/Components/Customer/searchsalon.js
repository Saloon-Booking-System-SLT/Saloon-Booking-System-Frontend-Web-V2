import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDaysIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import "./searchsaloon.css";
import fallbackImage from "../../Assets/searchsalonimg.png";
import LocationPickerModal from "./LocationPickerModal";

const API_BASE_URL = process.env.REACT_APP_API_URL ? 
  process.env.REACT_APP_API_URL.replace('/api', '') : 
  'https://saloon-booking-system-backend-v2.onrender.com';

const districtSuggestions = [
  "Colombo", "Kandy", "Galle", "Jaffna", "Matara",
  "Kurunegala", "Anuradhapura", "Negombo", "Ratnapura",
  "Batticaloa", "Nuwara Eliya"
];

const SearchSalon = () => {
  const [allSalons, setAllSalons] = useState([]);
  const [filteredSalons, setFilteredSalons] = useState([]);
  const [nearbySalons, setNearbySalons] = useState([]);
  const [query, setQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userFavorites, setUserFavorites] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showLocationSuccess, setShowLocationSuccess] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Modal and mode states
  const [modalOpen, setModalOpen] = useState(false);
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [manualNearbyMode, setManualNearbyMode] = useState(false);

  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  

  const handleNavigateToProfile = () => {
    navigate("/profile");
    setMenuOpen(false);
  };

  const handleNavigateToAppointments = () => {
    navigate("/appointments");
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
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

  const fetchUserFavorites = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/users/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUserFavorites(data.favorites.map(salon => salon._id));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (salonId) => {
    try {
      // Check if user is guest
      if (isGuest) {
        alert("Please log in to add favorites");
        navigate("/login");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to add favorites");
        navigate("/login");
        return;
      }

      const isFavorite = userFavorites.includes(salonId);
      const method = isFavorite ? 'DELETE' : 'POST';
      
      const res = await fetch(`${API_BASE_URL}/api/users/favorites/${salonId}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        if (isFavorite) {
          setUserFavorites(userFavorites.filter(id => id !== salonId));
        } else {
          setUserFavorites([...userFavorites, salonId]);
        }
      } else {
        const error = await res.json();
        alert(error.message || 'Error updating favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Error updating favorites');
    }
  };

  const fetchSalons = useCallback(async () => {
    try {
      // ⚡ Use optimized endpoint that returns salons with ratings in ONE call
      const res = await fetch(`${API_BASE_URL}/api/salons/with-ratings`);
      const salonsWithRatings = await res.json();

      // Sort by distance if user location is available
      let sortedSalons = salonsWithRatings;
      if (userLocation && userLocation.lat && userLocation.lng) {
        sortedSalons = sortSalonsByDistance(salonsWithRatings, userLocation.lat, userLocation.lng);
        console.log('Salons sorted by distance from user location');
      }

      // Salons already have avgRating and reviewCount from backend
      setAllSalons(sortedSalons);
      if (!isNearbyMode) applyFilters(sortedSalons, query, genderFilter);
    } catch (err) {
      console.error("Failed to load salons", err);
      alert("Failed to load salons");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, genderFilter, isNearbyMode, userLocation]);

  // Initialize user and get location only once on mount
  useEffect(() => {
    // Check if this is the first visit
    const hasVisitedBefore = localStorage.getItem('hasVisitedSalonApp');
    
    // Check for regular user
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsGuest(false);
      fetchUserFavorites();
      
      // Show location prompt for first-time users, otherwise get location directly
      if (!hasVisitedBefore) {
        setShowLocationPrompt(true);
        localStorage.setItem('hasVisitedSalonApp', 'true');
      } else {
        getUserLocation();
      }
    }
    
    // Check for guest user
    const guestUser = localStorage.getItem("guestUser");
    if (guestUser) {
      const guestData = JSON.parse(guestUser);
      setUser(guestData);
      setIsGuest(true);
      
      // Show location prompt for first-time users, otherwise get location directly
      if (!hasVisitedBefore) {
        setShowLocationPrompt(true);
        localStorage.setItem('hasVisitedSalonApp', 'true');
      } else {
        getUserLocation();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Fetch salons when needed
  useEffect(() => {
    fetchSalons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSalons]);

  // Unified filter effect
  useEffect(() => {
    // If "All" is selected, always show all salons from database, not just nearby
    if (genderFilter === "All") {
      let filtered = allSalons;
      if (query) filtered = filtered.filter((s) => s.location.toLowerCase().includes(query.toLowerCase()));
      // Maintain distance-based sorting if user location is available
      if (userLocation && userLocation.lat && userLocation.lng) {
        filtered = sortSalonsByDistance(filtered, userLocation.lat, userLocation.lng);
      }
      setFilteredSalons(filtered);
      // Reset nearby mode when "All" is selected
      setIsNearbyMode(false);
      setManualNearbyMode(false);
    } else if (isNearbyMode) {
      let filtered = nearbySalons;
      filtered = filtered.filter((s) => s.salonType === genderFilter);
      setFilteredSalons(filtered);
    } else {
      let filtered = allSalons;
      if (query) filtered = filtered.filter((s) => s.location.toLowerCase().includes(query.toLowerCase()));
      filtered = filtered.filter((s) => s.salonType === genderFilter);
      // Maintain distance-based sorting if user location is available
      if (userLocation && userLocation.lat && userLocation.lng) {
        filtered = sortSalonsByDistance(filtered, userLocation.lat, userLocation.lng);
      }
      setFilteredSalons(filtered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genderFilter, query, allSalons, nearbySalons, isNearbyMode, userLocation]);

  const applyFilters = (salons, locationQuery, gender) => {
    let filtered = salons;
    if (locationQuery) filtered = filtered.filter((s) =>
      s.location.toLowerCase().includes(locationQuery.toLowerCase())
    );
    if (gender !== "All") filtered = filtered.filter((s) => s.salonType === gender);
    setFilteredSalons(filtered);
  };

  const fetchNearbySalons = async (lat, lng, manual = false) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/salons/nearby?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error("Failed to load nearby salons");
      let data = await res.json();

      const nearbyWithRatings = await Promise.all(
        data.map(async (salon) => {
          try {
            const profRes = await fetch(`${API_BASE_URL}/api/professionals/${salon._id}`);
            const professionals = await profRes.json();

            const allFeedbacks = await Promise.all(
              professionals.map(async (pro) => {
                const fbRes = await fetch(`${API_BASE_URL}/api/feedback/professionals/${pro._id}`);
                const fbData = await fbRes.json();
                return fbData.feedbacks || [];
              })
            );

            const flatFeedbacks = allFeedbacks.flat();
            const avgRating = flatFeedbacks.length
              ? flatFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) / flatFeedbacks.length
              : 0;

            return { ...salon, avgRating: avgRating.toFixed(1) };
          } catch {
            return { ...salon, avgRating: 0 };
          }
        })
      );

      nearbyWithRatings.sort((a, b) => b.avgRating - a.avgRating);
      setNearbySalons(nearbyWithRatings);
      setIsNearbyMode(true);
      setManualNearbyMode(manual);
      setQuery("");
      setShowSuggestions(false);
    } catch (err) {
      alert(err.message);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // District coordinates for salons without exact coordinates
  const districtCoordinates = {
    colombo: { lat: 6.9271, lng: 79.8612 },
    kandy: { lat: 7.2906, lng: 80.6337 },
    galle: { lat: 6.0535, lng: 80.221 },
    jaffna: { lat: 9.6615, lng: 80.0255 },
    matara: { lat: 5.9549, lng: 80.5549 },
    kurunegala: { lat: 7.4868, lng: 80.3659 },
    anuradhapura: { lat: 8.3114, lng: 80.4037 },
    negombo: { lat: 7.2083, lng: 79.8358 },
    ratnapura: { lat: 6.6828, lng: 80.3992 },
    batticaloa: { lat: 7.7184, lng: 81.7001 },
    "nuwara eliya": { lat: 6.9497, lng: 80.7891 },
    gampaha: { lat: 7.0873, lng: 80.0014 },
    polonnaruwa: { lat: 7.9403, lng: 81.0188 },
    trincomalee: { lat: 8.5874, lng: 81.2152 },
    badulla: { lat: 6.9934, lng: 81.0550 },
    hambantota: { lat: 6.1429, lng: 81.1212 },
    kalutara: { lat: 6.5854, lng: 79.9607 },
    puttalam: { lat: 8.0362, lng: 79.8283 },
    monaragala: { lat: 6.8728, lng: 81.3507 },
    kegalle: { lat: 7.2513, lng: 80.3464 },
    matale: { lat: 7.4675, lng: 80.6234 },
    ampara: { lat: 7.2976, lng: 81.6728 },
    kilinochchi: { lat: 9.3967, lng: 80.4036 },
    mannar: { lat: 8.9810, lng: 79.9044 },
    mullaitivu: { lat: 9.2671, lng: 80.8142 },
    vavuniya: { lat: 8.7542, lng: 80.4982 },
  };

  const getCityFromLocation = (location) => {
    if (!location) return "";

    const districts = [
      "Colombo", "Kandy", "Galle", "Matara", "Kurunegala", "Gampaha", "Jaffna",
      "Anuradhapura", "Polonnaruwa", "Batticaloa", "Trincomalee", "Ratnapura",
      "Badulla", "Nuwara Eliya", "Hambantota", "Kalutara", "Puttalam", "Monaragala",
      "Kegalle", "Matale", "Ampara", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"
    ];

    const found = districts.find((d) =>
      location.toLowerCase().includes(d.toLowerCase())
    );

    return found || "Unknown";
  };

  // Get salon coordinates (either from salon.coordinates or from district)
  const getSalonCoordinates = (salon) => {
    if (salon.coordinates && salon.coordinates.lat && salon.coordinates.lng) {
      return salon.coordinates;
    }
    
    const salonLocation = salon.location?.toLowerCase() || "";
    for (let district in districtCoordinates) {
      if (salonLocation.includes(district)) {
        return districtCoordinates[district];
      }
    }
    return null;
  };

  // Format distance for display (meters or kilometers)
  const formatDistance = (distanceInKm) => {
    if (!distanceInKm && distanceInKm !== 0) return '';
    if (distanceInKm < 1) {
      return `${Math.round(distanceInKm * 1000)} m`;
    }
    return `${distanceInKm.toFixed(1)} km`;
  };

  // Add distance to salons and sort by distance from user
  const sortSalonsByDistance = useCallback((salons, userLat, userLng) => {
    if (!userLat || !userLng) return salons;

    const salonsWithDistance = salons.map(salon => {
      const salonCoords = getSalonCoordinates(salon);
      if (salonCoords) {
        const distance = calculateDistance(userLat, userLng, salonCoords.lat, salonCoords.lng);
        return { ...salon, distance: distance.toFixed(1), distanceRaw: distance };
      }
      return { ...salon, distance: null, distanceRaw: null };
    });

    // Sort: salons with distance first (by distance), then salons without distance
    return salonsWithDistance.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return parseFloat(a.distance) - parseFloat(b.distance);
    });
  }, []);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationLoading(false);
        setLocationError(null);
        setShowLocationSuccess(true);
        // Auto-hide success banner after 5 seconds
        setTimeout(() => setShowLocationSuccess(false), 5000);
        console.log('User location obtained:', { latitude, longitude });
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
          default:
            errorMessage = "An unknown error occurred";
        }
        setLocationError(errorMessage);
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  const handleLocationInputChange = (e) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
    if (manualNearbyMode || isNearbyMode) {
      setManualNearbyMode(false);
      setIsNearbyMode(false);
      setNearbySalons([]);
    }
  };

  const handleLocationSelect = (position) => {
    fetchNearbySalons(position.lat, position.lng, true);
    setModalOpen(false);
  };

  const openNearbyModal = () => setModalOpen(true);
  const closeNearbyModal = () => setModalOpen(false);

  const resetNearbyFilter = () => {
    setManualNearbyMode(false);
    setIsNearbyMode(false);
    setNearbySalons([]);
    applyFilters(allSalons, query, genderFilter);
  };

  return (
    <div className="search-wrapper">
      <header className="navbar">
        <div className="logo logo-lowered" onClick={() => navigate("/")}>Salon</div>
        <nav className="nav-menu">
          
          {!user ? (
            <>
              <button className="nav-link" onClick={() => navigate("/login")}>Log In</button>
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
            <div className="menu-container profile-warp">
              {isGuest ? (
                // Guest user icon
                <div 
                  className="guest-profile-icon flex items-center justify-center bg-gray-200 text-gray-700 rounded-full cursor-pointer"
                  onClick={toggleMenu}
                  style={{
                    width: '40px',
                    height: '40px',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}
                >
                  <UserCircleIcon className="h-8 w-8 text-gray-600" />
                </div>
              ) : (
                // Regular user profile image
                <img
                  src={user.photoURL || "https://ui-avatars.com/api/?name=User&background=random&size=40"}
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
                        <li onClick={handleNavigateToProfile}>👤 Profile</li>
                        <li onClick={handleNavigateToAppointments}>
                          <CalendarDaysIcon className="h-4 w-4 inline mr-1" /> Appointments
                        </li>
                      </>
                    )}
                    
                    {isGuest ? (
                      <li onClick={handleGuestLogout}>🚪 Exit Guest Mode</li>
                    ) : (
                      <li onClick={handleLogout}>🚪 Logout</li>
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

      {/* Location Status Notification */}
      {user && userLocation && !locationLoading && showLocationSuccess && (
        <div style={{
          backgroundColor: '#E8F5E9',
          padding: '10px 20px',
          margin: '10px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          fontSize: '14px',
          color: '#2E7D32',
          border: '1px solid #A5D6A7',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📍</span>
            <span>Salons are sorted by distance from your current location</span>
          </div>
          <button
            onClick={() => setShowLocationSuccess(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2E7D32',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 5px'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {user && locationError && (
        <div style={{
          backgroundColor: '#FFF3E0',
          padding: '10px 20px',
          margin: '10px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          color: '#E65100',
          border: '1px solid #FFB74D'
        }}>
          <span>⚠️</span>
          <span>{locationError}</span>
          <button 
            onClick={getUserLocation}
            style={{
              marginLeft: 'auto',
              padding: '5px 15px',
              backgroundColor: '#00AEEF',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Try Again
          </button>
        </div>
      )}

      <div className="search-bar">
        <div className="location-search">
          <input
            type="text"
            placeholder="Search location (e.g. Colombo)"
            className="location-input"
            value={query}
            onChange={handleLocationInputChange}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => setShowSuggestions(true)}
            disabled={manualNearbyMode}
          />
          {showSuggestions && query && !manualNearbyMode && (
            <ul className="suggestion-list">
              {districtSuggestions
                .filter((d) => d.toLowerCase().startsWith(query.toLowerCase()))
                .map((d) => (
                  <li key={d} onClick={() => {
                    setQuery(d);
                    setShowSuggestions(false);
                    if (manualNearbyMode) {
                      setManualNearbyMode(false);
                      setIsNearbyMode(false);
                      setNearbySalons([]);
                    }
                  }}>
                    {d}
                  </li>
                ))}
            </ul>
          )}
        </div>
        <button className="btn btn-nearby" onClick={openNearbyModal} disabled={modalOpen}>
          Find Nearest Salon
        </button>
        {manualNearbyMode && (
          <button className="btn btn-reset" onClick={resetNearbyFilter} title="Reset location filter">
            ✕ Reset Nearby Filter
          </button>
        )}
      </div>

      <div className="gender-switch-container">
        {[
          { type: "All", icon: "🌐" },
          { type: "Male", icon: "👨" },
          { type: "Female", icon: "👩" },
          { type: "Unisex", icon: "🧑‍🤝‍🧑" },
        ].map(({ type, icon }) => (
          <label
            key={type}
            className={`switch-option ${genderFilter === type ? "active" : ""}`}
            onClick={() => {
              setGenderFilter(type);
              // If "All" is selected, disable nearby mode to show all salons
              if (type === "All") {
                setIsNearbyMode(false);
                setManualNearbyMode(false);
              }
            }}
          >
            <span className="icon-label">{icon}</span> {type}
          </label>
        ))}
      </div>

      {genderFilter === "All" || !isNearbyMode ? (
        <>
          <h2 className="section-title">
            {genderFilter === "All" ? (userLocation ? "All Salons (Sorted by Distance)" : "All Salons in Database") : `${genderFilter} Salons`}
            {filteredSalons.length > 0 && (
              <span className="salon-count"> ({filteredSalons.length} found)</span>
            )}
            {locationLoading && <span style={{ fontSize: '14px', color: '#666', marginLeft: '10px' }}> (Getting your location...)</span>}
          </h2>
          <div className="salon-grid">
            {filteredSalons.length > 0 ? (
              filteredSalons.map((salon) => (
                <div className="salon-card" key={salon._id}>
                  <div className="salon-card-header">
                    <img src={salon.image || fallbackImage} alt={salon.name} className="salon-image" />
                    {user && !isGuest && (
                      <button 
                        className={`favorite-btn ${userFavorites.includes(salon._id) ? 'favorited' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(salon._id);
                        }}
                      >
                        {userFavorites.includes(salon._id) ? '❤️' : '🤍'}
                      </button>
                    )}
                  </div>
                  <div className="salon-info">
                    <h4>{salon.name}</h4>
                    <p>{getCityFromLocation(salon.location)}</p>
                    {salon.distanceRaw !== null && (
                      <p style={{ color: '#00AEEF', fontWeight: '500', fontSize: '14px' }}>
                        📍 {formatDistance(salon.distanceRaw)} away
                      </p>
                    )}
                    <p><strong>{salon.salonType}</strong> salon</p>
                    <p className="rating-stars">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={i < salon.avgRating ? "" : "empty-star"}
                        >
                          ★
                        </span>
                      ))}
                      <span> ({salon.avgRating})</span>
                    </p>
                    <button
                      className="select-btn"
                      onClick={() => navigate("/bookselectionpage", { state: { salon } })}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-salons-message">
                <p>No {genderFilter === "All" ? "" : genderFilter.toLowerCase()} salons found {query && `in ${query}`}</p>
                {genderFilter !== "All" && (
                  <button 
                    className="btn btn-reset"
                    onClick={() => setGenderFilter("All")}
                  >
                    Show All Salons
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <h2 className="section-title">
            Recommended Salons Near You
            {filteredSalons.length > 0 && (
              <span className="salon-count"> ({filteredSalons.length} found)</span>
            )}
          </h2>
          <div className="salon-grid">
            {filteredSalons.length > 0 ? (
              filteredSalons.map((salon) => (
                <div className="salon-card" key={salon._id}>
                  <div className="salon-card-header">
                    <img src={salon.image || fallbackImage} alt={salon.name} className="salon-image" />
                    {user && !isGuest && (
                      <button 
                        className={`favorite-btn ${userFavorites.includes(salon._id) ? 'favorited' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(salon._id);
                        }}
                      >
                        {userFavorites.includes(salon._id) ? '❤️' : '🤍'}
                      </button>
                    )}
                  </div>
                  <div className="salon-info">
                    <h4>{salon.name}</h4>
                    <p>{getCityFromLocation(salon.location)}</p>
                    {salon.distanceRaw !== null && (
                      <p style={{ color: '#00AEEF', fontWeight: '500', fontSize: '14px' }}>
                        📍 {formatDistance(salon.distanceRaw)} away
                      </p>
                    )}
                    <p><strong>{salon.salonType}</strong> salon</p>
                    <p className="rating-stars">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={i < salon.avgRating ? "" : "empty-star"}
                        >
                          ★
                        </span>
                      ))}
                      <span> ({salon.avgRating})</span>
                    </p>
                    <button className="select-btn" onClick={() =>
                      navigate(`/bookselectionpage`, { state: { salon } })
                    }>
                      Select
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-salons-message">
                <p>No {genderFilter === "All" ? "" : genderFilter.toLowerCase()} salons found near your location</p>
                {genderFilter !== "All" && (
                  <button 
                    className="btn btn-reset"
                    onClick={() => setGenderFilter("All")}
                  >
                    Show All Nearby Salons
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <LocationPickerModal
        isOpen={modalOpen}
        onClose={closeNearbyModal}
        onLocationSelect={handleLocationSelect}
      />

      {/* Location Permission Prompt Modal */}
      {showLocationPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📍</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
                Enable Location Services
              </h3>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                We'd like to show you salons near your location for a better experience. Your location data is only used to sort salons by distance.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <button
                onClick={() => {
                  setShowLocationPrompt(false);
                  getUserLocation();
                }}
                style={{
                  backgroundColor: '#00AEEF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Allow Location Access
              </button>
              <button
                onClick={() => setShowLocationPrompt(false)}
                style={{
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSalon;