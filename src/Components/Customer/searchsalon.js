import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDaysIcon,
  UserCircleIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  Bars3Icon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import fallbackImage from "../../Assets/searchsalonimg.png";
import salonLogo from "../../Assets/salonlogo.png";
import LocationPickerModal from "./LocationPickerModal";

const API_BASE_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api$/, "")
  : "https://saloon-booking-system-backend-v2.onrender.com";

const districtSuggestions = [
  "Colombo",
  "Kandy",
  "Galle",
  "Jaffna",
  "Matara",
  "Kurunegala",
  "Anuradhapura",
  "Negombo",
  "Ratnapura",
  "Batticaloa",
  "Nuwara Eliya",
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
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserFavorites(data.favorites.map((salon) => salon._id));
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const toggleFavorite = async (salonId) => {
    try {
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
      const method = isFavorite ? "DELETE" : "POST";

      const res = await fetch(`${API_BASE_URL}/api/users/favorites/${salonId}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        if (isFavorite) {
          setUserFavorites(userFavorites.filter((id) => id !== salonId));
        } else {
          setUserFavorites([...userFavorites, salonId]);
        }
      } else {
        const error = await res.json();
        alert(error.message || "Error updating favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Error updating favorites");
    }
  };

  const matchesLocationQuery = (location, searchQuery) => {
    if (!searchQuery) return true;
    if (!location) return false;

    let locationStr = location;
    if (typeof location === "object") {
      locationStr = `${location.district || ""} ${location.address || ""}`;
    }

    return locationStr.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const applyFilters = (salons, locationQuery, gender) => {
    let filtered = salons;

    if (locationQuery) {
      filtered = filtered.filter((s) => matchesLocationQuery(s.location, locationQuery));
    }

    if (gender !== "All") {
      filtered = filtered.filter((s) => s.salonType === gender);
    }

    setFilteredSalons(filtered);
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

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
    badulla: { lat: 6.9934, lng: 81.055 },
    hambantota: { lat: 6.1429, lng: 81.1212 },
    kalutara: { lat: 6.5854, lng: 79.9607 },
    puttalam: { lat: 8.0362, lng: 79.8283 },
    monaragala: { lat: 6.8728, lng: 81.3507 },
    kegalle: { lat: 7.2513, lng: 80.3464 },
    matale: { lat: 7.4675, lng: 80.6234 },
    ampara: { lat: 7.2976, lng: 81.6728 },
    kilinochchi: { lat: 9.3967, lng: 80.4036 },
    mannar: { lat: 8.981, lng: 79.9044 },
    mullaitivu: { lat: 9.2671, lng: 80.8142 },
    vavuniya: { lat: 8.7542, lng: 80.4982 },
  };

  const getSalonCoordinates = (salon) => {
    if (salon.coordinates && salon.coordinates.lat && salon.coordinates.lng) {
      return salon.coordinates;
    }

    let salonLocation = "";
    if (typeof salon.location === "string") {
      salonLocation = salon.location.toLowerCase();
    } else if (typeof salon.location === "object" && salon.location) {
      salonLocation = `${salon.location.district || ""} ${salon.location.address || ""}`.toLowerCase();
    }

    for (const district in districtCoordinates) {
      if (salonLocation.includes(district)) {
        return districtCoordinates[district];
      }
    }

    return null;
  };

  const formatDistance = (distanceInKm) => {
    if (distanceInKm === null || distanceInKm === undefined) return "";
    if (distanceInKm < 1) {
      return `${Math.round(distanceInKm * 1000)} m`;
    }
    return `${distanceInKm.toFixed(1)} km`;
  };

  const sortSalonsByDistance = useCallback((salons, userLat, userLng) => {
    if (!userLat || !userLng) return salons;

    const salonsWithDistance = salons.map((salon) => {
      const salonCoords = getSalonCoordinates(salon);

      if (salonCoords) {
        const distance = calculateDistance(
          userLat,
          userLng,
          salonCoords.lat,
          salonCoords.lng
        );
        return {
          ...salon,
          distance: distance.toFixed(1),
          distanceRaw: distance,
        };
      }

      return {
        ...salon,
        distance: null,
        distanceRaw: null,
      };
    });

    return salonsWithDistance.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return parseFloat(a.distance) - parseFloat(b.distance);
    });
  }, []);

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
        setTimeout(() => setShowLocationSuccess(false), 5000);
        console.log("User location obtained:", { latitude, longitude });
      },
      (error) => {
        setLocationLoading(false);

        let errorMessage = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location permissions.";
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
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const fetchSalons = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/salons/with-ratings`);
      const salonsWithRatings = await res.json();

      let sortedSalons = salonsWithRatings;
      if (userLocation && userLocation.lat && userLocation.lng) {
        sortedSalons = sortSalonsByDistance(
          salonsWithRatings,
          userLocation.lat,
          userLocation.lng
        );
        console.log("Salons sorted by distance from user location");
      }

      setAllSalons(sortedSalons);

      if (!isNearbyMode) {
        applyFilters(sortedSalons, query, genderFilter);
      }
    } catch (err) {
      console.error("Failed to load salons", err);
      alert("Failed to load salons");
    }
  }, [query, genderFilter, isNearbyMode, userLocation, sortSalonsByDistance]);

  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("hasVisitedSalonApp");

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsGuest(false);
      fetchUserFavorites();

      if (!hasVisitedBefore) {
        setShowLocationPrompt(true);
        localStorage.setItem("hasVisitedSalonApp", "true");
      } else {
        getUserLocation();
      }
    }

    const guestUser = localStorage.getItem("guestUser");
    if (guestUser) {
      const guestData = JSON.parse(guestUser);
      setUser(guestData);
      setIsGuest(true);

      if (!hasVisitedBefore) {
        setShowLocationPrompt(true);
        localStorage.setItem("hasVisitedSalonApp", "true");
      } else {
        getUserLocation();
      }
    }
  }, [getUserLocation]);

  useEffect(() => {
    fetchSalons();
  }, [fetchSalons]);

  useEffect(() => {
    if (genderFilter === "All") {
      let filtered = allSalons;

      if (query) {
        filtered = filtered.filter((s) => matchesLocationQuery(s.location, query));
      }

      if (userLocation && userLocation.lat && userLocation.lng) {
        filtered = sortSalonsByDistance(
          filtered,
          userLocation.lat,
          userLocation.lng
        );
      }

      setFilteredSalons(filtered);
      setIsNearbyMode(false);
      setManualNearbyMode(false);
    } else if (isNearbyMode) {
      let filtered = nearbySalons;
      filtered = filtered.filter((s) => s.salonType === genderFilter);
      setFilteredSalons(filtered);
    } else {
      let filtered = allSalons;

      if (query) {
        filtered = filtered.filter((s) => matchesLocationQuery(s.location, query));
      }

      filtered = filtered.filter((s) => s.salonType === genderFilter);

      if (userLocation && userLocation.lat && userLocation.lng) {
        filtered = sortSalonsByDistance(
          filtered,
          userLocation.lat,
          userLocation.lng
        );
      }

      setFilteredSalons(filtered);
    }
  }, [
    genderFilter,
    query,
    allSalons,
    nearbySalons,
    isNearbyMode,
    userLocation,
    sortSalonsByDistance,
  ]);

  const fetchNearbySalons = async (lat, lng, manual = false) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/salons/nearby?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error("Failed to load nearby salons");

      const data = await res.json();

      const nearbyWithRatings = await Promise.all(
        data.map(async (salon) => {
          try {
            const profRes = await fetch(`${API_BASE_URL}/api/professionals/${salon._id}`);
            const professionals = await profRes.json();

            const allFeedbacks = await Promise.all(
              professionals.map(async (pro) => {
                const fbRes = await fetch(
                  `${API_BASE_URL}/api/feedback/professionals/${pro._id}`
                );
                const fbData = await fbRes.json();
                return fbData.feedbacks || [];
              })
            );

            const flatFeedbacks = allFeedbacks.flat();
            const avgRating = flatFeedbacks.length
              ? flatFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) /
              flatFeedbacks.length
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

  const getCityFromLocation = (location) => {
    if (!location) return "";

    const districts = [
      "Colombo",
      "Kandy",
      "Galle",
      "Matara",
      "Kurunegala",
      "Gampaha",
      "Jaffna",
      "Anuradhapura",
      "Polonnaruwa",
      "Batticaloa",
      "Trincomalee",
      "Ratnapura",
      "Badulla",
      "Nuwara Eliya",
      "Hambantota",
      "Kalutara",
      "Puttalam",
      "Monaragala",
      "Kegalle",
      "Matale",
      "Ampara",
      "Kilinochchi",
      "Mannar",
      "Mullaitivu",
      "Vavuniya",
    ];

    let locationStr = location;
    if (typeof location === "object") {
      locationStr = location.district || location.address || "";
    }

    const found = districts.find((d) =>
      locationStr.toLowerCase().includes(d.toLowerCase())
    );

    return found || "Unknown";
  };

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
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col pt-20">

      {/* Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-100 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">

          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 bg-dark-900 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <img src={salonLogo} alt="Salon Logo" className="w-6 h-6 object-contain filter brightness-0 invert" />
            </div>
            <span className="text-xl font-heading font-bold text-dark-900 tracking-tight">SalonPro</span>
          </div>

          {/* Nav Icons / Profile */}
          <nav className="flex items-center gap-4 relative">
            {!user ? (
              <>
                <button className="hidden sm:inline-flex px-5 py-2 text-sm font-medium text-gray-700 hover:text-dark-900 transition-colors" onClick={() => navigate("/login")}>
                  Log In
                </button>
                <button
                  className="p-2.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors"
                  onClick={toggleMenu}
                >
                  <Bars3Icon className="w-5 h-5" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-xl p-2 z-50 border border-gray-100 fade-in slide-up">
                    <ul className="flex flex-col">
                      <li className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">For Customers</li>
                      <li className="px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" onClick={() => navigate("/login")}>Login or Sign Up</li>
                      <li className="px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">Download the App</li>
                      <li className="px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">Help & Support</li>
                      <li className="border-t border-gray-100 my-2"></li>
                      <li
                        onClick={() => navigate("/OwnerLogin")}
                        className="px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                      >
                        For Business <ArrowRightOnRectangleIcon className="w-4 h-4 ml-2" />
                      </li>
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="relative flex items-center gap-3">
                <button
                  className="flex items-center justify-center rounded-full overflow-hidden border-2 border-transparent hover:border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-dark-900"
                  onClick={toggleMenu}
                >
                  {isGuest ? (
                    <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-500">
                      <UserCircleIcon className="w-7 h-7" />
                    </div>
                  ) : (
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                      alt="Profile"
                      className="w-10 h-10 object-cover bg-gray-100"
                    />
                  )}
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-xl p-2 z-50 border border-gray-100 fade-in slide-up">
                      <div className="px-4 py-4 border-b border-gray-100 mb-2 bg-gray-50/50 rounded-t-xl flex flex-col items-start">
                        <span className="text-sm font-bold text-gray-900 truncate w-full">
                          {isGuest ? "Guest User" : user.name}
                        </span>
                        {isGuest && <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600">Guest</span>}
                      </div>

                      <ul className="flex flex-col gap-1">
                        {!isGuest && (
                          <>
                            <li className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-dark-900 rounded-lg cursor-pointer transition-colors flex items-center gap-3" onClick={handleNavigateToProfile}>
                              <UserIcon className="h-4 w-4" /> Profile
                            </li>
                            <li className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-dark-900 rounded-lg cursor-pointer transition-colors flex items-center gap-3" onClick={handleNavigateToAppointments}>
                              <CalendarDaysIcon className="h-4 w-4" /> Appointments
                            </li>
                          </>
                        )}

                        <li
                          className="px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors flex items-center gap-3"
                          onClick={isGuest ? handleGuestLogout : handleLogout}
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          {isGuest ? "Exit Guest Mode" : "Logout"}
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 items-start">

        {/* Alerts / Info Banners */}
        {user && userLocation && !locationLoading && showLocationSuccess && (
          <div className="mb-6 fade-in flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 text-sm font-medium">
              <MapPinIcon className="w-5 h-5 text-emerald-600" />
              Salons are sorted by distance from your current location
            </div>
            <button onClick={() => setShowLocationSuccess(false)} className="text-emerald-500 hover:text-emerald-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {user && locationError && (
          <div className="mb-6 fade-in flex items-center justify-between bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 text-sm font-medium">
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {locationError}
            </div>
            <button
              onClick={getUserLocation}
              className="text-xs font-bold bg-white border border-orange-200 text-orange-700 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Search Header Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between">

          <div className="w-full md:flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by city, district or area (e.g. Colombo)"
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-dark-900 focus:ring-2 focus:ring-dark-900/20 text-gray-900 text-base shadow-inner transition-all outline-none"
              value={query}
              onChange={handleLocationInputChange}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => setShowSuggestions(true)}
              disabled={manualNearbyMode}
            />
            {showSuggestions && query && !manualNearbyMode && (
              <ul className="absolute z-30 w-full bg-white mt-1 border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1">
                {districtSuggestions
                  .filter((d) => d.toLowerCase().startsWith(query.toLowerCase()))
                  .map((d) => (
                    <li
                      key={d}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 flex items-center"
                      onClick={() => {
                        setQuery(d);
                        setShowSuggestions(false);
                        if (manualNearbyMode) {
                          setManualNearbyMode(false);
                          setIsNearbyMode(false);
                          setNearbySalons([]);
                        }
                      }}
                    >
                      <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                      {d}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              className="px-6 py-4 bg-dark-900 text-white font-bold rounded-2xl hover:bg-black shadow-md shadow-dark-900/20 transition-all flex items-center justify-center gap-2 outline-none disabled:opacity-50"
              onClick={openNearbyModal}
              disabled={modalOpen}
            >
              <MapPinIcon className="w-5 h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">Find Nearest</span>
            </button>

            {manualNearbyMode && (
              <button
                className="px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 outline-none whitespace-nowrap"
                onClick={resetNearbyFilter}
              >
                Clear Filter
              </button>
            )}
          </div>

        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-heading font-black text-gray-900 flex items-center gap-3">
            {genderFilter === "All"
              ? isNearbyMode
                ? "Recommended Salons Near You"
                : userLocation
                  ? "Salons (Sorted by Distance)"
                  : "Discover Salons"
              : `${genderFilter} Salons`}
            {filteredSalons.length > 0 && (
              <span className="text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {filteredSalons.length}
              </span>
            )}
            {locationLoading && (
              <span className="text-sm font-normal text-primary-500 animate-pulse">Locating...</span>
            )}
          </h2>

          <div className="bg-gray-100/80 p-1.5 rounded-2xl inline-flex flex-wrap shadow-inner overflow-x-auto max-w-full hide-scrollbar border border-gray-200/50">
            {[
              { type: "All", icon: "🌐" },
              { type: "Male", icon: "👨" },
              { type: "Female", icon: "👩" },
              { type: "Unisex", icon: "🧑‍🤝‍🧑" },
            ].map(({ type, icon }) => (
              <button
                key={type}
                className={`flex-1 min-w-[80px] sm:min-w-0 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 focus:outline-none flex items-center justify-center gap-2 whitespace-nowrap ${genderFilter === type
                  ? "bg-white text-gray-900 shadow-sm border border-gray-100/80 ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                  }`}
                onClick={() => {
                  setGenderFilter(type);
                  if (type === "All") {
                    setIsNearbyMode(false);
                    setManualNearbyMode(false);
                  }
                }}
              >
                <span className="opacity-80">{icon}</span> {type}
              </button>
            ))}
          </div>
        </div>

        {/* Salon Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {filteredSalons.length > 0 ? (
            filteredSalons.map((salon) => (
              <div
                className="group flex flex-col bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-dark-900/10 transition-all duration-300 transform hover:-translate-y-1"
                key={salon._id}
              >
                {/* Card Header/Image */}
                <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-gray-100">
                  <img
                    src={salon.image || fallbackImage}
                    alt={salon.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                  {user && !isGuest && (
                    <button
                      className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all shadow-sm focus:outline-none ${userFavorites.includes(salon._id)
                        ? "bg-white text-red-500 shadow-red-500/20"
                        : "bg-black/30 text-white hover:bg-white hover:text-gray-900"
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(salon._id);
                      }}
                    >
                      {userFavorites.includes(salon._id) ? <HeartIconSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                    </button>
                  )}

                  {/* Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-bold text-gray-900 uppercase tracking-widest rounded-full shadow-sm">
                      {salon.salonType}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-primary-600 transition-colors line-clamp-1">{salon.name}</h4>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                      <StarIconSolid className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-amber-700">{salon.avgRating || "New"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3 line-clamp-1">
                    <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{getCityFromLocation(salon.location)}</span>
                  </div>

                  {salon.distanceRaw !== null && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 self-start px-2 py-1 rounded-md mb-4 border border-primary-100">
                      <span>📍</span> {formatDistance(salon.distanceRaw)} away
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <button
                      className="w-full py-3 bg-gray-50 text-dark-900 font-bold rounded-xl border border-gray-200 hover:bg-dark-900 hover:text-white hover:border-dark-900 transition-all duration-300"
                      onClick={() => navigate("/bookselectionpage", { state: { salon } })}
                    >
                      Select Salon
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <MagnifyingGlassIcon className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No salons found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                We couldn't find any {genderFilter === "All" ? "" : genderFilter.toLowerCase()} salons
                matching your criteria {query && `in "${query}"`}.
              </p>
              {genderFilter !== "All" && (
                <button
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors"
                  onClick={() => setGenderFilter("All")}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <LocationPickerModal
        isOpen={modalOpen}
        onClose={closeNearbyModal}
        onLocationSelect={handleLocationSelect}
      />

      {/* Location Permission Modal */}
      {showLocationPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={() => setShowLocationPrompt(false)}></div>

          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative z-10 fade-in slide-up text-center">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPinIcon className="w-10 h-10 text-primary-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Enable Location
            </h3>
            <p className="text-gray-500 mb-8 leading-relaxed text-sm">
              We'll use your location just to show you the best salons nearby.
              Find the perfect place, closer to you.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowLocationPrompt(false);
                  getUserLocation();
                }}
                className="w-full py-3.5 bg-dark-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-all"
              >
                Allow Access
              </button>

              <button
                onClick={() => setShowLocationPrompt(false)}
                className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all"
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