import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ConfirmationPage.css';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const orderId = searchParams.get('order_id');
    const paymentId = searchParams.get('payment_id');

    useEffect(() => {
        // Log payment success details
        console.log('✅ Payment Success:', {
            orderId,
            paymentId,
            allParams: Object.fromEntries(searchParams.entries())
        });
    }, [orderId, paymentId, searchParams]);

    return (
        <div className="confirmation-container">
            <div className="confirmation-card">
                <div className="confirmation-header">
                    <div className="success-icon">✅</div>
                    <h1>Payment Successful!</h1>
                    <p className="thank-you-message">
                        Your payment has been processed successfully.
                    </p>
                </div>

                <div className="confirmation-details">
                    <div className="booking-summary">
                        <h2>Transaction Details</h2>

                        {orderId && (
                            <div className="summary-item">
                                <span>Order ID:</span>
                                <strong>{orderId}</strong>
                            </div>
                        )}

                        {paymentId && (
                            <div className="summary-item">
                                <span>Payment ID:</span>
                                <strong>{paymentId}</strong>
                            </div>
                        )}

                        <div className="summary-item">
                            <p>🎉 Thank you for your payment! Your appointment has been confirmed.</p>
                            <p>You will receive a confirmation email shortly.</p>
                        </div>
                    </div>
                </div>

                <div className="confirmation-actions">
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/')}
                    >
                        Back to Home
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => navigate('/appointments')}
                    >
                        View My Appointments
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
