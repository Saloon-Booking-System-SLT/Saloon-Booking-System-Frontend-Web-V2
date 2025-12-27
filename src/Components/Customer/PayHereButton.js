import React, { useState } from 'react';
import { initiatePayHerePayment } from '../../services/api';
import { API_BASE_URL } from '../../config/api';

/**
 * PayHereButton Component
 * 
 * Handles PayHere payment flow:
 * 1. User data and appointment details
 * 2. Calls backend to initiate payment and get hash
 * 3. Submits form to PayHere sandbox/live gateway
 * 
 * @param {Object} props
 * @param {string} props.appointmentId - The appointment ID from backend
 * @param {number} props.amount - Payment amount in LKR
 * @param {Object} props.customer - Customer info (first_name, last_name, email, phone, address, city, country)
 * @param {string} props.currency - Currency code (default: LKR)
 * @param {function} props.onError - Error callback
 */
const PayHereButton = ({
    appointmentId,
    amount,
    customer,
    currency = 'LKR',
    onError
}) => {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (!appointmentId || !amount || !customer) {
            const errorMsg = 'Missing required payment information';
            console.error(errorMsg);
            if (onError) onError(errorMsg);
            return;
        }

        setLoading(true);

        try {
            // Step 1: Call backend to initiate payment and get PayHere form data
            console.log('💳 Initiating PayHere payment...', { appointmentId, amount });

            const response = await initiatePayHerePayment({
                appointmentId,
                amount,
                currency,
                customer
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to initiate payment');
            }

            const payhereData = response.data;
            console.log('✅ PayHere payment data received:', payhereData);

            // Step 2: Add return and cancel URLs
            const formData = {
                ...payhereData,
                return_url: `${window.location.origin}/confirmationpage?order_id=${appointmentId}`,
                cancel_url: `${window.location.origin}/payment/cancel`,
                notify_url: 'https://saloon-booking-system-backend-v2.onrender.com/api/payments/payhere/notify'
            };

            // Step 3: Determine PayHere checkout URL
            const payhereUrl = payhereData.sandbox
                ? 'https://sandbox.payhere.lk/pay/checkout'
                : 'https://www.payhere.lk/pay/checkout';

            console.log('🚀 Redirecting to PayHere:', payhereUrl);

            // Step 4: Create and submit form programmatically
            const form = document.createElement('form');
            form.setAttribute('method', 'POST');
            form.setAttribute('action', payhereUrl);

            // Append all fields as hidden inputs
            Object.keys(formData).forEach(key => {
                if (formData[key] !== undefined && formData[key] !== null) {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'hidden');
                    input.setAttribute('name', key);
                    input.setAttribute('value', formData[key]);
                    form.appendChild(input);
                }
            });

            document.body.appendChild(form);
            form.submit();

        } catch (error) {
            console.error('❌ PayHere payment error:', error);
            const errorMsg = error.message || 'Payment initiation failed. Please try again.';
            if (onError) {
                onError(errorMsg);
            } else {
                alert(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="payhere-button"
            style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#ccc' : '#1251af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                width: '100%',
                maxWidth: '400px'
            }}
        >
            {loading ? '⏳ Processing...' : '💳 Pay with PayHere'}
        </button>
    );
};

export default PayHereButton;
