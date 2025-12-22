import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SelectServicesPage.css";

const API_BASE_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace("/api", "")
  : "https://saloon-booking-system-backend-v2.onrender.com";

const SelectProfessionalPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { salon, selectedServices } = location.state || {};

  const [professionals, setProfessionals] = useState([]);
  const [serviceProfessionals, setServiceProfessionals] = useState({});
  const [reviews, setReviews] = useState({});
  const [viewReviewsPro, setViewReviewsPro] = useState(null);
  const [selectedProReviews, setSelectedProReviews] = useState([]);

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

  const handleContinue = () => {
    if (
      selectedServices.length > 1 &&
      Object.keys(serviceProfessionals).length !== selectedServices.length
    ) {
      return alert("Please select a professional for each service");
    }

    const selectedProfessional =
      selectedServices.length === 1
        ? serviceProfessionals[selectedServices[0].name] || "any"
        : serviceProfessionals;

    navigate("/select-time", {
      state: {
        selectedServices,
        selectedProfessional,
        salon,
      },
    });
  };

  return (
    <div className="select-services-container">
      <div className="left-column">
        <p className="breadcrumb">
          Services &gt; <b>Professional</b> &gt; Time &gt; Confirm
        </p>

        <h2 className="heading-with-search">Select professionals</h2>

        {selectedServices.length === 1 ? (
          <>
            <div className="select-services-list">
              <div
                className={`select-services-card ${
                  serviceProfessionals[selectedServices[0].name]?._id === "any"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setServiceProfessionals({
                    [selectedServices[0].name]: {
                      name: "Any Professional",
                      _id: "any",
                    },
                  })
                }
              >
                <h4>Any professional</h4>
                <div className="checkbox-icon">
                  {serviceProfessionals[selectedServices[0].name]?._id === "any"
                    ? "✔"
                    : "☐"}
                </div>
              </div>

              {professionals.map((pro) => {
                const proReviews = reviews[pro._id] || [];
                const avgRating = getAverageRating(pro._id);
                const reviewCount = proReviews.length;

                return (
                  <div
                    key={pro._id}
                    className={`select-services-card ${
                      serviceProfessionals[selectedServices[0].name]?._id === pro._id
                        ? "selected"
                        : ""
                    }`}
                  >
                    <div
                      className="professional-info"
                      onClick={() =>
                        setServiceProfessionals({
                          [selectedServices[0].name]: pro,
                        })
                      }
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

                    <button className="view-reviews-btn" onClick={() => openReviewPopup(pro)}>
                      👁 View
                    </button>

                    <div className="checkbox-icon">
                      {serviceProfessionals[selectedServices[0].name]?._id === pro._id
                        ? "✔"
                        : "☐"}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h4>Select for each service:</h4>
            <div className="select-services-list">
              {selectedServices.map((service) => (
                <div key={service.id} className="select-services-card">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <h4>{service.name}</h4>
                      <p>{service.duration}</p>
                      <p>LKR {service.price}</p>
                      <p style={{ fontSize: "13px" }}>
                        Selected: {serviceProfessionals[service.name]?.name || "None"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
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
            {selectedServices?.map((s, index) => (
              <div key={index}>
                <p>
                  {s.name} — {s.duration}
                </p>
                <p>
                  <b>LKR {s.price}</b>
                </p>
              </div>
            ))}
          </div>

          <div className="total-section">
            <p>Total</p>
            <p>
              <strong>LKR {totalPrice}</strong>
            </p>
          </div>

          <button className="continue-button" onClick={handleContinue}>
            Continue
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
              <p>
                {"⭐".repeat(fb.rating)}
              </p>
              <p>{fb.comment}</p>

              {/* 💎 Professional date format */}
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

      {/* Changed from cancel-button to modal-close-button */}
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
