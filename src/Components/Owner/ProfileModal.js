import React, { useState } from 'react';
import './ProfileModal.css';
import { API_BASE_URL } from '../../config/api';

const ProfileModal = ({ isOpen, onClose, selectedClient = null }) => {
  const [selectedAction, setSelectedAction] = useState('Actions');
  const [statusDropdowns, setStatusDropdowns] = useState({});
  const [statuses, setStatuses] = useState({});

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

  const statusOptions = [
    'Booked',
    'Confirmed',
    'Arrived',
    'Started',
    'Completed',
    'Cancel',
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Booked': return '#60a5fa';
      case 'Confirmed': return '#10b981';
      case 'Arrived': return '#f59e0b';
      case 'Started': return '#8b5cf6';
      case 'Completed': return '#22c55e';
      case 'Cancel': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const toggleDropdown = (id) => {
    setStatusDropdowns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setStatuses(prev => ({ ...prev, [id]: newStatus }));
      setStatusDropdowns(prev => ({ ...prev, [id]: false }));
    } catch (err) {
      console.error("❌ Failed to update status", err);
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
            const isOpen = statusDropdowns[appt.id];

            return (
              <div key={idx} className="appointment-card">
                <div className="appointment-header">
                  <div>
                    <span className="appointment-date-time">{appt.date}</span>
                    <span className="appointment-time">{appt.time}</span>
                  </div>

                  <div className="appointment-status">
                    <div className="status-badge" style={{ backgroundColor: getStatusColor(status) }} onClick={() => toggleDropdown(appt.id)}>
                      {status}
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" /></svg>
                    </div>

                    {isOpen && (
                      <div className="status-dropdown-menu">
                        {statusOptions.map(opt => (
                          <div key={opt} className="status-dropdown-item" onClick={() => handleStatusChange(appt.id, opt)}>
                            {opt === status && (
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="check-icon">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            )}
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="appointment-details">
                  <h4>{appt.service}</h4>
                  <p className="service-price">{appt.price}</p>
                </div>
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
