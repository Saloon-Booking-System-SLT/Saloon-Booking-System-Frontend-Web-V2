import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import logo from '../../Assets/logo.png';
import './AdminDashboard.css';
import axios from 'axios';

const LOCAL_STORAGE_KEY = 'admin_salon_profile';

const SalonProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const defaultProfile = useMemo(() => ({
    name: 'Your Salon Name',
    email: 'salon@example.com',
    phone: '+9 400 000 0000',
    address: '123 Main Street, City',
    description: 'Write a short description about your salon...',
    logoDataUrl: '',
    openingHours: 'Mon-Fri: 9:00 - 18:00',
  }), []);

  const [profile, setProfile] = useState(defaultProfile);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadSalonData = async () => {
      try {
        // First try to get salon data from localStorage (from login)
        const salonUser = localStorage.getItem('salonUser');
        if (salonUser) {
          const salonData = JSON.parse(salonUser);
          setProfile(prev => ({
            ...prev,
            name: salonData.name || prev.name,
            email: salonData.email || prev.email,
            phone: salonData.phone || prev.phone,
            address: salonData.location || prev.address,
            openingHours: salonData.workingHours || prev.openingHours,
            logoDataUrl: salonData.image || prev.logoDataUrl, // Load existing image
            description: prev.description
          }));
        }

        // Also try to get from local storage for any additional data
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile(prev => ({ ...prev, ...parsed }));
        }
      } catch (err) {
        console.error('Error loading salon data:', err);
      }
    };

    loadSalonData();
  }, []);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setProfile(prev => ({ ...prev, logoDataUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Get salon ID from localStorage
      const salonUser = localStorage.getItem('salonUser');
      if (!salonUser) {
        throw new Error('No salon user found. Please login again.');
      }
      
      const salonData = JSON.parse(salonUser);
      const salonId = salonData.id;
      
      if (!salonId) {
        throw new Error('No salon ID found. Please login again.');
      }

      // Prepare data for API call
      const updateData = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.address,
        workingHours: profile.openingHours,
        image: profile.logoDataUrl, // Include the logo/image data
        // Note: We're not updating password here for security
      };

      // Call the backend API to update salon
      const response = await axios.put(`https://saloon-booking-system-backend-v2.onrender.com/api/salons/${salonId}`, updateData);
      
      if (response.data) {
        // Update localStorage with new data
        const updatedSalonData = {
          ...salonData,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.address,
          workingHours: profile.openingHours,
          image: profile.logoDataUrl // Include the updated image
        };
        localStorage.setItem('salonUser', JSON.stringify(updatedSalonData));
        
        // Also save to local storage for additional data
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
        
        setSuccess('Profile updated successfully!');
        setSavedAt(new Date());
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('salonProfileUpdated', { 
          detail: { updatedData: updatedSalonData } 
        }));
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-full-page">
      <div className="admin-layout">
        {/* Sidebar matching Admin Dashboard with names before icons */}
        <aside className="admin-sidebar">
          <img src={logo} alt="Brand Logo" className="admin-logo" />
          <div className="sidebar-section" style={{ gap: 6 }}>
            <div className="sidebar-link" onClick={() => navigate('/admin-dashboard')}>
              <i className="fas fa-home"></i>
              <span>Dashboard</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/customers')}>
              <i className="fas fa-users"></i>
              <span>Client</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/admincalendar')}>
              <i className="fas fa-calendar-check"></i>
              <span>Booking</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/professionals')}>
              <i className="fas fa-user-tie"></i>
              <span>Staff</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/services')}>
              <i className="fas fa-concierge-bell"></i>
              <span>Services</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/promotions')}>
              <i className="fas fa-bullhorn"></i>
              <span>Promotions</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="admin-main-content">
          <header className="admin-header">
            <div className="header-left">
              <h1>Salon Profile</h1>
              <p>View and edit your salon details</p>
            </div>
          </header>

          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
              {/* Logo Card */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ margin: '0 0 12px 0' }}>Brand</h3>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 180, height: 180, borderRadius: 12, border: '1px dashed #d0d7de', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f6f8fa' }}>
                    {profile.logoDataUrl ? (
                      <img src={profile.logoDataUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#8c959f' }}>No logo</span>
                    )}
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: '#0d6efd', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>
                    <i className="fas fa-upload"></i>
                    <span>Upload Logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* Details Form */}
              <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ marginTop: 0 }}>Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6e7781', marginBottom: 6 }}>Salon Name</label>
                    <input value={profile.name} onChange={handleChange('name')} className="admin-input" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d0d7de' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6e7781', marginBottom: 6 }}>Phone</label>
                    <input value={profile.phone} onChange={handleChange('phone')} className="admin-input" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d0d7de' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6e7781', marginBottom: 6 }}>Email</label>
                    <input type="email" value={profile.email} onChange={handleChange('email')} className="admin-input" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d0d7de' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6e7781', marginBottom: 6 }}>Opening Hours</label>
                    <input value={profile.openingHours} onChange={handleChange('openingHours')} className="admin-input" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d0d7de' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#6e7781', marginBottom: 6 }}>Address</label>
                    <input value={profile.address} onChange={handleChange('address')} className="admin-input" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d0d7de' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#6e7781', marginBottom: 6 }}>Description</label>
                    <textarea value={profile.description} onChange={handleChange('description')} rows={4} className="admin-input" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d0d7de', resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  {/* Error Message */}
                  {error && (
                    <div style={{ 
                      background: '#fee2e2', 
                      color: '#dc2626', 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      marginBottom: '12px',
                      fontSize: '14px'
                    }}>
                      {error}
                    </div>
                  )}
                  
                  {/* Success Message */}
                  {success && (
                    <div style={{ 
                      background: '#d1fae5', 
                      color: '#059669', 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      marginBottom: '12px',
                      fontSize: '14px'
                    }}>
                      {success}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button 
                      onClick={handleSave} 
                      disabled={saving} 
                      className="logout-btn" 
                      style={{ 
                        background: saving ? '#6b7280' : '#0d6efd', 
                        color: '#fff', 
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {savedAt && (
                      <span style={{ fontSize: 12, color: '#6e7781' }}>Saved {savedAt.toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SalonProfile;
