import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SelectServicesPage.css";

import { API_URL } from "../../Utils/apiConfig";

const API_BASE_URL = API_URL;

const SelectProfessionalPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // membersWithServices: [{ id, name, category, selectedServices: [...] }]
  const { salon, membersWithServices = [] } = location.state || {};

  const [professionals, setProfessionals] = useState([]);
  const [reviews, setReviews] = useState({});
  const [viewReviewsPro, setViewReviewsPro] = useState(null);
  const [selectedProReviews, setSelectedProReviews] = useState([]);

  // Current member index (tab)
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);

  // Map: memberId -> selected professional object
  const [memberProfessionalMap, setMemberProfessionalMap] = useState(() => {
    const init = {};
    membersWithServices.forEach(m => { init[m.id] = null; });
    return init;
  });

  const currentMember = membersWithServices[currentMemberIndex];
  const isLastMember = currentMemberIndex === membersWithServices.length - 1;

  // Grand total across ALL members
  const grandTotal = membersWithServices.reduce((total, member) => {
    return total + (member.selectedServices || []).reduce((sum, s) => sum + (s.price || 0), 0);
  }, 0);

  // Current member's services total
  const currentMemberTotal = (currentMember?.selectedServices || []).reduce(
    (sum, s) => sum + (s.price || 0), 0
  );

  // Fetch professionals for this salon
  useEffect(() => {
    if (!salon?._id) return;
    fetch(`${API_BASE_URL}/api/professionals/${salon._id}/with-ratings`)
      .then((res) => res.json())
      .then((data) => {
        // --- TEMPORARY MOCK DATA ---
        const mockPros = [
          { _id: 'mock_1', name: 'Shehan De Silva', role: 'Stylist', isNew: false, mockRating: '3.3', mockReviews: 6, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
          { _id: 'mock_2', name: 'onali alwis', role: 'Stylist', isNew: true, mockRating: '0', mockReviews: 0, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
          { _id: 'mock_3', name: 'Andri', role: 'Stylist', isNew: true, mockRating: '0', mockReviews: 0, image: '' },
          { _id: 'mock_4', name: 'Sakith', role: 'Stylist', isNew: true, mockRating: '0', mockReviews: 0, image: '' },
        ];
        
        const finalData = mockPros; // Force use temporary names as requested
        
        setProfessionals(finalData);
        const reviewsObj = {};
        finalData.forEach(pro => {
          reviewsObj[pro._id] = pro.feedbacks || [];
        });
        setReviews(reviewsObj);
      })
      .catch((err) => console.error("Failed to fetch professionals", err));
  }, [salon]);

  // Fetch reviews for all professionals
  useEffect(() => {
    if (!professionals.length) return;
    Promise.all(
      professionals.map((pro) =>
        fetch(`${API_BASE_URL}/api/feedback/professionals/${pro._id}`)
          .then((res) => res.json())
          .then((data) => data.feedbacks)
      )
    ).then((results) => {
      const obj = {};
      professionals.forEach((pro, i) => {
        obj[pro._id] = results[i];
      });
      setReviews(obj);
    });
  }, [professionals]);

  const getAverageRating = (proId) => {
    const feedbacks = reviews[proId] || [];
    if (!feedbacks.length) return 0;
    const total = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
    return (total / feedbacks.length).toFixed(1);
  };

  const getReviewCount = (proId) => reviews[proId]?.length || 0;

  const openReviewPopup = async (pro) => {
    setViewReviewsPro(pro);
    const res = await fetch(`${API_BASE_URL}/api/feedback/professionals/${pro._id}`);
    const data = await res.json();
    setSelectedProReviews(data.feedbacks || []);
  };

  const closeReviewPopup = () => {
    setViewReviewsPro(null);
    setSelectedProReviews([]);
  };

  // Select a professional for the current member
  const selectProfessional = (pro) => {
    if (!currentMember) return;
    setMemberProfessionalMap(prev => ({
      ...prev,
      [currentMember.id]: pro
    }));
  };

  const currentSelectedPro = currentMember ? memberProfessionalMap[currentMember.id] : null;

  // Move to next member
  const handleNextMember = () => {
    if (!currentSelectedPro) {
      alert(`Please select a professional for ${currentMember?.name || 'this member'}`);
      return;
    }
    setCurrentMemberIndex(prev => prev + 1);
  };

  // Final continue — navigate to time selection
  const handleContinue = () => {
    if (!currentSelectedPro) {
      alert(`Please select a professional for ${currentMember?.name || 'this member'}`);
      return;
    }

    // Build final data: each member with their services + chosen professional
    const finalMembersWithServices = membersWithServices.map(member => ({
      ...member,
      professional: memberProfessionalMap[member.id]
    }));

    // For backward compatibility with the time page, pass first member's data as primary
    const firstMember = finalMembersWithServices[0];

    localStorage.setItem("selectedProfessional", JSON.stringify(firstMember?.professional));
    localStorage.setItem("selectedServices", JSON.stringify(firstMember?.selectedServices || []));
    localStorage.setItem("selectedSalon", JSON.stringify(salon));
    localStorage.setItem("groupMembersWithServices", JSON.stringify(finalMembersWithServices));

    navigate("/familybookingselecttimepage", {
      state: {
        salon,
        selectedServices: firstMember?.selectedServices || [],
        selectedProfessional: firstMember?.professional,
        membersWithServices: finalMembersWithServices,
        isGroupBooking: true,
      },
    });
  };

  return (
    <div className="select-services-container" style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb', fontFamily: '"Inter", "Poppins", sans-serif' }}>
      <div className="left-column" style={{ flex: '2', padding: '40px 80px', overflowY: 'auto', backgroundColor: '#f9fafb', borderRight: 'none' }}>
        <p className="breadcrumb" style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>1. Services</span> <span style={{ color: '#d1d5db' }}>&gt;</span> <span style={{ color: '#111827', fontWeight: '600' }}>2. Professional</span> <span style={{ color: '#d1d5db' }}>&gt;</span> <span>3. Time</span> <span style={{ color: '#d1d5db' }}>&gt;</span> <span>4. Confirm</span>
        </p>
        <h2 className="heading-with-search" style={{ fontSize: '36px', fontWeight: '900', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Select a Professional</h2>
        <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 32px 0' }}>Who would you like to perform your services?</p>

        {/* ── Member Tabs ── */}
        {membersWithServices.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #f3f4f6', marginBottom: '24px' }}>
            {membersWithServices.map((member, index) => {
              const hasPro = !!memberProfessionalMap[member.id];
              const isActive = index === currentMemberIndex;
              return (
                <button
                  key={member.id}
                  onClick={() => setCurrentMemberIndex(index)}
                  style={{
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    border: 'none',
                    borderBottom: isActive ? '3px solid #111827' : '3px solid transparent',
                    background: 'none',
                    cursor: 'pointer',
                    color: isActive ? '#111827' : '#9ca3af',
                    marginBottom: '-2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  {member.name}
                  {hasPro && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '20px', height: '20px', fontSize: '12px', fontWeight: '900',
                      background: '#111827', color: '#fff', borderRadius: '50%'
                    }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Current member label */}
        {currentMember && (
          <h4 style={{ marginBottom: '20px', color: '#374151', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            For: <span style={{ color: '#111827', fontWeight: 'bold' }}>{currentMember.name}</span>
            {currentMember.selectedServices?.length > 0 && (
              <span style={{ fontWeight: 'normal', color: '#6b7280', fontSize: '14px', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '12px' }}>
                {currentMember.selectedServices.map(s => s.name).join(', ')}
              </span>
            )}
          </h4>
        )}

        <div className="select-services-list" style={{ marginTop: '0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Any professional option */}
          <div
            className={`select-services-card ${currentSelectedPro?._id === 'any' ? 'selected' : ''}`}
            onClick={() => selectProfessional({ name: 'Any Professional', _id: 'any' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              border: currentSelectedPro?._id === 'any' ? '2px solid #111827' : '1px solid #e5e7eb',
              borderRadius: '20px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              boxShadow: currentSelectedPro?._id === 'any' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: '#f3f4f6', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 'bold', color: '#111827' }}>Any Professional</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Pick the first available person for this service</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', 
                border: currentSelectedPro?._id === 'any' ? 'none' : '1px solid #d1d5db',
                backgroundColor: currentSelectedPro?._id === 'any' ? '#111827' : 'transparent',
                display: 'flex', justifyContent: 'center', alignItems: 'center'
              }}>
                {currentSelectedPro?._id === 'any' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
                {currentSelectedPro?._id !== 'any' && (
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {professionals.map((pro) => {
            const avgRating = pro.mockRating !== undefined ? pro.mockRating : getAverageRating(pro._id);
            const reviewCount = pro.mockReviews !== undefined ? pro.mockReviews : getReviewCount(pro._id);
            const isSelected = currentSelectedPro?._id === pro._id;

            return (
              <div
                key={pro._id}
                className={`select-services-card ${isSelected ? 'selected' : ''}`}
                onClick={() => selectProfessional(pro)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  border: isSelected ? '2px solid #111827' : '1px solid #e5e7eb',
                  borderRadius: '20px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {pro.image ? (
                    <img
                      src={
                        pro.image.startsWith("http")
                          ? pro.image
                          : `${API_BASE_URL}/uploads/professionals/${pro.image}`
                      }
                      alt={pro.name}
                      style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '64px', height: '64px', backgroundColor: '#fef08a', color: '#854d0e', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                      {pro.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 'bold', color: '#111827' }}>{pro.name}</h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {pro.role || 'Stylist'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {reviewCount > 0 && (
                        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#f59e0b' }}>★</span> {avgRating} <span style={{ fontWeight: 'normal', color: '#9ca3af' }}>({reviewCount})</span>
                        </p>
                      )}
                      {pro.isNew && (
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', letterSpacing: '0.5px' }}>NEW</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); openReviewPopup(pro); }}
                    style={{
                      background: 'none',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#6b7280',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </button>
                  <div style={{ 
                    width: '26px', height: '26px', borderRadius: '50%', 
                    border: isSelected ? 'none' : '2px solid #d1d5db',
                    backgroundColor: isSelected ? '#111827' : 'transparent',
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                  }}>
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                    {!isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right Summary Column ── */}
      <div className="right-column" style={{ flex: '1', backgroundColor: '#f9fafb', padding: '40px' }}>
        <div className="summary-box" style={{
          backgroundColor: '#fff',
          padding: '32px',
          borderRadius: '32px',
          border: 'none',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <img
              src={
                salon?.image
                  ? salon.image.startsWith("http")
                    ? salon.image
                    : `${API_BASE_URL}/uploads/${salon.image}`
                  : "https://via.placeholder.com/150"
              }
              alt="Salon"
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>{salon?.name || 'Saloon by Yasas'}</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {salon?.location || 'Location not available'}
              </p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '24px 0' }} />

          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>
            ALL SERVICES ({currentMember?.selectedServices?.length || 0})
          </p>

          <div style={{ marginBottom: '24px' }}>
            {currentMember?.selectedServices?.map((s, i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#111827' }}>{s.name}</p>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#111827' }}>LKR {s.price?.toLocaleString()}</p>
                </div>
                {currentSelectedPro && (
                  <div style={{ display: 'inline-block', backgroundColor: '#1f2937', color: '#fff', fontSize: '12px', fontWeight: 'bold', padding: '6px 14px', borderRadius: '12px' }}>
                    {currentSelectedPro.name}
                  </div>
                )}
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '24px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#6b7280' }}>Total Due</p>
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#111827' }}>LKR {grandTotal.toLocaleString()}</p>
          </div>

          <button
            onClick={isLastMember ? handleContinue : handleNextMember}
            style={{
              width: '100%',
              padding: '18px',
              backgroundColor: '#111827',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#111827'}
          >
            {isLastMember ? 'Continue to Time' : 'Next Member'} 
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Review Popup */}
      {viewReviewsPro && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Reviews for {viewReviewsPro.name}</h3>
            <div className="modal-body">
              {selectedProReviews.length === 0 ? (
                <p>No reviews yet</p>
              ) : (
                selectedProReviews.map((fb) => (
                  <div key={fb._id} className="feedback-item">
                    <p>{'⭐'.repeat(fb.rating)}</p>
                    <p>{fb.comment}</p>
                    <small>
                      {new Date(fb.createdAt).toLocaleString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </small>
                  </div>
                ))
              )}
            </div>
            <button className="modal-close-button" onClick={closeReviewPopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectProfessionalPage;
