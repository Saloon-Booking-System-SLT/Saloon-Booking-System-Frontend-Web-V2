import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../Assets/logo.png";
import "./OwnerFeedbackPage.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://saloon-booking-system-backend-v2.onrender.com/api';

const OwnerFeedbackPage = () => {
  const navigate = useNavigate();
  const salon = JSON.parse(localStorage.getItem("salonUser"));
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  const Sidebar = () => {
    return (
      <aside className="modern-sidebar">
        <img src={logo} alt="Brand Logo" className="modern-logo" />
        <i className="fas fa-home" title="Home" onClick={() => navigate('/dashboard')}></i>
        <i className="fas fa-calendar-alt" title="Calendar" onClick={() => navigate('/calendar')}></i>
        <i className="fas fa-smile" title="Services" onClick={() => navigate('/services')}></i>
        <i className="fas fa-comment active" title="Feedbacks"></i>
        <i className="fas fa-users" title="Professionals" onClick={() => navigate('/professionals')}></i>
        <i className="fas fa-clock" title="Time Slots" onClick={() => navigate('/timeslots')}></i>
      </aside>
    );
  };

  const fetchProfessionalsWithFeedbacks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/feedback/with-feedbacks/${salon.id}`);
      const data = await res.json();
      setProfessionals(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch professionals with feedbacks", err);
      setLoading(false);
    }
  }, [salon.id]);

  useEffect(() => {
    if (salon?.id) fetchProfessionalsWithFeedbacks();
  }, [salon?.id, fetchProfessionalsWithFeedbacks]);

  const getAverageRating = (feedbacks) => {
    if (!feedbacks || feedbacks.length === 0) return 0;
    const total = feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
    return (total / feedbacks.length).toFixed(1);
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return "#27ae60"; // Green for high ratings
    if (rating >= 3) return "#f39c12"; // Orange for medium ratings
    return "#e74c3c"; // Red for low ratings
  };

  return (
    <div className="calendar-container">
      <Sidebar />

      <div className="main-content">
        <header className="header">
          <div className="header-content">
            <h1 className="header-title">Customer Feedbacks</h1>
            <div className="header-decoration"></div>
          </div>
        </header>

        <div className="services-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading feedbacks...</p>
            </div>
          ) : professionals.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-comments"></i>
              <h3>No Professionals Found</h3>
              <p>Start by adding professionals to your salon team.</p>
            </div>
          ) : (
            professionals.map((pro) => {
              const avgRating = getAverageRating(pro.feedbacks);
              const ratingColor = getRatingColor(avgRating);
              
              return (
                <div key={pro._id} className="professional-feedback-section">
                  <div className="professional-header">
                    <div className="professional-info">
                      <h3 className="professional-name">{pro.name}</h3>
                      <span className="professional-role">{pro.role}</span>
                    </div>
                    <div className="rating-summary" style={{ borderLeftColor: ratingColor }}>
                      <div className="avg-rating" style={{ color: ratingColor }}>
                        {avgRating > 0 ? `⭐ ${avgRating}/5` : "No ratings"}
                      </div>
                      <div className="review-count">
                        {pro.feedbacks.length} {pro.feedbacks.length === 1 ? 'review' : 'reviews'}
                      </div>
                    </div>
                  </div>

                  <div className="feedbacks-grid">
                    {pro.feedbacks.length === 0 ? (
                      <div className="no-feedback-card">
                        <i className="fas fa-comment-slash"></i>
                        <p>No feedback received yet</p>
                      </div>
                    ) : (
                      pro.feedbacks.map((fb) => (
                        <div key={fb._id} className="feedback-card">
                          <div className="feedback-header">
                            <div className="user-info">
                              <div className="user-avatar">
                                <i className="fas fa-user"></i>
                              </div>
                              <div className="user-details">
                                <strong className="user-email">{fb.userEmail}</strong>
                                <span className="feedback-date">
                                  {new Date(fb.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="rating-stars">
                              {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
                              <span className="rating-number">({fb.rating})</span>
                            </div>
                          </div>
                          <div className="feedback-comment">
                            {fb.comment || (
                              <span className="no-comment">(No comment provided)</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerFeedbackPage;
