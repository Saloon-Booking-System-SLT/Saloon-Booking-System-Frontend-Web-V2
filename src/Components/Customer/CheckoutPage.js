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
  const [phone, setPhone] = useState(appointmentData?.user?.phone || appointmentData?.phone || "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  // If appointment is already created passed from previous page
  const [appointmentId, setAppointmentId] = useState(appointmentData?.appointmentId || null);

  if (!appointmentData) {
    return (
      <div className="checkout-container">
        <h2>No appointment data found</h2>
        <button className="pay-button" onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  // Extract display details from the first appointment in the details array
  const displayDetails = appointmentData.appointmentDetails?.[0] || {};
  const totalAmount = appointmentData.totalAmount || 0;

  const handlePayment = async () => {
    if (!phone.trim()) {
      alert("Please enter your phone number");
      return;
    }

    if (paymentMethod === "card" && (!cardNumber || !expiry || !cvc || !cardName)) {
      alert("Please fill in all card details");
      return;
    }

    if (paymentMethod === "payhere" && !appointmentId) {
      // This should not happen if we came from select time page where appointments are created
      // But if we need to create it (fallback logic):
      await createAppointment();
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === "payhere") {
        // Logic handled by PayHereButton, but if we need manual trigger?
        // Actually PayHereButton handles its own click. 
        // This handlePayment is for "Cash" or "Card" or creating the appointment if not exists.
        if (appointmentId) {
          // PayHere button will be shown, so this function might not be called for PayHere 
          // unless we are "Continuing to Payment" (creation step).
          // If we have ID, we shouldn't be here for PayHere, the user should click the PayHere button.
        }
      } else {
        // Cash or Card
        alert("✅ Appointment confirmed! (Payment simulated)");
        navigate("/confirmationpage", { state: { ...appointmentData, appointmentId } });
      }

    } catch (error) {
      console.error("Payment error:", error);
      alert("❌ Something went wrong. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async () => {
    setLoading(true);
    try {
      // ... (Existing creation logic if needed, but per analysis SelectTimePage creates it)
      // For now assuming we mostly receive created appointments.
      // If we DO validly need to create (e.g. from a page that didn't create it):
      const appointmentPayload = {
        phone,
        email: appointmentData.email || "",
        name: appointmentData.customerName || "Guest",
        appointments: appointmentData.appointmentDetails // Ensure this matches API expectation
      };

      // ... API call ...
      // This fallback is risky if data structures mismatch. 
      // Better to rely on SelectTimePage creation for now or strictly map.
    } catch (e) { console.error(e) }
    setLoading(false);
  }

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
                amount={totalAmount}
                customer={{
                  first_name: appointmentData.customerName?.split(' ')[0] || 'Guest',
                  last_name: appointmentData.customerName?.split(' ').slice(1).join(' ') || '',
                  email: appointmentData.user?.email || 'guest@example.com',
                  phone: phone || '0000000000',
                  address: appointmentData.salonLocation || 'N/A',
                  city: 'Colombo',
                  country: 'Sri Lanka'
                }}
                onError={(error) => alert(error)}
              />
            ) : (
              // If no ID (should rely on upstream creation), show error or fallback
              <div className="error-message">
                Error: Appointment ID missing. Please go back and try again.
              </div>
            )
          ) : (
            <button
              className="pay-button"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? "Processing..." : `Pay LKR ${totalAmount.toLocaleString()}`}
            </button>
          )}
        </div>

        <div className="checkout-right">
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-item">
              <span>Service:</span>
              <span>{displayDetails.serviceName || "N/A"}</span>
            </div>
            <div className="summary-item">
              <span>Professional:</span>
              <span>{displayDetails.professionalName || "Any"}</span>
            </div>
            <div className="summary-item">
              <span>Date:</span>
              <span>{displayDetails.date ? new Date(displayDetails.date).toLocaleDateString() : "N/A"}</span>
            </div>
            <div className="summary-item">
              <span>Time:</span>
              <span>{displayDetails.startTime || "N/A"}</span>
            </div>
            <div className="summary-item">
              <span>Duration:</span>
              <span>{displayDetails.duration || "N/A"}</span>
            </div>
            <div className="summary-item">
              <span>Salon:</span>
              <span>{appointmentData.salonName || "Our Salon"}</span>
            </div>

            {appointmentData.appointmentDetails?.length > 1 && (
              <div className="summary-item" style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px' }}>
                <span>Total Services:</span>
                <span>{appointmentData.appointmentDetails.length}</span>
              </div>
            )}

            <div className="summary-total">
              <span>Total Amount:</span>
              <span>LKR {totalAmount.toLocaleString()}</span>
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