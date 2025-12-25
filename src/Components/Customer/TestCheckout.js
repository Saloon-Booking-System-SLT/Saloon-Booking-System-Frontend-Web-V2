import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

/**
 * Test Checkout Page with Dummy Data
 * Access at: http://localhost:3000/test-checkout
 * 
 * This page demonstrates the PayHere integration with pre-filled test data
 */
const TestCheckout = () => {
    const navigate = useNavigate();

    // Dummy appointment data
    const dummyAppointmentData = {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "0771234567",
        address: "123 Main Street",
        city: "Colombo",
        service: {
            _id: "64f1b2c3aab0a1aaa3c4d5e0",
            name: "Premium Haircut & Styling",
            price: 2500,
            duration: "45 minutes"
        },
        professional: {
            _id: "64f1b2c3aab0a1aaa3c4d5e2",
            name: "Michael Johnson"
        },
        salon: {
            _id: "64f1b2c3aab0a1aaa3c4d5e1",
            name: "Elite Salon & Spa",
            location: "Colombo 07"
        },
        selectedDate: new Date().toISOString(),
        selectedTime: "15:00",
        appointmentDetails: {
            salonId: "64f1b2c3aab0a1aaa3c4d5e1",
            professionalId: "64f1b2c3aab0a1aaa3c4d5e2",
            serviceName: "Premium Haircut & Styling",
            price: 2500,
            duration: "45 minutes",
            date: new Date().toISOString(),
            startTime: "15:00",
            endTime: "15:45",
            professionalName: "Michael Johnson"
        }
    };

    const handleNavigateToRealCheckout = () => {
        navigate('/checkoutpage', { state: dummyAppointmentData });
    };

    return (
        <div className="checkout-container">
            <div className="checkout-content">
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    maxWidth: '800px',
                    margin: '0 auto'
                }}>
                    <h1 style={{
                        fontSize: '32px',
                        marginBottom: '20px',
                        color: '#333'
                    }}>
                        🧪 PayHere Integration Test Page
                    </h1>

                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '30px',
                        borderRadius: '12px',
                        marginBottom: '30px',
                        textAlign: 'left'
                    }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Test Appointment Details</h2>

                        <div style={{ marginBottom: '10px' }}>
                            <strong>Customer:</strong> John Doe
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Email:</strong> john.doe@example.com
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Phone:</strong> 0771234567
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Service:</strong> Premium Haircut & Styling
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Professional:</strong> Michael Johnson
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Salon:</strong> Elite Salon & Spa
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Date:</strong> {new Date().toLocaleDateString()}
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Time:</strong> 15:00 - 15:45
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Amount:</strong> LKR 2,500
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: '#e3f2fd',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '30px',
                        textAlign: 'left'
                    }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>ℹ️ Testing Instructions</h3>
                        <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li>Click the button below to go to checkout page</li>
                            <li>Select "PayHere (Online Payment)" option</li>
                            <li>Click "Continue to Payment" to create appointment</li>
                            <li>Click "Pay with PayHere" to initiate payment</li>
                            <li>You'll be redirected to PayHere sandbox</li>
                        </ol>
                    </div>

                    <button
                        onClick={handleNavigateToRealCheckout}
                        style={{
                            padding: '15px 40px',
                            fontSize: '18px',
                            fontWeight: '600',
                            backgroundColor: '#FF6B00',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginRight: '15px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#e55f00'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#FF6B00'}
                    >
                        🚀 Go to Checkout Page
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '15px 40px',
                            fontSize: '18px',
                            fontWeight: '600',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                    >
                        🏠 Back to Home
                    </button>

                    <div style={{
                        marginTop: '40px',
                        padding: '20px',
                        backgroundColor: '#fff3cd',
                        borderRadius: '8px',
                        textAlign: 'left'
                    }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>⚠️ Important Notes</h3>
                        <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li>Ensure backend is running on <code>http://localhost:3000</code></li>
                            <li>PayHere initiate endpoint: <code>/api/payments/payhere/initiate</code></li>
                            <li>Test appointment will be created in the database</li>
                            <li>Use PayHere sandbox test credentials for payment</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestCheckout;
