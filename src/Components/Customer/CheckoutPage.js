import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../Api/axios';
import { ShieldCheckIcon, CreditCardIcon, ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Safety check for missing state
  if (!location.state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">No Booking Details Found</h2>
          <p className="text-sm text-gray-500 mb-8">We couldn't find the details for this checkout session.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-dark-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
          >
            Return to Home
          </button>
        </div>
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

  const handlePayHereCheckout = async () => {
    setIsLoading(true);
    try {
      // Determine Identifier and Amount
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
        appointmentId: finalId,
        isGroupBooking: !!isGroupBooking,
        amount: finalAmount,
        currency: "LKR",
        items: itemsDescription,
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

      // 2. Call Backend to Init Payment
      const response = await axios.post('/payments/payhere/initiate', payload);
      const result = response.data;

      if (result.success && result.data) {
        // 3. Auto-Submit Form to PayHere
        submitPayHereForm(result.data);
        
        // Show popup notification
        alert('Payment window opened. Please complete your payment in the new window.');
      } else {
        alert('Failed to initiate payment. Please try again.');
        console.error('Payment init failed:', result);
      }
    } catch (error) {
      console.error('Error initiating PayHere payment:', error);
      alert('An error occurred. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitPayHereForm = (data) => {
    console.log('🔮 Submitting PayHere form with data:', data);
    
    // Append mandatory return_url and cancel_url if missing
    const formData = {
      ...data,
      return_url: data.return_url || `${window.location.origin}/confirmationpage`,
      cancel_url: data.cancel_url || window.location.href,
    };

    console.log('📝 Final PayHere form data:', formData);

    // Open PayHere in a new window so it can be closed properly
    const paymentWindow = window.open('', 'payhere_payment', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (!paymentWindow) {
      alert('Please allow popups for this site to process payment');
      return;
    }

    const form = document.createElement('form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', 'https://sandbox.payhere.lk/pay/checkout');
    form.setAttribute('target', 'payhere_payment');
    form.style.display = 'none';

    Object.keys(formData).forEach(key => {
      const input = document.createElement('input');
      input.setAttribute('type', 'hidden');
      input.setAttribute('name', key);
      input.setAttribute('value', formData[key]);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    
    // Remove form after submission
    setTimeout(() => {
      document.body.removeChild(form);
    }, 1000);
  };

  // Helper to render single item summary
  const renderSingleSummary = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-500">Service</span>
        <span className="text-sm font-bold text-gray-900">{service?.name || 'Unknown Service'}</span>
      </div>
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-500">Professional</span>
        <span className="text-sm font-bold text-gray-900">{professional?.name || 'Any Professional'}</span>
      </div>
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-500">Date & Time</span>
        <span className="text-sm font-bold text-gray-900">
          {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
        </span>
      </div>
    </div>
  );

  // Helper to render group summary
  const renderGroupSummary = () => (
    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 hide-scrollbar">
      {appointmentDetails.map((appt, idx) => (
        <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex justify-between items-start mb-1">
            <span className="font-bold text-gray-900 text-sm">{appt.serviceName}</span>
            <span className="font-black text-dark-900 text-sm">LKR {appt.price}</span>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            {appt.memberName} <span className="text-gray-400">({appt.memberCategory})</span> • {appt.startTime}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans flex flex-col items-center justify-center p-4">

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-dark-900 rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-bold text-gray-900 animate-pulse">
            Connecting to securely process payment...
          </p>
        </div>
      )}

      <div className="w-full max-w-lg fade-in slide-up">
        {/* Header Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-dark-900 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to details
        </button>

        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">

          {/* Top Header */}
          <div className="bg-dark-900 px-8 py-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black mb-1">Checkout</h1>
                <p className="text-gray-300 text-sm font-medium">Complete your {isGroupBooking ? 'group booking' : 'appointment'} securely</p>
              </div>
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <CreditCardIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Order Summary</h3>

            {isGroupBooking ? renderGroupSummary() : renderSingleSummary()}

            <div className="flex justify-between items-center py-4 border-b border-gray-100 mt-2">
              <span className="text-sm font-medium text-gray-500">Location</span>
              <span className="text-sm font-bold text-gray-900 text-right">{salon?.name || 'Salon unavailable'}</span>
            </div>

            <div className="mt-8 bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-gray-500">Total Amount</span>
                <span className="text-3xl font-black text-dark-900">
                  LKR {isGroupBooking
                    ? (totalAmount || 0).toLocaleString()
                    : (service?.price ? service.price.toLocaleString() : '0.00')}
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <button
                onClick={handlePayHereCheckout}
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${isLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/30'
                  }`}
              >
                {isLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CreditCardIcon className="w-5 h-5" />
                    Secure Pay via PayHere
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 py-2 px-4 rounded-full w-fit mx-auto border border-green-100">
              <ShieldCheckIcon className="w-4 h-4" />
              <span>Payments are secure & encrypted</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;