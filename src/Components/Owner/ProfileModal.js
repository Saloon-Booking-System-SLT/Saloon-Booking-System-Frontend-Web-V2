import React, { useState } from 'react';
import './ProfileModal.css';
import { API_BASE_URL } from '../../config/api';

const ProfileModal = ({ isOpen, onClose, selectedClient = null }) => {
  const [selectedAction, setSelectedAction] = useState('Actions');
  const [statuses, setStatuses] = useState({});
  const [notification, setNotification] = useState(null);

  if (!isOpen || !selectedClient) return null;

  const client = {
    name: selectedClient.name || 'Unknown User',
    email: selectedClient.email || 'unknown@example.com',
    avatar: selectedClient.avatar || 'U',
    appointments: selectedClient.appointments || [],
  };

  const actionOptions = [
    'Actions',
    'Edit Profile',
    'View History',
    'Send Message',
    'Block Client',
    'Delete Client',
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'completed': return '#22c55e';
      case 'cancelled': return '#ef4444';
      case 'cancel': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const formatStatusDisplay = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleStatusChange = async (id, newStatus, event) => {
    // Prevent triggering multiple times
    if (event) event.stopPropagation();
    
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }
      
      setStatuses(prev => ({ ...prev, [id]: newStatus }));
      
      // Show success notification
      const statusText = formatStatusDisplay(newStatus);
      setNotification({
        type: 'success',
        message: `✅ Appointment ${statusText}! Email notification sent to ${client.name}.`
      });
      
      // Auto-hide notification after 4 seconds
      setTimeout(() => setNotification(null), 4000);
      
      console.log(`✅ Appointment ${id} status updated to ${newStatus}. Email notification sent to customer.`);
    } catch (err) {
      console.error("❌ Failed to update status", err);
      setNotification({
        type: 'error',
        message: `❌ Failed to update appointment status. Please try again.`
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Notification Banner */}
        {notification && (
          <div className={`notification-banner ${notification.type}`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar"><span>{client.avatar}</span></div>
          <div className="profile-info">
            <h2>{client.name}</h2>
            <p className="profile-email">{client.email}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="actions-section">
          <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} className="actions-select">
            {actionOptions.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Appointments */}
        <div className="services-section">
          <h3 className="section-title">Appointments</h3>

          {client.appointments.length === 0 ? (
            <p className="no-appointments">No appointments available</p>
          ) : client.appointments.map((appt, idx) => {
            const status = statuses[appt.id] || appt.status;

            return (
              <div key={idx} className="appointment-card">
                <div className="appointment-header">
                  <div>
                    <span className="appointment-date-time">{appt.date}</span>
                    <span className="appointment-time">{appt.time}</span>
                  </div>

                  <div className="status-badge" style={{ backgroundColor: getStatusColor(status) }}>
                    {formatStatusDisplay(status)}
                  </div>
                </div>

                <div className="appointment-details">
                  <h4>{appt.service}</h4>
                  <p className="service-price">{appt.price}</p>
                </div>

                {/* Action Buttons */}
                {status !== 'completed' && status !== 'cancelled' && (
                  <div className="appointment-actions">
                    <button 
                      className="btn-complete" 
                      onClick={(e) => handleStatusChange(appt.id, 'completed', e)}
                    >
                      ✓ Complete
                    </button>
                    <button 
                      className="btn-cancel-appointment" 
                      onClick={(e) => handleStatusChange(appt.id, 'cancelled', e)}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button className="reschedule-btn">Reschedule</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
