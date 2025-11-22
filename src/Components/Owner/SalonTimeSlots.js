import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../Assets/logo.png';
import './SalonTimeSlots.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SalonTimeSlots = () => {
  const navigate = useNavigate();
  const salon = JSON.parse(localStorage.getItem("salonUser"));

  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newSlot, setNewSlot] = useState({
    startTime: '09:00',
    endTime: '10:00',
  });

  // Fetch professionals on mount
  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/professionals/${salon.id}`);
        setProfessionals(res.data);
        if (res.data.length > 0) {
          setSelectedProfessionalId(res.data[0]._id);
        }
      } catch (err) {
        console.error("Error fetching professionals:", err);
      }
    };
    fetchProfessionals();
  }, [salon.id]);

  const fetchTimeSlots = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/timeslots`, {
        params: { professionalId: selectedProfessionalId, date: selectedDate }
      });
      setTimeSlots(res.data);
    } catch (err) {
      console.error("Error fetching time slots:", err);
    }
  }, [selectedProfessionalId, selectedDate]);

  // Fetch time slots when professional or date changes
  useEffect(() => {
    if (!selectedProfessionalId || !selectedDate) return;
    fetchTimeSlots();
  }, [selectedProfessionalId, selectedDate, fetchTimeSlots]);

  const handleAddTimeSlot = async () => {
    if (!newSlot.startTime || !newSlot.endTime) {
      alert("Please fill all fields");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/timeslots`, {
        salonId: salon.id,
        professionalId: selectedProfessionalId,
        date: selectedDate,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime
      });
      
      setShowAddModal(false);
      setNewSlot({ startTime: '09:00', endTime: '10:00' });
      fetchTimeSlots();
      alert("Time slot added successfully!");
    } catch (err) {
      console.error("Error adding time slot:", err);
      alert("Failed to add time slot");
    }
  };

  const handleGenerateSlots = async () => {
    if (!window.confirm("Generate time slots from 9:00 AM to 6:00 PM (1-hour intervals)?")) return;

    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      slots.push({
        salonId: salon.id,
        professionalId: selectedProfessionalId,
        date: selectedDate,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
      });
    }

    try {
      await Promise.all(slots.map(slot => axios.post(`${API_BASE_URL}/timeslots`, slot)));
      fetchTimeSlots();
      alert("Time slots generated successfully!");
    } catch (err) {
      console.error("Error generating time slots:", err);
      alert("Failed to generate time slots");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Delete this time slot?")) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/timeslots/${slotId}`);
      fetchTimeSlots();
      alert("Time slot deleted successfully!");
    } catch (err) {
      console.error("Error deleting time slot:", err);
      alert("Failed to delete time slot");
    }
  };

  return (
    <div className="timeslot-container">
      <aside className="modern-sidebar">
        <img src={logo} alt="Brand Logo" className="modern-logo" />
        <i className="fas fa-home" title="Home" onClick={() => navigate('/dashboard')}></i>
        <i className="fas fa-calendar-alt" title="Calendar" onClick={() => navigate('/calendar')}></i>
        <i className="fas fa-smile" title="Services" onClick={() => navigate('/services')}></i>
        <i className="fas fa-comment" title="Feedbacks" onClick={() => navigate('/feedbacks')}></i>
        <i className="fas fa-users" title="Professionals" onClick={() => navigate('/professionals')}></i>
        <i className="fas fa-clock active" title="Time Slots"></i>
      </aside>

      <div className="timeslot-main">
        <header className="timeslot-header">
          <h1>Manage Time Slots</h1>
          <div className="timeslot-controls">
            <button className="btn-generate" onClick={handleGenerateSlots}>
              Generate Daily Slots
            </button>
            <button className="btn-add" onClick={() => setShowAddModal(true)}>
              + Add Time Slot
            </button>
          </div>
        </header>

        <div className="timeslot-filters">
          <label>
            Professional:
            <select value={selectedProfessionalId} onChange={(e) => setSelectedProfessionalId(e.target.value)}>
              {professionals.map(pro => (
                <option key={pro._id} value={pro._id}>{pro.name}</option>
              ))}
            </select>
          </label>

          <label>
            Date:
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </label>
        </div>

        <div className="timeslot-list">
          <h2>Available Time Slots ({timeSlots.length})</h2>
          {timeSlots.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-clock"></i>
              <p>No time slots available for this date</p>
              <p>Click "Add Time Slot" or "Generate Daily Slots" to create slots</p>
            </div>
          ) : (
            <div className="slots-grid">
              {timeSlots.map(slot => (
                <div key={slot._id} className={`slot-card ${slot.isBooked ? 'booked' : 'available'}`}>
                  <div className="slot-time">
                    {slot.startTime} - {slot.endTime}
                  </div>
                  <div className="slot-status">
                    {slot.isBooked ? '🔴 Booked' : '🟢 Available'}
                  </div>
                  {!slot.isBooked && (
                    <button className="btn-delete" onClick={() => handleDeleteSlot(slot._id)}>
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Time Slot Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Time Slot</h2>
            <label>
              Start Time:
              <input 
                type="time" 
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
              />
            </label>
            <label>
              End Time:
              <input 
                type="time" 
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
              />
            </label>
            <div className="modal-actions">
              <button className="btn-save" onClick={handleAddTimeSlot}>Add Slot</button>
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonTimeSlots;