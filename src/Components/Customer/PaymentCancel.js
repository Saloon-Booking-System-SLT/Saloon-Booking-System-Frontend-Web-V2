import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ConfirmationPage.css';

const PaymentCancel = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const orderId = searchParams.get('order_id');

    useEffect(() => {
        // Log payment cancellation details
        console.log('❌ Payment Cancelled:', {
            orderId,
            allParams: Object.fromEntries(searchParams.entries())
        });
    }, [orderId, searchParams]);

    return (
        <div className="confirmation-container">
            <div className="confirmation-card">
                <div className="confirmation-header">
                    <div className="success-icon" style={{ backgroundColor: '#ff6b6b' }}>❌</div>
                    <h1>Payment Cancelled</h1>
                    <p className="thank-you-message">
                        Your payment was cancelled. No charges were made.
                    </p>
                </div>

                <div className="confirmation-details">
                    <div className="booking-summary">
                        <h2>What Happened?</h2>

                        {orderId && (
                            <div className="summary-item">
                                <span>Order ID:</span>
                                <strong>{orderId}</strong>
                            </div>
                        )}

                        <div className="summary-item">
                            <p>You cancelled the payment process.</p>
                            <p>Your appointment was created but is not yet confirmed.</p>
                            <p>Please complete the payment to confirm your booking.</p>
                        </div>
                    </div>
                </div>

                <div className="confirmation-actions">
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/appointments')}
                    >
                        View My Appointments
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => navigate('/')}
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancel;
