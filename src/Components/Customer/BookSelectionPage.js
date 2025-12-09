import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./BookSelectionPage.css";

const BookSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { salon } = location.state || {};
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="book-selection-container">
      {/* Header */}
      <header className="book-selection-header">
        <div className="book-selection-logo" onClick={() => navigate("/")}>
          SalonBook
        </div>
        <button className="book-selection-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </header>

      {/* Hero Section */}
      <div className="selection-header">
        <div className="selection-header-line" />
        <h1 className="selection-title">Choose Your Booking Type</h1>
        <p className="selection-subtitle">
          Select how you'd like to make your appointment today.
        </p>
      </div>

      {/* Booking Options */}
      <div className="booking-options">
        {/* Individual Booking Card */}
        <div
          className={`booking-card ${hoveredCard === 'individual' ? 'booking-card-hovered' : ''}`}
          onClick={() => navigate(`/select-services/${salon._id}`, { state: { salon } })}
          onMouseEnter={() => setHoveredCard('individual')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="card-image-container">
            <img
              src="https://i.postimg.cc/rz2dg0L1/individual.png"
              alt="Individual Booking"
              className="card-image"
            />
            <div className="card-image-overlay" />
            <div className="card-image-label">
              <span className="card-image-label-icon">💇‍♀️</span>
              <span className="card-image-label-text">Solo Experience</span>
            </div>
          </div>
          <div className="card-content">
            <h2 className="card-title">Individual Booking</h2>
            <p className="card-description">
              Book personalized salon services for yourself. Choose your preferred stylist, date, and time with ease.
            </p>
            <ul className="card-feature-list">
              <li className="card-feature-item">
                <span className="card-checkmark">✓</span>
                Personalized service selection
              </li>
              <li className="card-feature-item">
                <span className="card-checkmark">✓</span>
                Choose your favorite stylist
              </li>
              <li className="card-feature-item">
                <span className="card-checkmark">✓</span>
                Flexible scheduling options
              </li>
              <li className="card-feature-item">
                <span className="card-checkmark">✓</span>
                Quick and simple process
              </li>
            </ul>
            <button className="card-select-btn">
              Select Individual Booking →
            </button>
          </div>
        </div>

        {/* Group Booking Card */}
        <div
          className={`booking-card ${hoveredCard === 'group' ? 'booking-card-hovered' : ''}`}
          onClick={() => navigate("/familybooking", { state: { salon } })}
          onMouseEnter={() => setHoveredCard('group')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="card-image-container">
            <img
              src="https://i.postimg.cc/Qdhg3tF6/Gemini-Generated-Image-q041hmq041hmq041.png"
              alt="Group Booking"
              className="card-image"
            />
            <div className="card-image-overlay" />
            <div className="card-image-label">
              <span className="card-image-label-icon">👨‍👩‍👧‍👦</span>
              <span className="card-image-label-text">Group Together</span>
            </div>
          </div>
          <div className="card-content">
            <h2 className="card-title">Group Booking</h2>
            <p className="card-description">
              Plan a group appointment for friends, family, or special occasions. Enjoy exclusive group benefits together.
            </p>
            <ul className="card-feature-list">
              <li className="card-feature-item">
                <span className="card-checkmark">✓</span>
                Book for multiple people
              </li>
              <li className="card-feature-item">
                <span className="card-checkmark">✓</span>
                Special group discounts
              </li>
              <li className="card-feature-item">
                <span className="card-checkmark">✓</span>
                Coordinated appointments
              </li>
              <li className="card-feature-item">
                <span className="card-checkmark">✓</span>
                Perfect for celebrations
              </li>
            </ul>
            <button className="card-select-btn">
              Select Group Booking →
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="book-selection-info">
        <div className="book-selection-info-card">
          <div className="book-selection-info-icon">💡</div>
          <h3 className="book-selection-info-title">Need Help Choosing?</h3>
          <p className="book-selection-info-text">
            Our team is here to assist you. Contact us for personalized recommendations based on your specific needs and preferences.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="book-selection-footer">
        <p className="book-selection-footer-text">
          Questions? <span className="book-selection-footer-link" onClick={() => navigate("/help")}>Contact Support</span>
        </p>
      </footer>
    </div>
  );
};

export default BookSelectionPage;