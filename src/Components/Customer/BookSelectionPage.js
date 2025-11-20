import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./BookSelectionPage.css";

const BookSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Get salon data passed from SearchSalon
  const { salon } = location.state || {};

  return (
    <div className="book-selection-container">
      <header className="selection-header">
        <h1 className="selection-title">Choose Your Booking Type</h1>
        <p className="selection-subtitle">
          Select how you'd like to make your appointment today.
        </p>
      </header>

      <div className="booking-options">
        {/* Individual Booking */}
        <div
          className="booking-card individual"
          onClick={() =>
  navigate(`/select-services/${salon._id}`, { state: { salon } })
}
        >
          <div className="card-icon">💇‍♀️</div>
          <h2>Individual Booking</h2>
          <p>
            Book personalized salon services for yourself. Choose your preferred
            stylist, date, and time easily.
          </p>
          <button className="select-btn">Select</button>
        </div>

       {/* Group Booking - FIXED: Now passes salon data */}
        <div
          className="booking-card group"
          onClick={() => navigate("/familybooking", { state: { salon } })}
        >
          <div className="card-icon">👩‍👩‍👧‍👦</div>
          <h2>Group Booking</h2>
          <p>
            Plan a group appointment for friends, family, or special occasions.
            Enjoy together with exclusive group offers.
          </p>
          <button className="select-btn">Select</button>
        </div>
      </div>
    </div>
  );
};

export default BookSelectionPage;
