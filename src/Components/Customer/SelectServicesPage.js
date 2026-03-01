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

const API_BASE_URL = process.env.REACT_APP_API_URL ?
  process.env.REACT_APP_API_URL.replace(/\/api$/, '') :
  "";

const SelectServicesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { salon } = location.state || {};

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState("Male");

  // updated based on backend schema
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

    if (isUnisex) {
      result = result.filter(
        (s) => s.gender?.toLowerCase() === gender.toLowerCase()
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

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Salon Selected</h2>
        <button
          onClick={() => navigate('/searchsalon')}
          className="px-6 py-3 bg-dark-900 text-white rounded-xl font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-24">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="text-2xl font-black text-dark-900 tracking-tighter">SalonPro</div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-500 hover:text-dark-900 transition-colors"
          >
            Cancel Booking
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Main Content (Left) */}
          <div className="lg:col-span-8 flex flex-col">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-8">
              <span className="text-dark-900 bg-gray-100 px-3 py-1 rounded-full">1. Services</span>
              <ChevronRightIcon className="w-4 h-4" />
              <span>2. Professional</span>
              <ChevronRightIcon className="w-4 h-4" />
              <span>3. Time</span>
              <ChevronRightIcon className="w-4 h-4" />
              <span>4. Confirm</span>
            </nav>

            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">Select Services</h1>
              <p className="text-gray-500 text-base">Choose the treatments you'd like to book at {salon.name}</p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for a service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:bg-white focus:border-dark-900 focus:ring-2 focus:ring-dark-900/10 text-gray-900 text-sm shadow-sm transition-all outline-none"
                />
              </div>

              {/* Gender Switch for Unisex salons */}
              {isUnisex && (
                <div className="bg-gray-100 p-1 rounded-2xl flex flex-shrink-0">
                  <button
                    className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${selectedGender === "Male"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => setSelectedGender("Male")}
                  >
                    Men
                  </button>
                  <button
                    className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${selectedGender === "Female"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                    onClick={() => setSelectedGender("Female")}
                  >
                    Women
                  </button>
                </div>
              )}
            </div>

            {/* Services List */}
            <div className="space-y-4">
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => {
                  const isSelected = selectedServiceIds.includes(service._id);
                  return (
                    <div
                      key={service._id}
                      onClick={() => toggleService(service._id)}
                      className={`group relative bg-white p-4 sm:p-5 rounded-[1.5rem] border flex items-center gap-5 cursor-pointer transition-all duration-300 ${isSelected
                          ? "border-dark-900 ring-1 ring-dark-900 shadow-md bg-gray-50/50"
                          : "border-gray-100 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50"
                        }`}
                    >
                      <img
                        src={
                          service.image
                            ? service.image.startsWith("http")
                              ? service.image
                              : `${API_BASE_URL}/uploads/${service.image}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(service.name)}&background=random&color=fff&size=120`
                        }
                        alt={service.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl shrink-0 border border-gray-100"
                      />

                      <div className="flex-grow min-w-0 pr-10">
                        <h4 className="text-lg font-bold text-gray-900 mb-1 truncate">{service.name}</h4>

                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" /> {service.duration}
                          </span>
                        </div>

                        <p className="text-[17px] font-black text-primary-600">LKR {service.price}</p>
                      </div>

                      <div className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 shrink-0">
                        {isSelected ? (
                          <CheckCircleSolid className="w-8 h-8 text-dark-900 scale-110 transition-transform" />
                        ) : (
                          <CheckCircleIcon className="w-8 h-8 text-gray-300 group-hover:text-gray-400 transition-colors" />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center bg-white border border-dashed border-gray-200 rounded-[2rem]">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex flex-col items-center justify-center mx-auto mb-4">
                    <MagnifyingGlassIcon className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No services found</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    We couldn't track down any specific services matching "{searchQuery}".
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Summary (Right) */}
          <div className="lg:col-span-4 mt-8 lg:mt-0 relative">
            <div className="sticky top-28 bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col h-fit">

              {/* Salon Preview */}
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                <img
                  src={
                    salon?.image
                      ? salon.image.startsWith("http")
                        ? salon.image
                        : `${API_BASE_URL}/uploads/${salon.image}`
                      : "https://picsum.photos/100/100?random=8"
                  }
                  alt="Salon"
                  className="w-16 h-16 object-cover rounded-2xl border border-gray-100 shadow-sm"
                />
                <div className="flex flex-col min-w-0">
                  <h4 className="text-lg font-black text-gray-900 truncate">{salon?.name}</h4>
                  <div className="flex items-center text-sm text-gray-500 gap-1 truncate mt-0.5">
                    <MapPinIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{salon?.location}</span>
                  </div>
                </div>
              </div>

              {/* Selections breakdown */}
              <div className="py-6 flex-grow overflow-y-auto max-h-[40vh] hide-scrollbar">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Selected Services</h5>

                {selectedServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                      <CheckCircleIcon className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No services selected yet</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {selectedServices.map((s) => (
                      <li key={s._id} className="flex justify-between items-start gap-4 fade-in">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">{s.name}</span>
                          <span className="text-xs font-medium text-gray-500">{s.duration}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 shrink-0 mt-0.5">LKR {s.price}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Total & Action */}
              <div className="pt-6 border-t border-gray-100 mt-auto">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-base font-bold text-gray-600">Total Due</p>
                  <p className="text-2xl font-black text-dark-900">
                    {totalPrice === 0 ? "Free" : `LKR ${totalPrice}`}
                  </p>
                </div>

                <button
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${selectedServiceIds.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-dark-900 text-white hover:bg-black hover:shadow-lg hover:shadow-dark-900/20 active:scale-[0.98]"
                    }`}
                  onClick={handleContinue}
                  disabled={selectedServiceIds.length === 0}
                >
                  Continue to Professionals <ChevronRightIcon className="w-5 h-5" />
                </button>
                <div className="text-center mt-4">
                  <p className="text-[11px] font-medium text-gray-400">You won't be charged yet</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SelectServicesPage;
