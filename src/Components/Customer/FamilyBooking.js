import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const FamilyBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [salon, setSalon] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([{
    id: Date.now(),
    name: '',
    relationship: ''
  }]);
  const [bookedAppointments, setBookedAppointments] = useState([]);

  // Get salon data and existing appointments from location state or localStorage
  useEffect(() => {
    const salonFromState = location.state?.salon;
    const salonFromStorage = JSON.parse(localStorage.getItem('selectedSalon'));
    const bookedFromState = location.state?.bookedAppointments || [];
    const bookedFromStorage = JSON.parse(localStorage.getItem('bookedAppointments')) || [];
    
    if (salonFromState) {
      setSalon(salonFromState);
      localStorage.setItem('selectedSalon', JSON.stringify(salonFromState));
    } else if (salonFromStorage) {
      setSalon(salonFromStorage);
    }

    // Load booked appointments
    const existingBookings = bookedFromState.length > 0 ? bookedFromState : bookedFromStorage;
    if (existingBookings.length > 0) {
      setBookedAppointments(existingBookings);
      console.log('Loaded existing appointments:', existingBookings);
    }
  }, [location.state]);

  const updateFamilyMember = (id, field, value) => {
    setFamilyMembers(familyMembers.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    ));
  };

  const removeFamilyMember = (id) => {
    if (familyMembers.length > 1) {
      setFamilyMembers(familyMembers.filter(member => member.id !== id));
    }
  };

  // Calculate total for booked appointments only
  const calculateBookedTotal = () => {
    return bookedAppointments.reduce((total, appointment) => {
      return total + (Number(appointment.price) || 0);
    }, 0);
  };

  const handleContinue = () => {
    if (!salon) {
      alert('No salon selected. Please go back and select a salon first.');
      return;
    }

    // Validate all family members have name and relationship
    const incompleteMembers = familyMembers.filter(member => 
      !member.name.trim() || !member.relationship
    );

    if (incompleteMembers.length > 0) {
      alert('Please complete all family member details (name and relationship)');
      return;
    }

    // Prepare group members data
    const groupMembers = familyMembers.map(member => ({
      name: member.name,
      category: member.relationship
    }));

    // Store data in localStorage
    localStorage.setItem('isGroupBooking', JSON.stringify(true));
    localStorage.setItem('groupMembers', JSON.stringify(groupMembers));
    localStorage.setItem('bookedAppointments', JSON.stringify(bookedAppointments));

    // Navigate to select service page (not time page yet)
    navigate(`/familybookingselectservice/${salon._id}`, {
      state: { 
        salon,
        isGroupBooking: true,
        groupMembers: groupMembers,
        bookedAppointments: bookedAppointments,
        fromFamilyBooking: true
      } 
    });
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <h1 style={styles.mainTitle}>Group Booking</h1>
        
        {/* Show booked appointments summary if any */}
        {bookedAppointments.length > 0 && (
          <div style={styles.bookedSummary}>
            <h2 style={styles.bookedTitle}>✅ Booked Appointments ({bookedAppointments.length})</h2>
            <div style={styles.bookedList}>
              {bookedAppointments.map((appointment, index) => (
                <div key={index} style={styles.bookedCard}>
                  <div style={styles.bookedCardHeader}>
                    <strong>👤 {appointment.memberName}</strong>
                    <span style={styles.categoryBadge}>{appointment.memberCategory}</span>
                  </div>
                  <div style={styles.bookedCardDetails}>
                    <p>💇 <strong>{appointment.serviceName}</strong></p>
                    <p>🧑‍💼 {appointment.professionalName}</p>
                    <p>📅 {new Date(appointment.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</p>
                    <p>🕒 {appointment.startTime} - {appointment.endTime}</p>
                    <p style={styles.priceText}>LKR {appointment.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.bookedTotal}>
              <span>Total Booked:</span>
              <strong>LKR {calculateBookedTotal().toLocaleString()}</strong>
            </div>
          </div>
        )}

        {/* Add New Members Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            {bookedAppointments.length > 0 ? 'Add More Appointments' : 'Add Appointment'}
          </h2>
          
          <div style={styles.familyMembersList}>
            {familyMembers.map((member, index) => (
              <div key={member.id} style={styles.familyMemberCard}>
                <div style={styles.familyMemberHeader}>
                  <h3 style={styles.familyMemberTitle}>Appointment </h3>
                  {familyMembers.length > 1 && (
                    <button
                      onClick={() => removeFamilyMember(member.id)}
                      style={styles.removeButton}
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div style={styles.familyMemberForm}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Name</label>
                    <input
                      type="text"
                      placeholder="Enter name"
                      value={member.name}
                      onChange={(e) => updateFamilyMember(member.id, 'name', e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Select Category</label>
                    <select
                      value={member.relationship}
                      onChange={(e) => updateFamilyMember(member.id, 'relationship', e.target.value)}
                      style={styles.select}
                    >
                      <option value="">Select Category</option>
                      <option value="Lady">Lady</option>
                      <option value="Gentleman">Gentleman</option>
                      <option value="Teenager">Teenager</option>
                      <option value="Kid">Kid</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* REMOVED: Add Another Family Member Button */}

          <div style={styles.buttonGroup}>
            <button 
              style={styles.continueButton}
              onClick={handleContinue}
            >
              Continue to Select Services
            </button>
            
            {/* REMOVED: Finish & Confirm All Bookings Button */}
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  main: {
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
    padding: '2rem 1.5rem'
  },
  mainTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '2rem',
    textAlign: 'center',
    color: '#1f2937'
  },
  bookedSummary: {
    backgroundColor: '#ecfdf5',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
    border: '2px solid #10b981'
  },
  bookedTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#059669',
    margin: '0 0 1rem 0'
  },
  bookedList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem'
  },
  bookedCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid #d1fae5',
    fontSize: '0.875rem'
  },
  bookedCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #f0fdf4'
  },
  categoryBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  bookedCardDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  priceText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: '1rem',
    marginTop: '0.25rem'
  },
  bookedTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#059669'
  },
  section: {
    marginBottom: '2rem'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#374151',
    textAlign: 'center'
  },
  familyMembersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '1.5rem'
  },
  familyMemberCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  familyMemberHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #f3f4f6'
  },
  familyMemberTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: 0,
    color: '#1f2937'
  },
  removeButton: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  familyMemberForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.25rem'
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.2s',
    outline: 'none'
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    outline: 'none'
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  continueButton: {
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.2s'
  }
};

export default FamilyBooking;