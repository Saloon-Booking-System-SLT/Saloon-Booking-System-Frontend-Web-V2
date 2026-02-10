import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Safety check for missing state
  if (!location.state) {
    return (
      <div className="checkout-error">
        <h2>No booking details found</h2>
        <button onClick={() => navigate('/')}>Return to Home</button>
      </div>
    );
  }

  const {
    appointmentId,
    service,
    professional,
    selectedDate,
    selectedTime,
    salon,
    customerName,
    customerPhone,
    customerEmail,
    // Group booking props
    isGroupBooking,
    appointmentDetails,
    bookingId,
    totalAmount
  } = location.state;

  // Use environment variable or production fallback
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://saloon-booking-system-backend-v2.onrender.com/api';

  const handlePayHereCheckout = async () => {
    setIsLoading(true);
    try {
      // Determine Identifier and Amount
      // Use bookingId for groups, appointmentId for singles. Fallback to "TEMP_ID" safely.
      const idToProcess = isGroupBooking ? bookingId : appointmentId;
      const finalId = idToProcess || "TEMP_ID";

      const finalAmount = isGroupBooking
        ? parseFloat(totalAmount || 0).toFixed(2)
        : parseFloat(service?.price || 0).toFixed(2);

      const itemsDescription = isGroupBooking
        ? `Group Booking (${appointmentDetails?.length || 0} services)`
        : service?.name || "Salon Service";

      // 1. Prepare Request Payload
      const payload = {
        appointmentId: finalId, // Backend expects 'appointmentId' key usually, but we pass bookingId for groups
        isGroupBooking: !!isGroupBooking, // Flag for backend to handle differently if needed
        amount: finalAmount,
        currency: "LKR",
        items: itemsDescription,
        return_url: `${window.location.origin}/confirmationpage?order_id=${finalId}`,
        cancel_url: window.location.href,
        customer: {
          first_name: customerName?.split(' ')[0] || "Guest",
          last_name: customerName?.split(' ').slice(1).join(' ') || "User",
          email: customerEmail || "no-email@example.com",
          phone: customerPhone || "0000000000",
          address: "No Address Provided",
          city: "Colombo",
          country: "Sri Lanka"
        }
      };

      console.log('🔵 Initiating PayHere payment with payload:', payload);

      // 2. Call Backend to Init Payment
      const response = await fetch(`${API_BASE_URL}/payments/payhere/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('🔵 PayHere initiate response:', result);

      if (result.success && result.data) {
        console.log('🟢 Submitting form to PayHere with data:', result.data);
        // 3. Auto-Submit Form to PayHere
        submitPayHereForm(result.data);
      } else {
        alert('Failed to initiate payment: ' + (result.error || 'Unknown error'));
        console.error('Payment init failed:', result);
      }

    } catch (error) {
      console.error('Error initiating PayHere payment:', error);
      alert('An error occurred. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitPayHereForm = (data) => {
    console.log('📝 Creating PayHere form with data:', data);
    
    // Validate required PayHere fields
    const requiredFields = ['merchant_id', 'order_id', 'amount', 'currency', 'hash'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required PayHere fields:', missingFields);
      alert('Payment configuration error. Missing: ' + missingFields.join(', '));
      return;
    }

    // Ensure return_url and cancel_url are set
    const formData = {
      ...data,
      return_url: data.return_url || `${window.location.origin}/confirmationpage`,
      cancel_url: data.cancel_url || window.location.href,
    };

    console.log('📝 Final form data to be submitted:', formData);

    const form = document.createElement('form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', 'https://sandbox.payhere.lk/pay/checkout');
    form.setAttribute('target', '_self'); // Submit in same window
    form.style.display = 'none';

    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        const input = document.createElement('input');
        input.setAttribute('type', 'hidden');
        input.setAttribute('name', key);
        input.setAttribute('value', String(formData[key]));
        form.appendChild(input);
        console.log(`  ✓ Added field: ${key} = ${formData[key]}`);
      }
    });

    document.body.appendChild(form);
    console.log('🚀 Submitting form to PayHere...');
    form.submit();
  };

  // Helper to render single item summary
  const renderSingleSummary = () => (
    <>
      <div className="summary-row">
        <span className="label">Service</span>
        <span className="value">{service?.name || 'Unknown Service'}</span>
      </div>
      <div className="summary-row">
        <span className="label">Professional</span>
        <span className="value">{professional?.name || 'Any Professional'}</span>
      </div>
      <div className="summary-row">
        <span className="label">Date & Time</span>
        <span className="value">
          {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
        </span>
      </div>
    </>
  );

  // Helper to render group summary
  const renderGroupSummary = () => (
    <div className="group-summary-list">
      {appointmentDetails.map((appt, idx) => (
        <div key={idx} className="group-item">
          <div className="group-item-header">
            <span className="item-name">{appt.serviceName}</span>
            <span className="item-price">LKR {appt.price}</span>
          </div>
          <div className="group-item-details">
            {appt.memberName} ({appt.memberCategory}) - {appt.startTime}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <p>Complete your {isGroupBooking ? 'group booking' : 'appointment'} with PayHere</p>
        </div>

        <div className="order-summary-box">
          <h3>Order Summary</h3>

          {isGroupBooking ? renderGroupSummary() : renderSingleSummary()}

          <div className="summary-row">
            <span className="label">Salon</span>
            <span className="value">{salon?.name || 'Salon detail unavailable'}</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row total">
            <span className="label">Total Amount</span>
            <span className="value">
              LKR {isGroupBooking
                ? (totalAmount || 0).toLocaleString()
                : (service?.price ? service.price.toLocaleString() : '0.00')}
            </span>
          </div>
        </div>

        <div className="payment-actions">
          <button
            className="payhere-btn"
            onClick={handlePayHereCheckout}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loader">Processing...</span>
            ) : (
              <>Pay with <span className="payhere-logo-text">PayHere</span></>
            )}
          </button>

          <button
            className="cancel-btn"
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>

        <div className="secure-badge">
          <span>🔒 Secure Payment via PayHere Sandbox</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;