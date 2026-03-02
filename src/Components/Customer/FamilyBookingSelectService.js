import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon, CheckCircleIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

import { API_URL, getServiceImageUrl, getSalonImageUrl } from "../../Utils/apiConfig";
import { UPLOADS_URL } from "../../config/api";

const API_BASE_URL = API_URL;

const FamilyBookingSelectService = () => {
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
          s.gender.toLowerCase() === 'unisex' ||
          s.gender.toLowerCase() === 'all'
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
    navigate(`/familybookingselectprofessional/${salon._id}`, {
      state: {
        salon,
        selectedServices,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12 fade-in slide-up">

        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 font-medium">
          <span className="text-dark-900 font-black cursor-pointer" onClick={() => navigate(-1)}>Services</span>
          <span>/</span>
          <span>Professional</span>
          <span>/</span>
          <span>Time</span>
          <span>/</span>
          <span>Confirm</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Main Content (Left) */}
          <div className="lg:col-span-8 flex flex-col">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 mb-2">Select Services</h1>
                <p className="text-gray-500">Choose the perfect services for your group.</p>
              </div>

              <div className="relative w-full md:w-72 mt-4 md:mt-0">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-dark-900 focus:border-transparent outline-none transition-all placeholder-gray-400 font-medium text-gray-900"
                />
              </div>
            </div>

            {/* Gender Switch Content */}
            {isUnisex && (
              <div className="flex p-1 bg-gray-100 rounded-xl w-full sm:w- fit mb-8 text-sm font-bold">
                <button
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg transition-all duration-300 ${selectedGender === "Male"
                    ? "bg-white text-dark-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setSelectedGender("Male")}
                >
                  <span className="flex items-center justify-center gap-2">👨‍🦱 Men</span>
                </button>
                <button
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg transition-all duration-300 ${selectedGender === "Female"
                    ? "bg-white text-dark-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                  onClick={() => setSelectedGender("Female")}
                >
                  <span className="flex items-center justify-center gap-2">👩‍🦰 Women</span>
                </button>
              </div>
            )}

            {/* Services List */}
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => {
                  const isSelected = selectedServiceIds.includes(service._id);
                  return (
                    <div
                      key={service._id}
                      onClick={() => toggleService(service._id)}
                      className={`group relative bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all duration-300 flex items-center gap-4 hover:-translate-y-1 ${isSelected
                        ? "border-dark-900 shadow-lg shadow-dark-900/10"
                        : "border-gray-100 hover:border-gray-300 hover:shadow-md"
                        }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-3 -right-3 bg-dark-900 rounded-full p-1 shadow-md">
                          <CheckCircleIcon className="w-5 h-5 text-white" />
                        </div>
                      )}

                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                        <img
                          src={service.image ? (service.image.startsWith("http") ? service.image : `${UPLOADS_URL}/${service.image.replace(/\\/g, '/').includes('/') ? service.image.replace(/\\/g, '/') : `services/${service.image}`}`) : "https://ui-avatars.com/api/?name=Service&background=random&size=100&color=fff"}
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.target.src = "https://ui-avatars.com/api/?name=Service&background=random&size=100&color=fff";
                          }}
                        />
                      </div>

                      <div className="flex-grow min-w-0 pr-2">
                        <h4 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">{service.name}</h4>
                        <div className="flex items-center gap-3 text-sm font-medium">
                          <span className="text-gray-500">{service.duration} mins</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-dark-900 font-bold">LKR {service.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center bg-white border-2 border-dashed border-gray-200 rounded-3xl">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No services found</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your search or switching categories.</p>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar / Summary (Right) */}
          <div className="lg:col-span-4 mt-8 lg:mt-0 relative">
            <div className="sticky top-28 bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">

              <div className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-6">
                <img
                  src={
                    salon?.image
                      ? salon.image.startsWith("http")
                        ? salon.image
                        : `${API_BASE_URL}/uploads/${salon.image}`
                      : "https://picsum.photos/150/150?random=10"
                  }
                  alt="Salon"
                  className="w-16 h-16 object-cover rounded-xl border border-gray-100 shadow-sm"
                />
                <div>
                  <h4 className="font-black text-gray-900 truncate">{salon?.name || "Salon"}</h4>
                  <p className="text-sm text-gray-500 truncate">{salon?.location || "Location"}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Selected Services</h3>

                {selectedServices.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-400 font-medium">No services selected yet</p>
                  </div>
                ) : (
                  <ul className="space-y-3 max-h-60 overflow-y-auto pr-2 hide-scrollbar">
                    {selectedServices.map((s) => (
                      <li key={s._id} className="flex justify-between items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-sm font-bold text-gray-900 pr-4">{s.name}</span>
                        <span className="text-sm font-black text-dark-900 shrink-0">LKR {s.price.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                <div className="flex justify-between items-end">
                  <span className="text-gray-500 font-bold">Total Estimated</span>
                  <span className="text-3xl font-black text-dark-900 tracking-tight">
                    {totalPrice === 0 ? "free" : `LKR ${totalPrice.toLocaleString()}`}
                  </span>
                </div>
              </div>

              <button
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${selectedServiceIds.length === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-dark-900 text-white hover:bg-black hover:shadow-xl hover:shadow-dark-900/20 hover:-translate-y-0.5"
                  }`}
                onClick={handleContinue}
                disabled={selectedServiceIds.length === 0}
              >
                <span>Continue</span>
                <ArrowRightIcon className="w-5 h-5" />
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FamilyBookingSelectService;
