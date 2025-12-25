// src/pages/CheckoutPage.js
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreditCardIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import PayHereButton from './PayHereButton';
import "./CheckoutPage.css";

const API_BASE_URL = process.env.REACT_APP_API_URL ?
  process.env.REACT_APP_API_URL.replace('/api', '') :
  'https://saloon-booking-system-backend-v2.onrender.com';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const appointmentData = location.state;

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("payhere");
  const [phone, setPhone] = useState(appointmentData?.phone || "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [appointmentId, setAppointmentId] = useState(null);

  if (!appointmentData) {
    return (
      <div className="checkout-container">
        <h2>No appointment data found</h2>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!phone.trim()) {
      alert("Please enter your phone number");
      return;
    }

    if (paymentMethod === "card" && (!cardNumber || !expiry || !cvc || !cardName)) {
      alert("Please fill in all card details");
      return;
    }

    setLoading(true);

    try {
      // For rescheduling
      if (appointmentData.isReschedule) {
        const res = await fetch(`${API_BASE_URL}/api/appointments/${appointmentData.appointmentId}/reschedule`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...appointmentData.rescheduleData,
            phone: phone
          }),
        });

        const data = await res.json();

        if (data.success) {
          alert("✅ Appointment rescheduled successfully!");
          navigate("/appointments");
        } else {
          alert("❌ Failed to reschedule: " + (data.message || "Unknown error"));
        }
        return;
      }

      // For new booking
      const appointment = {
        phone,
        email: appointmentData.email || "",
        name: appointmentData.name || "Guest",
        appointments: [appointmentData.appointmentDetails],
      };

      const res = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment),
      });

      const data = await res.json();

      if (data.success) {
        // For PayHere, store appointmentId and show PayHere button
        if (paymentMethod === "payhere") {
          const createdAppointmentId = data.appointments?.[0]?._id || data.appointment?._id;

          if (!createdAppointmentId) {
            throw new Error("No appointment ID returned from server");
          }

          console.log("✅ Appointment created, ID:", createdAppointmentId);
          setAppointmentId(createdAppointmentId);
          alert("✅ Appointment created! Please proceed with payment.");
        } else {
          // For cash or card payment, complete the flow
          alert("✅ Appointment booked successfully!");
          navigate("/appointments");
        }
      } else {
        alert("❌ Failed to book appointment: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("❌ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        <div className="checkout-left">
          <h2>Checkout</h2>

          <div className="checkout-section">
            <h3>Contact Information</h3>
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </div>
          </div>

          <div className="checkout-section">
            <h3>Payment Method</h3>
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  value="payhere"
                  checked={paymentMethod === "payhere"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  PayHere (Online Payment)
                </span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Credit/Debit Card
                </span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="flex items-center gap-2">
                  <BanknotesIcon className="h-5 w-5" />
                  Cash on Arrival
                </span>
              </label>
            </div>
          </div>

          {paymentMethod === "card" && (
            <div className="checkout-section">
              <h3>Card Details</h3>
              <div className="card-input">
                <input
                  type="text"
                  placeholder="Card Number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength="16"
                />
                <div className="card-row">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    maxLength="5"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    maxLength="3"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>
            </div>
          )}

          {paymentMethod === "payhere" ? (
            appointmentId ? (
              <PayHereButton
                appointmentId={appointmentId}
                amount={appointmentData.service?.price || 0}
                customer={{
                  first_name: appointmentData.name?.split(' ')[0] || 'Guest',
                  last_name: appointmentData.name?.split(' ').slice(1).join(' ') || '',
                  email: appointmentData.email || 'guest@example.com',
                  phone: phone || '0000000000',
                  address: appointmentData.address || 'N/A',
                  city: appointmentData.city || 'Colombo',
                  country: 'Sri Lanka'
                }}
                onError={(error) => alert(error)}
              />
            ) : (
              <button
                className="pay-button"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? "Creating Appointment..." : "Continue to Payment"}
              </button>
            )
          ) : (
            <button
              className="pay-button"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? "Processing..." : `Pay LKR ${appointmentData.service?.price || "0"}`}
            </button>
          )}
        </div>

        <div className="checkout-right">
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-item">
              <span>Service:</span>
              <span>{appointmentData.service?.name}</span>
            </div>
            <div className="summary-item">
              <span>Professional:</span>
              <span>{appointmentData.professional?.name || "Any"}</span>
            </div>
            <div className="summary-item">
              <span>Date:</span>
              <span>{new Date(appointmentData.selectedDate).toLocaleDateString()}</span>
            </div>
            <div className="summary-item">
              <span>Time:</span>
              <span>{appointmentData.selectedTime}</span>
            </div>
            <div className="summary-item">
              <span>Duration:</span>
              <span>{appointmentData.service?.duration}</span>
            </div>
            <div className="summary-item">
              <span>Salon:</span>
              <span>{appointmentData.salon?.name}</span>
            </div>
            <div className="summary-total">
              <span>Total Amount:</span>
              <span>LKR {appointmentData.service?.price}</span>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loader">
            <div className="loader-dots">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <p>Processing your payment...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;