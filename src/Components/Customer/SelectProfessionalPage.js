import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SelectServicesPage.css";

const API_BASE_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace("/api", "")
  : "https://dpdlab1.slt.lk:8447/salon-api";

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

    // ⚡ Use optimized endpoint - gets professionals with ratings in ONE call
    fetch(`${API_BASE_URL}/api/professionals/${salon._id}/with-ratings`)
      .then((res) => res.json())
      .then((data) => {
        setProfessionals(data);
        
        // Build reviews object from the data (feedbacks already included)
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
    const res = await fetch(`${API_BASE_URL}/api/feedback/professionals/${pro._id}`);
    const data = await res.json();
    setSelectedProReviews(data.feedbacks || []);
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

    // Auto-advance to next service if available
    if (currentServiceIndex < selectedServices.length - 1) {
      setCurrentServiceIndex(currentServiceIndex + 1);
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

    // Prepare data in the format expected by SelectTimePage
    const professionalData = {};
    selectedServices.forEach(service => {
      professionalData[service._id] = serviceProfessionals[service._id];
    });

    navigate("/select-time", {
      state: {
        selectedServices,
        selectedProfessional: professionalData, // Pass as object with service IDs as keys
        salon,
        serviceProfessionals: professionalData // Additional field for clarity
      },
    });
  };

  // If no services selected, go back
  if (!selectedServices || selectedServices.length === 0) {
    navigate("/select-services", { state: { salon } });
    return null;
  }

  return (
    <div className="select-services-container">
      <div className="left-column">
        <p className="breadcrumb">
          Services &gt; <b>Professional</b> &gt; Time &gt; Confirm
        </p>

        <h2 className="heading-with-search">Select professionals</h2>

        {/* Service progress indicator for multiple services */}
        {selectedServices.length > 1 && (
          <div className="service-progress-indicator">
            <h3>
              Service {currentServiceIndex + 1} of {selectedServices.length}
            </h3>
            <p className="current-service-name">{currentService.name}</p>
            <div className="progress-buttons">
              <button 
                onClick={handleBackToPreviousService}
                disabled={currentServiceIndex === 0}
                className="nav-button"
              >
                ← Previous Service
              </button>
              <button 
                onClick={() => {
                  if (currentServiceIndex < selectedServices.length - 1) {
                    setCurrentServiceIndex(currentServiceIndex + 1);
                  }
                }}
                disabled={currentServiceIndex === selectedServices.length - 1}
                className="nav-button"
              >
                Next Service →
              </button>
            </div>
          </div>
        )}

        <div className="select-services-list">
          {/* Any Professional option */}
          <div
            className={`select-services-card ${
              getSelectedProfessionalForService()?._id === "any" ? "selected" : ""
            }`}
            onClick={handleSelectAnyProfessional}
          >
            <h4>Any professional</h4>
            <div className="checkbox-icon">
              {getSelectedProfessionalForService()?._id === "any" ? "✔" : "☐"}
            </div>
          </div>

          {/* List of professionals */}
          {professionals.map((pro) => {
            const proReviews = reviews[pro._id] || [];
            const avgRating = getAverageRating(pro._id);
            const reviewCount = proReviews.length;

            return (
              <div
                key={pro._id}
                className={`select-services-card ${
                  getSelectedProfessionalForService()?._id === pro._id ? "selected" : ""
                }`}
              >
                <div
                  className="professional-info"
                  onClick={() => handleSelectProfessional(pro)}
                >
                  <img
                    src={
                      pro.image
                        ? pro.image.startsWith("http")
                          ? pro.image
                          : `${API_BASE_URL}/uploads/professionals/${pro.image}`
                        : "https://via.placeholder.com/150"
                    }
                    alt={pro.name}
                    className="service-image"
                  />
                  <div>
                    <h4>{pro.name}</h4>
                    <p>{pro.role}</p>
                    <p style={{ fontSize: "13px", color: "#555" }}>
                      {reviewCount > 0
                        ? `⭐ ${avgRating} (${reviewCount} review${
                            reviewCount !== 1 ? "s" : ""
                          })`
                        : "No reviews yet"}
                    </p>
                  </div>
                </div>

                <button 
                  className="view-reviews-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    openReviewPopup(pro);
                  }}
                >
                  👁 View
                </button>

                <div className="checkbox-icon">
                  {getSelectedProfessionalForService()?._id === pro._id ? "✔" : "☐"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary of selections for all services */}
        {selectedServices.length > 1 && (
          <div className="selections-summary">
            <h4>Your Selections:</h4>
            {selectedServices.map((service, index) => (
              <div key={service._id} className="selection-item">
                <span className="service-name">{service.name}</span>
                <span className="professional-name">
                  {serviceProfessionals[service._id]?.name || "Not selected"}
                </span>
                {index < selectedServices.length - 1 && <hr />}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="right-column">
        <div className="summary-box">
          <img
            src={
              salon?.image
                ? salon.image.startsWith("http")
                  ? salon.image
                  : `${API_BASE_URL}/uploads/${salon.image}`
                : "https://via.placeholder.com/150"
            }
            alt="Salon"
            className="salon-image"
          />
          <div className="salon-info">
            <h4>{salon?.name}</h4>
            <p>{salon?.location}</p>
            
            {/* Current service details */}
            <div className="current-service-details">
              <h5>Current Service:</h5>
              <p><strong>{currentService.name}</strong></p>
              <p>{currentService.duration}</p>
              <p><b>LKR {currentService.price}</b></p>
            </div>

            {/* All services summary */}
            <div className="all-services-summary">
              <h5>All Services:</h5>
              {selectedServices?.map((s, index) => (
                <div key={index} className="service-summary-item">
                  <p>
                    {s.name} — {s.duration}
                  </p>
                  <p>
                    <b>LKR {s.price}</b>
                  </p>
                  <small>
                    Professional: {serviceProfessionals[s._id]?.name || "Not selected"}
                  </small>
                </div>
              ))}
            </div>
          </div>

          <div className="total-section">
            <p>Total</p>
            <p>
              <strong>LKR {totalPrice}</strong>
            </p>
          </div>

          <button 
            className="continue-button" 
            onClick={handleContinue}
            disabled={!allServicesHaveProfessionals()}
          >
            {selectedServices.length > 1 
              ? `Continue to Time Selection (${Object.keys(serviceProfessionals).length}/${selectedServices.length})`
              : "Continue"}
          </button>
        </div>
      </div>

      {viewReviewsPro && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Reviews for {viewReviewsPro.name}</h3>
            <div className="modal-body">
              {selectedProReviews.length === 0 ? (
                <p>No reviews yet</p>
              ) : (
                selectedProReviews.map((fb) => (
                  <div key={fb._id} className="feedback-item">
                    <p>{"⭐".repeat(fb.rating)}</p>
                    <p>{fb.comment}</p>
                    <small>
                      {new Date(fb.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                ))
              )}
            </div>
            <button className="modal-close-button" onClick={closeReviewPopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectProfessionalPage;