import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapPinIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  StarIcon as StarIconOutline,
  XMarkIcon,
  ChevronLeftIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleSolid,
  StarIcon as StarIconSolid
} from "@heroicons/react/24/solid";

const API_BASE_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api$/, "")
  : "";

const SelectProfessionalPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { salon, selectedServices } = location.state || {};

  const [professionals, setProfessionals] = useState([]);
  const [serviceProfessionals, setServiceProfessionals] = useState({});
  const [reviews, setReviews] = useState({});
  const [viewReviewsPro, setViewReviewsPro] = useState(null);
  const [selectedProReviews, setSelectedProReviews] = useState([]);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);

  // Get current service
  const currentService = selectedServices?.[currentServiceIndex] || {};

  useEffect(() => {
    if (!salon?._id) return;

    fetch(`${API_BASE_URL}/api/professionals/${salon._id}/with-ratings`)
      .then((res) => res.json())
      .then((data) => {
        setProfessionals(data);

        // Build reviews object from the data
        const reviewsObj = {};
        data.forEach(pro => {
          reviewsObj[pro._id] = pro.feedbacks || [];
        });
        setReviews(reviewsObj);
      })
      .catch((err) => console.error("Failed to fetch professionals", err));
  }, [salon]);

  const getAverageRating = (proId) => {
    const feedbacks = reviews[proId] || [];
    if (!feedbacks.length) return 0;
    const total = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
    return (total / feedbacks.length).toFixed(1);
  };

  const openReviewPopup = async (pro) => {
    setViewReviewsPro(pro);
    try {
      const res = await fetch(`${API_BASE_URL}/api/feedback/professionals/${pro._id}`);
      const data = await res.json();
      setSelectedProReviews(data.feedbacks || []);
    } catch (e) {
      console.error("Failed to load reviews", e);
    }
  };

  const closeReviewPopup = () => {
    setViewReviewsPro(null);
    setSelectedProReviews([]);
  };

  const totalPrice = selectedServices?.reduce((acc, s) => acc + s.price, 0) || 0;

  // Handle selecting professional for a service
  const handleSelectProfessional = (professional) => {
    const newServiceProfessionals = {
      ...serviceProfessionals,
      [currentService._id]: professional
    };
    setServiceProfessionals(newServiceProfessionals);

    // Auto-advance to next service if available and not manually clicking
    if (currentServiceIndex < selectedServices.length - 1) {
      setTimeout(() => {
        setCurrentServiceIndex(currentServiceIndex + 1);
      }, 400); // slight delay for smooth transition
    }
  };

  // Handle selecting "Any Professional"
  const handleSelectAnyProfessional = () => {
    const anyProfessional = {
      _id: "any",
      name: "Any Professional",
      role: "Any available professional"
    };
    handleSelectProfessional(anyProfessional);
  };

  // Navigate back to previous service
  const handleBackToPreviousService = () => {
    if (currentServiceIndex > 0) {
      setCurrentServiceIndex(currentServiceIndex - 1);
    }
  };

  // Get selected professional for current service
  const getSelectedProfessionalForService = () => {
    return serviceProfessionals[currentService._id];
  };

  // Check if all services have a professional selected
  const allServicesHaveProfessionals = () => {
    return selectedServices.every(service => serviceProfessionals[service._id]);
  };

  const handleContinue = () => {
    if (!allServicesHaveProfessionals()) {
      alert("Please select a professional for each service");
      return;
    }

    const professionalData = {};
    selectedServices.forEach(service => {
      professionalData[service._id] = serviceProfessionals[service._id];
    });

    navigate("/select-time", {
      state: {
        selectedServices,
        selectedProfessional: professionalData,
        salon,
        serviceProfessionals: professionalData
      },
    });
  };

  if (!selectedServices || selectedServices.length === 0) {
    navigate("/searchsalon");
    return null;
  }

  const selectedCount = Object.keys(serviceProfessionals).length;
  const totalServices = selectedServices.length;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-24 relative">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate("/")}
          >

          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-500 hover:text-dark-900 transition-colors"
          >
            Back to Services
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Main Content (Left) */}
          <div className="lg:col-span-8 flex flex-col">

            {/* Breadcrumb */}
            <nav className="flex items-center flex-wrap gap-2 text-sm font-bold text-gray-400 mb-8">
              <span className="text-dark-900 cursor-pointer hover:underline" onClick={() => navigate(-1)}>1. Services</span>
              <ChevronRightIcon className="w-4 h-4 text-gray-300" />
              <span className="text-dark-900 bg-gray-100 px-3 py-1 rounded-full">2. Professional</span>
              <ChevronRightIcon className="w-4 h-4 text-gray-300" />
              <span className="opacity-60">3. Time</span>
              <ChevronRightIcon className="w-4 h-4 text-gray-300" />
              <span className="opacity-60">4. Confirm</span>
            </nav>

            <div className="mb-4">
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">Select a Professional</h1>
              <p className="text-gray-500 text-base">Who would you like to perform your service?</p>
            </div>

            {/* Service progress indicator for multiple services */}
            {totalServices > 1 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-8">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm font-bold text-primary-600 mb-1 uppercase tracking-wide">
                      Service {currentServiceIndex + 1} of {totalServices}
                    </p>
                    <h3 className="text-xl font-bold text-gray-900">{currentService.name}</h3>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleBackToPreviousService}
                      disabled={currentServiceIndex === 0}
                      className="p-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (currentServiceIndex < totalServices - 1) {
                          setCurrentServiceIndex(currentServiceIndex + 1);
                        }
                      }}
                      disabled={currentServiceIndex === totalServices - 1}
                      className="p-2 rounded-full bg-gray-50 border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex gap-1">
                  {selectedServices.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-full flex-1 rounded-full transition-all duration-500 ${idx === currentServiceIndex ? "bg-primary-500" :
                        idx < currentServiceIndex || serviceProfessionals[selectedServices[idx]._id] ? "bg-primary-200" : "bg-gray-200"
                        }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* List of professionals */}
            <div className="space-y-4">
              {/* Any Professional option */}
              <div
                className={`group relative bg-white p-4 sm:p-5 rounded-[1.5rem] border flex items-center gap-5 cursor-pointer transition-all duration-300 ${getSelectedProfessionalForService()?._id === "any"
                  ? "border-dark-900 ring-1 ring-dark-900 shadow-md bg-gray-50/50"
                  : "border-gray-100 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50"
                  }`}
                onClick={handleSelectAnyProfessional}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0 border border-gray-200">
                  <UserGroupIcon className="w-8 h-8 text-gray-400" />
                </div>

                <div className="flex-grow min-w-0 pr-10">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">Any Professional</h4>
                  <p className="text-sm text-gray-500">Pick the first available person for this service</p>
                </div>

                <div className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 shrink-0">
                  {getSelectedProfessionalForService()?._id === "any" ? (
                    <CheckCircleSolid className="w-8 h-8 text-dark-900 scale-110 transition-transform" />
                  ) : (
                    <CheckCircleIcon className="w-8 h-8 text-gray-300 group-hover:text-gray-400 transition-colors" />
                  )}
                </div>
              </div>

              {/* Individual Professionals */}
              {professionals.map((pro) => {
                const proReviews = reviews[pro._id] || [];
                const avgRating = getAverageRating(pro._id);
                const reviewCount = proReviews.length;
                const isSelected = getSelectedProfessionalForService()?._id === pro._id;

                return (
                  <div
                    key={pro._id}
                    onClick={() => handleSelectProfessional(pro)}
                    className={`group relative bg-white p-4 sm:p-5 rounded-[1.5rem] border flex items-center gap-5 cursor-pointer transition-all duration-300 ${isSelected
                      ? "border-dark-900 ring-1 ring-dark-900 shadow-md bg-gray-50/50"
                      : "border-gray-100 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50"
                      }`}
                  >
                    <img
                      src={
                        pro.image
                          ? pro.image.length > 200
                            ? `data:image/jpeg;base64,${pro.image}`
                            : pro.image.startsWith("http") || pro.image.startsWith("data:image")
                              ? pro.image
                              : `${API_BASE_URL}/uploads/professionals/${pro.image}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}&background=random&color=fff&size=120`
                      }
                      alt={pro.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl shrink-0 border border-gray-100"
                    />

                    <div className="flex-grow min-w-0 pr-24 sm:pr-32">
                      <h4 className="text-lg font-bold text-gray-900 mb-0.5 truncate">{pro.name}</h4>
                      <p className="text-sm text-gray-500 mb-2 truncate">{pro.role || "Stylist"}</p>

                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        {reviewCount > 0 ? (
                          <>
                            <StarIconSolid className="w-4 h-4 text-amber-400" />
                            <span className="text-gray-900">{avgRating}</span>
                            <span className="text-gray-400">({reviewCount} reviews)</span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs uppercase tracking-wider font-bold">New</span>
                        )}
                      </div>
                    </div>

                    <div className="absolute right-16 sm:right-20 top-1/2 -translate-y-1/2">
                      <button
                        className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 transition-colors z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          openReviewPopup(pro);
                        }}
                      >
                        Reviews
                      </button>
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
              })}
            </div>

            {/* Display multiple service summary on left for mobile/tablet */}
            {totalServices > 1 && (
              <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-5 lg:hidden">
                <h4 className="font-bold text-gray-900 mb-4">Your Selections</h4>
                <div className="space-y-3">
                  {selectedServices.map((service, index) => (
                    <div key={service._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                      <span className="text-sm font-bold text-gray-700 line-clamp-1">{service.name}</span>
                      <span className="text-xs font-bold px-2 py-1 bg-white border border-gray-200 rounded-md text-gray-900 shrink-0">
                        {serviceProfessionals[service._id]?.name || "Not selected"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar / Summary (Right) */}
          <div className="lg:col-span-4 mt-8 lg:mt-0 relative">
            <div className="sticky top-28 bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col h-fit">

              {/* Salon Preview */}
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-6">
                <img
                  src={
                    salon?.image
                      ? salon.image.startsWith("http")
                        ? salon.image
                        : `${API_BASE_URL}/uploads/${salon.image}`
                      : "https://picsum.photos/100/100?random=8"
                  }
                  alt="Salon"
                  className="w-16 h-16 object-cover rounded-2xl border border-gray-100 shadow-sm shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <h4 className="text-base font-black text-gray-900 truncate">{salon?.name}</h4>
                  <div className="flex items-center text-xs text-gray-500 gap-1 truncate mt-0.5">
                    <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{salon?.location}</span>
                  </div>
                </div>
              </div>

              {/* Current Service Highlight (if multiple) */}
              {totalServices > 1 && (
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-100 mb-6">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-1">Current Service</h5>
                  <p className="font-bold text-primary-900 truncate">{currentService.name}</p>
                  <p className="text-sm text-primary-700 mt-1">{currentService.duration} • <span className="font-bold">LKR {currentService.price}</span></p>
                </div>
              )}

              {/* Services Summary */}
              <div className="flex-grow overflow-y-auto max-h-[40vh] hide-scrollbar mb-6">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  All Services ({totalServices})
                </h5>

                <ul className="space-y-4">
                  {selectedServices.map((s, index) => {
                    const proName = serviceProfessionals[s._id]?.name;
                    return (
                      <li key={index} className="flex flex-col gap-1 fade-in bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm font-bold text-gray-800 line-clamp-1">{s.name}</span>
                          <span className="text-sm font-bold text-gray-900 shrink-0">LKR {s.price}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs font-medium text-gray-500">{s.duration}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${proName ? "bg-dark-900 text-white" : "bg-gray-200 text-gray-500"
                            }`}>
                            {proName || "Select pro 👀"}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Total & Action */}
              <div className="pt-6 border-t border-gray-100 mt-auto">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-base font-bold text-gray-600">Total Due</p>
                  <p className="text-2xl font-black text-dark-900">
                    LKR {totalPrice}
                  </p>
                </div>

                <button
                  className={`w-full py-4 rounded-xl font-bold flex flex-col items-center justify-center transition-all duration-300 ${!allServicesHaveProfessionals()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-dark-900 text-white hover:bg-black hover:shadow-lg hover:shadow-dark-900/20 active:scale-[0.98]"
                    }`}
                  onClick={handleContinue}
                  disabled={!allServicesHaveProfessionals()}
                >
                  <span className="flex items-center gap-2">
                    {totalServices > 1
                      ? `Continue (${selectedCount}/${totalServices})`
                      : "Continue to Time"}
                    <ChevronRightIcon className="w-5 h-5" />
                  </span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Reviews Modal */}
      {viewReviewsPro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm" onClick={closeReviewPopup}></div>

          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl relative z-10 flex flex-col max-h-[85vh] fade-in slide-up">

            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <img
                  src={
                    viewReviewsPro.image
                      ? viewReviewsPro.image.length > 200
                        ? `data:image/jpeg;base64,${viewReviewsPro.image}`
                        : viewReviewsPro.image.startsWith("http") || viewReviewsPro.image.startsWith("data:image")
                          ? viewReviewsPro.image
                          : `${API_BASE_URL}/uploads/professionals/${viewReviewsPro.image}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(viewReviewsPro.name)}&background=random&color=fff&size=100`
                  }
                  alt={viewReviewsPro.name}
                  className="w-12 h-12 object-cover rounded-xl"
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{viewReviewsPro.name}</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Reviews</p>
                </div>
              </div>
              <button
                onClick={closeReviewPopup}
                className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow bg-gray-50/50">
              {selectedProReviews.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <StarIconOutline className="w-8 h-8 text-gray-300" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">No reviews yet</h4>
                  <p className="text-sm text-gray-500">Be the first to review {viewReviewsPro.name.split(" ")[0]} after your service!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedProReviews.map((fb) => (
                    <div key={fb._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star}>
                              {star <= fb.rating ? (
                                <StarIconSolid className="w-4 h-4" />
                              ) : (
                                <StarIconOutline className="w-4 h-4 text-gray-200" />
                              )}
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-gray-400">
                          {new Date(fb.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">"{fb.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 shrink-0">
              <button
                onClick={closeReviewPopup}
                className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-dark-900 font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SelectProfessionalPage;