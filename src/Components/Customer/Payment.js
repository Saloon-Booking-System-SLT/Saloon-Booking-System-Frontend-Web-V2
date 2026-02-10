// src/pages/Payment.js - CORRECTED VERSION
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { useLocation, useNavigate } from 'react-router-dom';
import './Payment.css';

const stripePromise = loadStripe('pk_test_51SIW1nRfqzlHRTKYypcBhcVOLjsBkCjqel4IIU8DfFajkwnUxTz7E7hVFfXHTHLTHHH7iKA7i1ARDYgMwO2Es95S00sHaLcuR1');

const elementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  }
};

const CheckoutForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  
  const appointmentData = location.state;
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Destructure appointmentData with proper fallbacks
  const { 
    totalAmount = 0,
    customerEmail = '',
    services = [],
    service,
    name = 'Guest',
    phone = '',
    isGroupBooking = false,
    appointments = [],
    appointmentDetails = null,
    isReschedule = false,
    appointmentId = null,
    rescheduleData = null
  } = appointmentData || {};

  if (!appointmentData) {
    return (
      <div className="unified-payment-container">
        <div className="payment-error">No booking information found. Please start over.</div>
        <button onClick={() => navigate('/')} className="submit-button">Go Home</button>
      </div>
    );
  }

  const formattedTotalAmount = typeof totalAmount === 'number' ? totalAmount.toLocaleString() : '0';

  // CORRECTED handleSubmit function
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setError('Payment system is still loading. Please wait...');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Convert LKR to USD cents for Stripe
      const amountInLKR = totalAmount;
      const amountInUSDCents = Math.max(50, Math.round((amountInLKR * 100) / 200));
      
      console.log('💰 Payment Details:', {
        originalAmountLKR: amountInLKR,
        amountUSDCents: amountInUSDCents,
        isGroupBooking: isGroupBooking,
        appointmentCount: appointments?.length || 1
      });

      // Step 1: Create payment intent
      const response = await fetch('https://dpdlab1.slt.lk:8447/salon-api/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInUSDCents,
          currency: 'usd',
          customer_email: customerEmail,
          metadata: {
            isGroupBooking: isGroupBooking.toString(),
            appointmentCount: (appointments?.length || 1).toString()
          }
        }),
      });

      let responseData;
      try {
        responseData = await response.json();
        console.log('✅ Payment intent response:', responseData);
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        const errorMsg = responseData.error || responseData.details || `Payment failed: ${response.status}`;
        throw new Error(errorMsg);
      }

      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to create payment intent');
      }

      const { clientSecret } = responseData;
      
      if (!clientSecret) {
        throw new Error('No client secret received from server');
      }

      console.log('🔐 Confirming payment with Stripe...');
      
      // Step 2: Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: {
              email: customerEmail,
              name: name
            }
          }
        }
      );

      if (stripeError) {
        console.error('❌ Stripe error:', stripeError);
        throw new Error(stripeError.message || 'Payment failed');
      }

      console.log('✅ Payment successful! Payment Intent:', paymentIntent.id);
      
      // Step 3: Create appointment and clear data
      await handleAppointmentCreation(paymentIntent.id); // FIXED: use paymentIntent.id
      
    } catch (err) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // CORRECTED handleAppointmentCreation function
  const handleAppointmentCreation = async (paymentIntentId) => {
    try {
      if (isReschedule) {
        // Handle rescheduling
        const res = await fetch(`https://dpdlab1.slt.lk:8447/salon-api/api/appointments/${appointmentId}/reschedule`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...rescheduleData,
            phone: phone,
            paymentIntentId: paymentIntentId
          }),
        });
        
        const data = await res.json();
        
        if (data.success) {
          clearBookingData();
          alert("Appointment rescheduled successfully!");
          navigate("/appointments");
        } else {
          throw new Error(data.message || "Failed to reschedule appointment");
        }
      } else {
        // Handle new booking - supports both single and group booking
        const bookingData = {
          phone: phone,
          email: customerEmail,
          name: name,
          paymentIntentId: paymentIntentId,
          isGroupBooking: isGroupBooking
        };

        // Determine appointments data structure
        if (isGroupBooking && appointments && appointments.length > 0) {
          // Group booking with multiple appointments
          bookingData.appointments = appointments;
          console.log(`📤 Creating ${appointments.length} group appointments`);
        } else if (appointmentDetails) {
          // Single booking with appointmentDetails
          bookingData.appointments = [appointmentDetails];
          console.log('📤 Creating single appointment');
        } else if (services.length > 0) {
          // Fallback: create from services array
          bookingData.appointments = services.map(service => ({
            serviceName: service.name,
            price: service.price,
            duration: service.duration,
            // Add other required fields with defaults
            memberName: name,
            memberCategory: 'Primary',
            professionalName: 'Any Professional',
            date: new Date().toISOString().split('T')[0],
            startTime: '10:00',
            endTime: '11:00'
          }));
          console.log(`📤 Creating ${services.length} appointments from services`);
        } else {
          throw new Error('No appointment data provided');
        }

        console.log('📤 Sending booking data to backend:', bookingData);

        const res = await fetch("https://dpdlab1.slt.lk:8447/salon-api/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        });

        const data = await res.json();

        if (data.success) {
          // ✅ CLEAR BOOKING DATA AFTER SUCCESSFUL PAYMENT
          clearBookingData();
          
          const message = isGroupBooking 
            ? `Payment successful! ${data.appointments?.length || appointments.length} appointments booked.`
            : "Payment successful! Appointment booked.";
          
          alert(message);
          navigate("/appointments");
        } else {
          throw new Error(data.message || "Failed to book appointment");
        }
      }
    } catch (error) {
      console.error('Appointment creation error:', error);
      setError('Payment successful but failed to create appointment. Please contact support.');
    }
  };

  // CORRECTED clearBookingData function
  const clearBookingData = () => {
    // Clear all booking related data from localStorage
    const itemsToClear = [
      'bookedAppointments',
      'isGroupBooking', 
      'groupMembers',
      'selectedSalon',
      'selectedServices',
      'selectedProfessional'
    ];
    
    itemsToClear.forEach(item => localStorage.removeItem(item));
    
    console.log('✅ Cleared all booking data after successful payment');
  };

  // Get display service name for summary
  const getServiceDisplayName = () => {
    if (services.length > 0) {
      return services.map(s => s.name).join(', ');
    }
    if (service?.name) {
      return service.name;
    }
    if (appointments?.length > 0) {
      return `${appointments.length} appointment(s)`;
    }
    return 'Service';
  };

  return (
    <div className="unified-payment-container">
      <form onSubmit={handleSubmit} className="payment-form">
        <h2 className="payment-header">Complete Your Payment</h2>
        
        <div className="payment-summary">
          <h3 className="summary-title">Booking Summary</h3>
          
          <div className="summary-item">
            <span>Customer:</span>
            <span>{name}</span>
          </div>
          
          <div className="summary-item">
            <span>Service:</span>
            <span>{getServiceDisplayName()}</span>
          </div>
          
          {isGroupBooking && appointments && (
            <div className="summary-item">
              <span>Appointments:</span>
              <span>{appointments.length} people</span>
            </div>
          )}
          
          <div className="summary-total">
            <span>Total Amount:</span>
            <span className="total-amount">LKR {formattedTotalAmount}</span>
          </div>
        </div>

        <div className="payment-details">
          <h3 className="payment-details-title">Payment Details</h3>
          
          <div className="payment-details-group">
            <label>Card Number</label>
            <div className="card-input">
              <CardNumberElement options={elementOptions} />
            </div>
          </div>
          
          <div className="form-row">
            <div className="payment-details-group">
              <label>Expiration (MM/YY)</label>
              <div className="card-input">
                <CardExpiryElement options={elementOptions} />
              </div>
            </div>
            
            <div className="payment-details-group">
              <label>CVC</label>
              <div className="card-input">
                <CardCvcElement options={elementOptions} />
              </div>
            </div>
          </div>
        </div>

        <div className="payment-footer">
          {error && <div className="payment-error">{error}</div>}
          
          <button 
            type="submit" 
            disabled={!stripe || processing}
            className="submit-button"
          >
            {processing ? 'Processing...' : `Pay LKR ${formattedTotalAmount} Now`}
          </button>
          
          <div className="booking-notice">
            <p>Your booking will be confirmed once payment is completed.</p>
            <p><strong>Test Card:</strong> 4242 4242 4242 4242</p>
            {isGroupBooking && (
              <p><strong>Group Booking:</strong> {appointments?.length || 0} appointments</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

const Payment = () => (
  <Elements stripe={stripePromise}>
    <CheckoutForm />
  </Elements>
);

export default Payment;