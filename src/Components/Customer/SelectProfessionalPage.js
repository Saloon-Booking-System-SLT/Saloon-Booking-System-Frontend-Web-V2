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

  const currentService = selectedServices?.[currentServiceIndex] || {};

  useEffect(() => {
    if (!salon?._id) return;
    fetch(`${API_BASE_URL}/api/professionals/${salon._id}/with-ratings`)
      .then((res) => res.json())
      .then((data) => {
        setProfessionals(data);
        const reviewsObj = {};
        data.forEach((pro) => {
          reviewsObj[pro._id] = pro.feedbacks || [];
        });
        setReviews(reviewsObj);
      })
      .catch((err) => console.error("Failed to fetch professionals", err));
  }, [salon]);

  const getAverageRating = (proId) => {
    const feedbacks = reviews[proId] || [];
    if (!feedbacks.length) return 0;
    return (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1);
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

  const handleSelectProfessional = (professional) => {
    const updated = { ...serviceProfessionals, [currentService._id]: professional };
    setServiceProfessionals(updated);
    if (currentServiceIndex < selectedServices.length - 1) {
      setTimeout(() => setCurrentServiceIndex(currentServiceIndex + 1), 400);
    }
  };

  const handleSelectAnyProfessional = () => {
    handleSelectProfessional({ _id: "any", name: "Any Professional", role: "Any available" });
  };

  const getSelectedProfessionalForService = () => serviceProfessionals[currentService._id];

  const allServicesHaveProfessionals = () =>
    selectedServices.every((service) => serviceProfessionals[service._id]);

  const handleContinue = () => {
    if (!allServicesHaveProfessionals()) {
      alert("Please select a professional for each service");
      return;
    }
    const professionalData = {};
    selectedServices.forEach((service) => {
      professionalData[service._id] = serviceProfessionals[service._id];
    });
    navigate("/select-time", {
      state: { selectedServices, selectedProfessional: professionalData, salon, serviceProfessionals: professionalData },
    });
  };

  if (!selectedServices || selectedServices.length === 0) {
    navigate("/searchsalon");
    return null;
  }

  const selectedCount = Object.keys(serviceProfessionals).length;
  const totalServices = selectedServices.length;
  const salonLocationText =
    typeof salon?.location === "string"
      ? salon.location
      : salon?.location?.district || "Unknown Location";

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-28 lg:pb-12 relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {salon?.image && (
              <img
                src={salon.image.startsWith("http") ? salon.image : `${API_BASE_URL}/uploads/${salon.image}`}
                alt={salon.name}
                className="w-8 h-8 rounded-lg object-cover border border-gray-100 shrink-0"
              />
            )}
            <p className="text-sm font-bold text-gray-900 truncate">{salon?.name}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-gray-500 hover:text-dark-900 transition-colors shrink-0 ml-4"
          >
            Back
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">

          {/* Main Content */}
          <div className="lg:col-span-8 flex flex-col">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-5 flex-wrap">
              <span className="text-dark-900 cursor-pointer hover:underline" onClick={() => navigate(-1)}>
                1. Services
              </span>
              <ChevronRightIcon className="w-3 h-3" />
              <span className="text-dark-900 bg-gray-100 px-2.5 py-1 rounded-full">2. Professional</span>
              <ChevronRightIcon className="w-3 h-3" />
              <span>3. Time</span>
              <ChevronRightIcon className="w-3 h-3" />
              <span>4. Confirm</span>
            </nav>

            <div className="mb-5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-1 tracking-tight">
                Select a Professional
              </h1>
              <p className="text-gray-500 text-sm">Who would you like to perform your services?</p>
            </div>

            {/* Multi-service progress */}
            {totalServices > 1 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-5">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-0.5">
                      Service {currentServiceIndex + 1} of {totalServices}
                    </p>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">{currentService.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentServiceIndex((i) => Math.max(0, i - 1))}
                      disabled={currentServiceIndex === 0}
                      className="p-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 disabled:opacity-30"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentServiceIndex((i) => Math.min(totalServices - 1, i + 1))}
                      disabled={currentServiceIndex === totalServices - 1}
                      className="p-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 disabled:opacity-30"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Progress dots */}
                <div className="flex gap-1.5">
                  {selectedServices.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${idx === currentServiceIndex
                          ? "bg-primary-500"
                          : serviceProfessionals[selectedServices[idx]._id]
                            ? "bg-primary-200"
                            : "bg-gray-200"
                        }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Professional Cards */}
            <div className="space-y-3">
              {/* Any Professional */}
              <div
                className={`group relative bg-white p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3 sm:gap-4 cursor-pointer transition-all duration-200 ${getSelectedProfessionalForService()?._id === "any"
                    ? "border-dark-900 ring-1 ring-dark-900 shadow-md"
                    : "border-gray-100 hover:border-gray-300 hover:shadow-md"
                  }`}
                onClick={handleSelectAnyProfessional}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 border border-gray-200">
                  <UserGroupIcon className="w-7 h-7 text-gray-400" />
                </div>
                <div className="flex-grow min-w-0 pr-9">
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5">Any Professional</h4>
                  <p className="text-xs text-gray-500 line-clamp-2">Pick the first available person for this service</p>
                </div>
                <div className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 shrink-0">
                  {getSelectedProfessionalForService()?._id === "any" ? (
                    <CheckCircleSolid className="w-6 h-6 sm:w-7 sm:h-7 text-dark-900" />
                  ) : (
                    <CheckCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-gray-300 group-hover:text-gray-400" />
                  )}
                </div>
              </div>

              {/* Professionals */}
              {professionals.map((pro) => {
                const proReviews = reviews[pro._id] || [];
                const avgRating = getAverageRating(pro._id);
                const reviewCount = proReviews.length;
                const isSelected = getSelectedProfessionalForService()?._id === pro._id;

                return (
                  <div
                    key={pro._id}
                    onClick={() => handleSelectProfessional(pro)}
                    className={`group relative bg-white p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3 sm:gap-4 cursor-pointer transition-all duration-200 ${isSelected
                        ? "border-dark-900 ring-1 ring-dark-900 shadow-md"
                        : "border-gray-100 hover:border-gray-300 hover:shadow-md"
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
                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl shrink-0 border border-gray-100"
                    />

                    <div className="flex-grow min-w-0 pr-20 sm:pr-24">
                      <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5 truncate">{pro.name}</h4>
                      <p className="text-xs text-gray-500 mb-1 truncate">{pro.role || "Stylist"}</p>
                      <div className="flex items-center gap-1 text-xs font-medium">
                        {reviewCount > 0 ? (
                          <>
                            <StarIconSolid className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-gray-900">{avgRating}</span>
                            <span className="text-gray-400">({reviewCount})</span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs uppercase tracking-wider font-bold">New</span>
                        )}
                      </div>
                    </div>

                    {/* Reviews button */}
                    <div className="absolute right-10 sm:right-12 top-1/2 -translate-y-1/2">
                      <button
                        className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          openReviewPopup(pro);
                        }}
                      >
                        ★
                      </button>
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
              })}
            </div>

            {/* Multi-service mobile summary (above bottom bar) */}
            {totalServices > 1 && (
              <div className="mt-5 bg-white border border-gray-200 rounded-2xl p-4 lg:hidden">
                <h4 className="font-bold text-gray-900 mb-3 text-sm">Your Selections</h4>
                <div className="space-y-2">
                  {selectedServices.map((service) => (
                    <div key={service._id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl">
                      <span className="text-xs font-bold text-gray-700 truncate mr-2">{service.name}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${serviceProfessionals[service._id]
                          ? "bg-dark-900 text-white"
                          : "bg-gray-200 text-gray-500"
                        }`}>
                        {serviceProfessionals[service._id]?.name || "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-4 relative">
            <div className="sticky top-28 bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col">

              {/* Salon Preview */}
              <div className="flex items-center gap-4 pb-5 border-b border-gray-100 mb-5">
                <img
                  src={
                    salon?.image
                      ? salon.image.startsWith("http") ? salon.image : `${API_BASE_URL}/uploads/${salon.image}`
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

              {totalServices > 1 && (
                <div className="bg-primary-50 rounded-xl p-3.5 border border-primary-100 mb-5">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-0.5">
                    Current Service
                  </h5>
                  <p className="font-bold text-primary-900 truncate text-sm">{currentService.name}</p>
                  <p className="text-xs text-primary-700 mt-1">LKR {currentService.price}</p>
                </div>
              )}

              <div className="flex-grow overflow-y-auto max-h-[35vh] hide-scrollbar mb-5">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  All Services ({totalServices})
                </h5>
                <ul className="space-y-3">
                  {selectedServices.map((s) => {
                    const proName = serviceProfessionals[s._id]?.name;
                    return (
                      <li key={s._id} className="flex flex-col gap-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm font-bold text-gray-800 line-clamp-1">{s.name}</span>
                          <span className="text-xs font-bold text-gray-900 shrink-0">LKR {s.price}</span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md self-start ${proName ? "bg-dark-900 text-white" : "bg-gray-200 text-gray-500"
                          }`}>
                          {proName || "Select pro 👀"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="pt-5 border-t border-gray-100">
                <div className="flex justify-between items-center mb-5">
                  <p className="text-sm font-bold text-gray-500">Total Due</p>
                  <p className="text-2xl font-black text-dark-900">LKR {totalPrice}</p>
                </div>
                <button
                  className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${!allServicesHaveProfessionals()
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-dark-900 text-white hover:bg-black hover:shadow-lg active:scale-[0.98]"
                    }`}
                  onClick={handleContinue}
                  disabled={!allServicesHaveProfessionals()}
                >
                  {totalServices > 1
                    ? `Continue (${selectedCount}/${totalServices})`
                    : "Continue to Time"}
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl px-4 pt-3 pb-5">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-400">
              {selectedCount === 0
                ? "No professional selected"
                : selectedCount === totalServices
                  ? "All selected ✓"
                  : `${selectedCount} of ${totalServices} selected`}
            </p>
            <p className="text-lg font-black text-dark-900">LKR {totalPrice}</p>
          </div>
          <button
            className={`shrink-0 px-5 py-3 rounded-xl font-bold flex items-center gap-1.5 text-sm transition-all ${!allServicesHaveProfessionals()
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-dark-900 text-white hover:bg-black active:scale-95"
              }`}
            onClick={handleContinue}
            disabled={!allServicesHaveProfessionals()}
          >
            Continue <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reviews Modal */}
      {viewReviewsPro && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm" onClick={closeReviewPopup} />

          <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full sm:max-w-lg shadow-2xl relative z-10 flex flex-col max-h-[85vh]">

            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
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
                  className="w-10 h-10 object-cover rounded-xl shrink-0"
                />
                <div>
                  <h3 className="text-base font-bold text-gray-900">{viewReviewsPro.name}</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Reviews</p>
                </div>
              </div>
              <button
                onClick={closeReviewPopup}
                className="w-9 h-9 bg-gray-50 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-grow bg-gray-50/50">
              {selectedProReviews.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <StarIconOutline className="w-10 h-10 text-gray-300 mb-3" />
                  <h4 className="text-base font-bold text-gray-900 mb-1">No reviews yet</h4>
                  <p className="text-sm text-gray-500">
                    Be the first to review {viewReviewsPro.name.split(" ")[0]}!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProReviews.map((fb) => (
                    <div key={fb._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
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
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">"{fb.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 shrink-0">
              <button
                onClick={closeReviewPopup}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-dark-900 font-bold rounded-xl transition-colors"
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