import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "../../Api/axios";
import OwnerSidebar from './OwnerSidebar';
import OwnerHeader from './OwnerHeader';
import {
  ChatBubbleLeftRightIcon,
  StarIcon as StarIconOutline,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const OwnerFeedbackPage = () => {
  const salon = JSON.parse(localStorage.getItem("salonUser"));
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const didFetch = useRef(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchProfessionalsWithFeedbacks = useCallback(async () => {
    try {
      const salonId = salon?.id || salon?._id;
      if (!salonId) {
        setError("Salon information not found.");
        setLoading(false);
        return;
      }

      setError("");
      const res = await axios.get(`/feedback/with-feedbacks/${salonId}`);
      setProfessionals(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch professionals with feedbacks", err);
      setError("Failed to load feedbacks. Please try again.");
      setLoading(false);
    }
  }, [salon?.id, salon?._id]);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    const salonId = salon?.id || salon?._id;
    if (salonId) {
      fetchProfessionalsWithFeedbacks();
    } else {
      setError("Salon information not found.");
      setLoading(false);
    }
  }, [salon?.id, salon?._id, fetchProfessionalsWithFeedbacks]);

  const getAverageRating = (feedbacks) => {
    if (!feedbacks || feedbacks.length === 0) return 0;
    const total = feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
    return (total / feedbacks.length).toFixed(1);
  };

  const getRatingColor = (rating) => {
    const numericRating = Number(rating);
    if (numericRating >= 4.0) return "text-emerald-500 bg-emerald-50 border-emerald-200";
    if (numericRating >= 3.0) return "text-amber-500 bg-amber-50 border-amber-200";
    return "text-red-500 bg-red-50 border-red-200";
  };

  const getRatingStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ?
            <StarIconSolid key={star} className="w-4 h-4 text-amber-400" /> :
            <StarIconOutline key={star} className="w-4 h-4 text-gray-300" />
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <OwnerSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0 overflow-hidden">
        <OwnerHeader />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-600 rounded-l-2xl"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="w-7 h-7 text-primary-600" />
                Customer Feedbacks
              </h1>
              <p className="text-gray-500 mt-1 ml-10">Monitor reviews and ratings for your professionals.</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Loading feedbacks...</p>
            </div>
          ) : professionals.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Professionals Found</h3>
              <p className="text-gray-500 max-w-md">You don't have any professionals listed yet, or there are no feedbacks available.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {professionals.map((pro) => {
                const feedbacks = pro.feedbacks || [];
                const avgRating = getAverageRating(feedbacks);
                const ratingStatusClasses = getRatingColor(avgRating);

                return (
                  <div key={pro._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Professional Header */}
                    <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{pro.name}</h3>
                        <span className="text-sm font-medium text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full">
                          {pro.role || pro.service || "Professional"}
                        </span>
                      </div>

                      <div className={`flex flex-col items-end px-4 py-2 rounded-xl border ${ratingStatusClasses}`}>
                        <div className="text-xl font-black mb-0.5">
                          {Number(avgRating) > 0 ? (
                            <span className="flex items-center gap-1.5">
                              {avgRating} <StarIconSolid className="w-5 h-5 text-amber-400" />
                            </span>
                          ) : "No ratings"}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-80">
                          {feedbacks.length} {feedbacks.length === 1 ? "review" : "reviews"}
                        </div>
                      </div>
                    </div>

                    {/* Feedbacks Grid */}
                    <div className="p-5 md:p-6 bg-white">
                      {feedbacks.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 font-medium italic">No feedback received for this professional yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          {feedbacks.map((fb) => (
                            <div key={fb._id} className="bg-white border text-left border-gray-100 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <UserCircleIcon className="w-8 h-8" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-gray-900 leading-tight">
                                      {fb.userEmail ? fb.userEmail.split('@')[0] : 'Customer'}
                                    </h4>
                                    <span className="text-xs font-medium text-gray-500">
                                      {new Date(fb.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="bg-amber-50 px-2 py-1 rounded-lg">
                                  {getRatingStars(fb.rating)}
                                </div>
                              </div>

                              <p className="text-gray-600 text-sm leading-relaxed">
                                "{fb.comment || <span className="text-gray-400 italic">No written detail was provided for this rating.</span>}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OwnerFeedbackPage;