import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PayHereButton from './PayHereButton';
import './CheckoutPage.css';

/**
 * Standalone PayHere Test Page
 * Access at: http://localhost:3000/payhere-test
 * No authentication required - perfect for testing!
 */
const PayHereTest = () => {
    const navigate = useNavigate();
    const [appointmentId, setAppointmentId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState("0771234567");

    // Dummy appointment data
    const dummyData = {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "0771234567",
        address: "123 Main Street",
        city: "Colombo",
        amount: 2500
    };

    const handleCreateAppointment = async () => {
        setLoading(true);

        try {
            // Simulate appointment creation
            const API_BASE_URL = process.env.REACT_APP_API_URL ?
                process.env.REACT_APP_API_URL.replace('/api', '') :
                'http://localhost:5000';

            const appointmentPayload = {
                phone: phone,
                email: dummyData.email,
                name: dummyData.name,
                appointments: [{
                    salonId: "64f1b2c3aab0a1aaa3c4d5e1",
                    professionalId: "64f1b2c3aab0a1aaa3c4d5e2",
                    serviceName: "Premium Haircut & Styling",
                    price: 2500,
                    duration: "45 minutes",
                    date: new Date().toISOString(),
                    startTime: "15:00",
                    endTime: "15:45",
                    professionalName: "Michael Johnson"
                }]
            };

            console.log('🔨 Creating appointment...', appointmentPayload);

            const response = await fetch(`${API_BASE_URL}/api/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentPayload)
            });

            const data = await response.json();
            console.log('📦 Response:', data);

            if (data.success) {
                // Try different response structures
                const createdId = data.data?.[0]?._id || data.appointments?.[0]?._id || data.appointment?._id;

                if (createdId) {
                    setAppointmentId(createdId);
                    alert(`✅ Appointment created! ID: ${createdId}\n\nNow click "Pay with PayHere" below.`);
                } else {
                    console.error('Full response data:', data);
                    throw new Error(`No appointment ID in response. Received data: ${JSON.stringify(data)}`);
                }
            } else {
                throw new Error(data.message || 'Failed to create appointment');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            alert(`❌ Error: ${error.message}\n\nMake sure your backend is running on localhost:5000`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="checkout-container">
            <div className="checkout-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="checkout-left">
                    <h1 style={{ fontSize: '28px', marginBottom: '20px', textAlign: 'center' }}>
                        🧪 PayHere Integration Test
                    </h1>

                    {/* Test Data Display */}
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '30px'
                    }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Test Appointment Details</h3>
                        <div style={{ lineHeight: '2' }}>
                            <div><strong>Customer:</strong> {dummyData.name}</div>
                            <div><strong>Email:</strong> {dummyData.email}</div>
                            <div><strong>Service:</strong> Premium Haircut & Styling</div>
                            <div><strong>Professional:</strong> Michael Johnson</div>
                            <div><strong>Amount:</strong> LKR {dummyData.amount.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Phone Input */}
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
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    fontSize: '16px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Instructions */}
                    <div style={{
                        backgroundColor: '#e3f2fd',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>📋 How to Test</h3>
                        <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li>Click "Create Appointment" to create test appointment</li>
                            <li>Once created, "Pay with PayHere" button will appear</li>
                            <li>Click it to initiate PayHere payment</li>
                            <li>You'll be redirected to PayHere sandbox</li>
                        </ol>
                    </div>

                    {/* Action Buttons */}
                    {!appointmentId ? (
                        <button
                            onClick={handleCreateAppointment}
                            disabled={loading || !phone}
                            style={{
                                width: '100%',
                                padding: '15px',
                                fontSize: '18px',
                                fontWeight: '600',
                                backgroundColor: loading ? '#ccc' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading || !phone ? 'not-allowed' : 'pointer',
                                marginBottom: '15px'
                            }}
                        >
                            {loading ? '⏳ Creating Appointment...' : '🔨 Create Appointment'}
                        </button>
                    ) : (
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{
                                backgroundColor: '#d4edda',
                                color: '#155724',
                                padding: '12px',
                                borderRadius: '6px',
                                marginBottom: '15px',
                                textAlign: 'center',
                                fontWeight: '600'
                            }}>
                                ✅ Appointment Created! ID: {appointmentId}
                            </div>

                            <PayHereButton
                                appointmentId={appointmentId}
                                amount={dummyData.amount}
                                customer={{
                                    first_name: "John",
                                    last_name: "Doe",
                                    email: dummyData.email,
                                    phone: phone,
                                    address: dummyData.address,
                                    city: dummyData.city,
                                    country: "Sri Lanka"
                                }}
                                onError={(error) => alert(`❌ PayHere Error: ${error}`)}
                            />
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/')}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '16px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        🏠 Back to Home
                    </button>

                    {/* Warning */}
                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: '#fff3cd',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}>
                        <strong>⚠️ Requirements:</strong>
                        <ul style={{ paddingLeft: '20px', marginTop: '10px', lineHeight: '1.6' }}>
                            <li>Backend must be running on <code>localhost:5000</code></li>
                            <li>Endpoint: <code>POST /api/appointments</code></li>
                            <li>PayHere endpoint: <code>POST /api/payments/payhere/initiate</code></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayHereTest;
