import React, { useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import { XMarkIcon, CheckIcon, NoSymbolIcon, ClockIcon } from '@heroicons/react/24/outline';

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
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled':
      case 'cancel': return 'bg-red-100 text-red-800';
      case 'booked': return 'bg-indigo-100 text-indigo-800';
      case 'arrived': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatusDisplay = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleStatusChange = async (id, newStatus, event) => {
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

      const statusText = formatStatusDisplay(newStatus);
      setNotification({
        type: 'success',
        message: `Appointment ${statusText}! Notification sent to ${client.name}.`
      });

      setTimeout(() => setNotification(null), 4000);

    } catch (err) {
      console.error("Failed to update status", err);
      setNotification({
        type: 'error',
        message: `Failed to update appointment status. Please try again.`
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative fade-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Background */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 h-24 absolute top-0 left-0 right-0 z-0"></div>

        <button
          className="absolute top-4 right-4 z-10 text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
          onClick={onClose}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Notification Banner */}
        {notification && (
          <div className={`absolute top-0 left-0 right-0 z-20 px-4 py-3 text-sm font-medium text-center shadow-md border-b flex items-center justify-center gap-2 ${notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
            {notification.type === 'error' ? <NoSymbolIcon className="w-4 h-4" /> : <CheckIcon className="w-4 h-4" />}
            {notification.message}
          </div>
        )}

        <div className="px-6 pt-16 pb-6 relative z-10 flex flex-col flex-1 overflow-hidden">
          {/* Profile Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-white mb-3 text-2xl font-black text-primary-600">
              {client.avatar}
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight text-center">{client.name}</h2>
            <p className="text-sm text-gray-500 text-center">{client.email}</p>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 flex justify-center">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
            >
              {actionOptions.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Appointments Section */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Client Appointments</h3>

            {client.appointments.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-medium">No appointments history</p>
              </div>
            ) : client.appointments.map((appt, idx) => {
              const status = statuses[appt.id] || appt.status;
              const statusClass = getStatusColor(status);

              return (
                <div key={idx} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 mb-3 transition-colors hover:border-gray-200 hover:bg-white group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-bold text-gray-900 block">{appt.service}</span>
                      <span className="text-xs text-gray-500 font-medium">{appt.date} at {appt.time}</span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${statusClass}`}>
                      {formatStatusDisplay(status)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 border-t border-gray-200/50 pt-3">
                    <span className="text-sm font-black text-primary-600">{appt.price}</span>

                    {status !== 'completed' && status !== 'cancelled' && status !== 'cancel' && (
                      <div className="flex gap-2">
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-colors shadow-sm"
                          onClick={(e) => handleStatusChange(appt.id, 'completed', e)}
                        >
                          <CheckIcon className="w-3.5 h-3.5" /> Complete
                        </button>
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors shadow-sm"
                          onClick={(e) => handleStatusChange(appt.id, 'cancelled', e)}
                        >
                          <XMarkIcon className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100">
            <button className="w-full btn-secondary py-2.5">
              Reschedule Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
