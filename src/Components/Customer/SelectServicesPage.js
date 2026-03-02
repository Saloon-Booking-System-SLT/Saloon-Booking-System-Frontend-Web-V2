import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

import { API_URL, getServiceImageUrl, getSalonImageUrl } from "../../Utils/apiConfig";
import { UPLOADS_URL } from "../../config/api";

const API_BASE_URL = API_URL;

const SelectServicesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { salon } = location.state || {};

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState("Male");

  const isUnisex = salon?.salonType?.toLowerCase() === "unisex";

  useEffect(() => {
    if (!salon) return;
    fetch(`${API_BASE_URL}/api/services/${salon._id}`)
      .then((res) => res.json())
      .then((data) => {
        setServices(data);
        filterServices(data, searchQuery, selectedGender);
      })
      .catch((err) => {
        console.error("Failed to load services", err);
        alert("Failed to load services");
      });
  }, [salon]);

  useEffect(() => {
    filterServices(services, searchQuery, selectedGender);
  }, [searchQuery, selectedGender, services]);

  const filterServices = (all, search, gender) => {
    let result = all.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );

    if (isUnisex && gender) {
      result = result.filter(
        (s) =>
          !s.gender ||
          s.gender.toLowerCase() === gender.toLowerCase() ||
          s.gender.toLowerCase() === "unisex" ||
          s.gender.toLowerCase() === "all"
      );
    }

    setFilteredServices(result);
  };

  const toggleService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectedServices = services.filter((s) =>
    selectedServiceIds.includes(s._id)
  );

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const handleContinue = () => {
    if (selectedServices.length === 0) return alert("Please select a service");
    navigate(`/select-professional/${salon._id}`, {
      state: {
        salon,
        selectedServices,
      },
    });
  };

  const salonLocationText =
    typeof salon?.location === "string"
      ? salon.location
      : salon?.location?.district || "Unknown Location";

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Salon Selected</h2>
        <button
          onClick={() => navigate("/searchsalon")}
          className="px-6 py-3 bg-dark-900 text-white rounded-xl font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-28 lg:pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Salon mini-info on mobile header */}
          <div className="flex items-center gap-3 min-w-0">
            {salon?.image && (
              <img
                src={
                  salon.image.startsWith("http")
                    ? salon.image
                    : getSalonImageUrl(salon.image)
                }
                alt={salon.name}
                className="w-8 h-8 rounded-lg object-cover border border-gray-100 shrink-0"
              />
            )}
            <div className="min-w-0 hidden sm:block">
              <p className="text-sm font-bold text-gray-900 truncate">{salon.name}</p>
              <p className="text-xs text-gray-400 truncate">{salonLocationText}</p>
            </div>
            <p className="text-sm font-bold text-gray-900 truncate sm:hidden">{salon.name}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-500 hover:text-dark-900 transition-colors shrink-0 ml-4"
          >
            Cancel
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">

          {/* Main Content */}
          <div className="lg:col-span-8 flex flex-col">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-5 flex-wrap">
              <span className="text-dark-900 bg-gray-100 px-2.5 py-1 rounded-full text-xs">1. Services</span>
              <ChevronRightIcon className="w-3 h-3" />
              <span>2. Professional</span>
              <ChevronRightIcon className="w-3 h-3" />
              <span>3. Time</span>
              <ChevronRightIcon className="w-3 h-3" />
              <span>4. Confirm</span>
            </nav>

            <div className="mb-5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-1 tracking-tight">
                Select Services
              </h1>
              <p className="text-gray-500 text-sm sm:text-base">
                Choose treatments you'd like at{" "}
                <span className="font-semibold text-gray-700">{salon.name}</span>
              </p>
            </div>

            {/* Search + Gender Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for a service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-dark-900 focus:ring-2 focus:ring-dark-900/10 text-gray-900 text-sm shadow-sm transition-all outline-none"
                />
              </div>

              {isUnisex && (
                <div className="bg-gray-100 p-1 rounded-xl flex flex-shrink-0">
                  {["Male", "Female"].map((g) => (
                    <button
                      key={g}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${selectedGender === g
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                      onClick={() => setSelectedGender(g)}
                    >
                      {g === "Male" ? "Men" : "Women"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service Cards */}
            <div className="space-y-3">
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => {
                  const isSelected = selectedServiceIds.includes(service._id);
                  return (
                    <div
                      key={service._id}
                      onClick={() => toggleService(service._id)}
                      className={`group relative bg-white p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3 sm:gap-4 cursor-pointer transition-all duration-200 ${isSelected
                        ? "border-dark-900 ring-1 ring-dark-900 shadow-md"
                        : "border-gray-100 hover:border-gray-300 hover:shadow-md"
                        }`}
                    >
                      <img
                        src={service.image ? (service.image.startsWith("http") ? service.image : `${UPLOADS_URL}/${service.image.replace(/\\/g, '/').includes('/') ? service.image.replace(/\\/g, '/') : `services/${service.image}`}`) : "https://ui-avatars.com/api/?name=Service&background=random&size=100&color=fff"}
                      alt={service.name}
                      className="w-14 h-14 sm:w-18 sm:h-18 object-cover rounded-xl shrink-0 border border-gray-100"
                      onError={(e) => {
                        console.log(`❌ Failed to load image for ${service.name}:`, e.target.src);
                        e.target.src = "https://ui-avatars.com/api/?name=Service&background=random&size=100&color=fff";
                      }}
                      />

                      <div className="flex-grow min-w-0 pr-9">
                        <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5 truncate">
                          {service.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                          <ClockIcon className="w-3.5 h-3.5 shrink-0" />
                          {service.duration}
                        </div>
                        <p className="text-sm sm:text-base font-black text-primary-600">
                          LKR {service.price}
                        </p>
                      </div>

                      <div className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 shrink-0">
                        {isSelected ? (
                          <CheckCircleSolid className="w-6 h-6 sm:w-7 sm:h-7 text-dark-900" />
                        ) : (
                          <CheckCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-300 group-hover:text-gray-400" />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center bg-white border border-dashed border-gray-200 rounded-2xl">
                  <MagnifyingGlassIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No services found</h3>
                  <p className="text-gray-500 mb-5 text-sm max-w-xs mx-auto">
                    No services match "{searchQuery}".
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-4 relative">
            <div className="sticky top-28 bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col">

              {/* Salon Preview */}
              <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                <img
                  src={
                    salon?.image
                      ? salon.image.startsWith("http")
                        ? salon.image
                        : getSalonImageUrl(salon.image)
                      : "https://picsum.photos/100/100?random=8"
                  }
                  alt="Salon"
                  className="w-14 h-14 object-cover rounded-2xl border border-gray-100 shadow-sm shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-base font-black text-gray-900 truncate">{salon?.name}</h4>
                  <div className="flex items-center text-xs text-gray-500 gap-1 mt-0.5">
                    <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{salonLocationText}</span>
                  </div>
                </div>
              </div>

              {/* Selected Services List */}
              <div className="py-5 flex-grow overflow-y-auto max-h-[35vh] hide-scrollbar">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Selected Services
                </h5>
                {selectedServices.length === 0 ? (
                  <div className="py-6 text-center">
                    <CheckCircleIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No services selected yet</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {selectedServices.map((s) => (
                      <li key={s._id} className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.duration}</p>
                        </div>
                        <span className="text-sm font-bold text-gray-900 shrink-0">LKR {s.price}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Total + CTA */}
              <div className="pt-5 border-t border-gray-100">
                <div className="flex justify-between items-center mb-5">
                  <p className="text-sm font-bold text-gray-500">Total Due</p>
                  <p className="text-2xl font-black text-dark-900">
                    {totalPrice === 0 ? "—" : `LKR ${totalPrice}`}
                  </p>
                </div>
                <button
                  className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${selectedServiceIds.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-dark-900 text-white hover:bg-black hover:shadow-lg active:scale-[0.98]"
                    }`}
                  onClick={handleContinue}
                  disabled={selectedServiceIds.length === 0}
                >
                  Continue to Professionals <ChevronRightIcon className="w-5 h-5" />
                </button>
                <p className="text-center text-[11px] text-gray-400 mt-3">
                  You won't be charged yet
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile Sticky Bottom Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl px-4 pt-3 pb-5">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-400">
              {selectedServiceIds.length === 0
                ? "No service selected"
                : `${selectedServiceIds.length} service${selectedServiceIds.length > 1 ? "s" : ""} selected`}
            </p>
            <p className="text-lg font-black text-dark-900">
              {totalPrice === 0 ? "Select a service" : `LKR ${totalPrice}`}
            </p>
          </div>
          <button
            className={`shrink-0 px-5 py-3 rounded-xl font-bold flex items-center gap-1.5 text-sm transition-all ${selectedServiceIds.length === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-dark-900 text-white hover:bg-black active:scale-95"
              }`}
            onClick={handleContinue}
            disabled={selectedServiceIds.length === 0}
          >
            Continue <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectServicesPage;
