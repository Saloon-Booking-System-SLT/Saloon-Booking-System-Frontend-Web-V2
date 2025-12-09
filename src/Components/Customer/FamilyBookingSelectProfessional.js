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
  const [popupService, setPopupService] = useState(null);
  const [serviceProfessionals, setServiceProfessionals] = useState({});

  // ⭐ NEW STATES FOR REVIEWS
  const [reviews, setReviews] = useState({});
  const [viewReviewsPro, setViewReviewsPro] = useState(null);
  const [selectedProReviews, setSelectedProReviews] = useState([]);

  useEffect(() => {
    if (!salon?._id) return;

    fetch(`${API_BASE_URL}/api/professionals/${salon._id}`)
      .then((res) => res.json())
      .then((data) => setProfessionals(data))
      .catch((err) => console.error("Failed to fetch professionals", err));
  }, [salon]);


  // ⭐ FETCH REVIEWS FOR ALL PROFESSIONALS (same as your first code)
  useEffect(() => {
    if (!professionals.length) return;

    Promise.all(
      professionals.map((pro) =>
        fetch(`${API_BASE_URL}/api/feedback/professionals/${pro._id}`)
          .then((res) => res.json())
          .then((data) => data.feedbacks)
      )
    ).then((results) => {
      const obj = {};
      professionals.forEach((pro, i) => {
        obj[pro._id] = results[i];
      });
      setReviews(obj);
    });
  }, [professionals]);

  const getAverageRating = (proId) => {
    const feedbacks = reviews[proId] || [];
    if (!feedbacks.length) return 0;
    const total = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
    return (total / feedbacks.length).toFixed(1);
  };

  // ⭐ OPEN REVIEW POPUP
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

  const openPopup = (service) => setPopupService(service);
  const closePopup = () => setPopupService(null);

  const handleSelectProForService = (serviceName, pro) => {
    setServiceProfessionals((prev) => ({
      ...prev,
      [serviceName]: pro,
    }));
    closePopup();
  };

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

    localStorage.setItem("selectedProfessional", JSON.stringify(selectedProfessional));
    localStorage.setItem("selectedServices", JSON.stringify(selectedServices));
    localStorage.setItem("selectedSalon", JSON.stringify(salon));

    navigate("/familybookingselecttimepage", {
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
            <h4 style={{ marginTop: "10px" }}>For: {selectedServices[0].name}</h4>
            <div className="select-services-list">
              <div
                className={`select-services-card ${
                  serviceProfessionals[selectedServices[0].name]?._id === "any"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setServiceProfessionals({
                    [selectedServices[0].name]: { name: "Any Professional", _id: "any" },
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
                        className="select-services-image"
                      />

                      <div>
                        <h4>{pro.name}</h4>
                        <p>{pro.role}</p>

                        {/* ⭐ Rating text */}
                        <p style={{ fontSize: "13px", color: "#555" }}>
                          {reviewCount > 0
                            ? `⭐ ${avgRating} (${reviewCount} review${
                                reviewCount !== 1 ? "s" : ""
                              })`
                            : "No reviews yet"}
                        </p>
                      </div>
                    </div>

                    {/* ⭐ REVIEW BUTTON ADDED */}
                    <button
                      className="view-reviews-btn"
                      onClick={() => openReviewPopup(pro)}
                    >
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
            <h4 style={{ marginTop: "10px" }}>For each service:</h4>
            <div className="select-services-list">
              {selectedServices.map((service) => (
                <div key={service.id} className="select-services-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h4>{service.name}</h4>
                      <p>{service.duration}</p>
                      <p>LKR {service.price}</p>
                      <p style={{ fontSize: "13px", color: "#777" }}>
                        Selected: {serviceProfessionals[service.name]?.name || "None"}
                      </p>
                    </div>
                    <button className="assign-btn" onClick={() => openPopup(service)}>
                      Assign
                    </button>
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

      {/* ⭐ REVIEW POPUP ADDED */}
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

      {/* ORIGINAL ASSIGN POPUP */}
      {popupService && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Select professional for {popupService.name}</h3>

            <div className="services-list">
              {professionals.map((pro) => (
                <div
                  key={pro._id}
                  className={`service-card ${
                    serviceProfessionals[popupService.name]?._id === pro._id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleSelectProForService(popupService.name, pro)
                  }
                >
                  <div className="professional-info">
                    <img
                      src={pro.image || "https://via.placeholder.com/50"}
                      alt={pro.name}
                    />

                    <div>
                      <h4>{pro.name}</h4>
                      <p>{pro.role}</p>
                    </div>
                  </div>

                  <div className="checkbox-icon">
                    {serviceProfessionals[popupService.name]?._id === pro._id
                      ? "✔"
                      : "☐"}
                  </div>
                </div>
              ))}
            </div>

            <button className="cancel-button" onClick={closePopup}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectProfessionalPage;
