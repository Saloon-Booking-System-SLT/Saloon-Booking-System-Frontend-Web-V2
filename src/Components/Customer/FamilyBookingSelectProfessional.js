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
        setProfessionals(data);
        const reviewsObj = {};
        data.forEach(pro => {
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
    <div className="select-services-container">
      <div className="left-column">
        <p className="breadcrumb">
          Services &gt; <b>Professional</b> &gt; Time &gt; Confirm
        </p>
        <h2 className="heading-with-search">Select professionals</h2>

        {/* ── Member Tabs ── */}
        {membersWithServices.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #e5e7eb', marginTop: '16px', marginBottom: '20px' }}>
            {membersWithServices.map((member, index) => {
              const hasPro = !!memberProfessionalMap[member.id];
              const isActive = index === currentMemberIndex;
              return (
                <button
                  key={member.id}
                  onClick={() => setCurrentMemberIndex(index)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #111827' : '2px solid transparent',
                    background: 'none',
                    cursor: 'pointer',
                    color: isActive ? '#111827' : '#6b7280',
                    marginBottom: '-2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {member.name}
                  {hasPro && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '18px', height: '18px', fontSize: '11px', fontWeight: '900',
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
          <h4 style={{ marginBottom: '16px', color: '#374151' }}>
            For: <span style={{ color: '#111827' }}>{currentMember.name}</span>
            {currentMember.selectedServices?.length > 0 && (
              <span style={{ fontWeight: 'normal', color: '#6b7280', fontSize: '14px' }}>
                {' '}— {currentMember.selectedServices.map(s => s.name).join(', ')}
              </span>
            )}
          </h4>
        )}

        <div className="select-services-list">
          {/* Any professional option */}
          <div
            className={`select-services-card ${currentSelectedPro?._id === 'any' ? 'selected' : ''}`}
            onClick={() => selectProfessional({ name: 'Any Professional', _id: 'any' })}
          >
            <h4>Any professional</h4>
            <div className="checkbox-icon">
              {currentSelectedPro?._id === 'any' ? '✔' : '☐'}
            </div>
          </div>

          {professionals.map((pro) => {
            const avgRating = getAverageRating(pro._id);
            const reviewCount = getReviewCount(pro._id);
            const isSelected = currentSelectedPro?._id === pro._id;

            return (
              <div
                key={pro._id}
                className={`select-services-card ${isSelected ? 'selected' : ''}`}
              >
                <div
                  className="professional-info"
                  onClick={() => selectProfessional(pro)}
                >
                  <img
                    src={
                      pro.image
                        ? pro.image.startsWith("http")
                          ? pro.image
                          : `${API_BASE_URL}/uploads/professionals/${pro.image}`
                        : "https://via.placeholder.com/150"
                    }
                    alt={pro.name}
                    className="select-services-image"
                  />
                  <div>
                    <h4>{pro.name}</h4>
                    <p>{pro.role}</p>
                    <p style={{ fontSize: '13px', color: '#555' }}>
                      {reviewCount > 0
                        ? `⭐ ${avgRating} (${reviewCount} review${reviewCount !== 1 ? 's' : ''})`
                        : 'No reviews yet'}
                    </p>
                  </div>
                </div>

                <button
                  className="view-reviews-btn"
                  onClick={() => openReviewPopup(pro)}
                >
                  👁 View
                </button>

                <div className="checkbox-icon">
                  {isSelected ? '✔' : '☐'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right Summary Column ── */}
      <div className="right-column">
        <div className="summary-box">
          <img
            src={
              salon?.image
                ? salon.image.startsWith("http")
                  ? salon.image
                  : `${API_BASE_URL}/uploads/${salon.image}`
                : "https://via.placeholder.com/150"
            }
            alt="Salon"
            className="salon-image"
          />

          <div className="salon-info">
            <h4>{salon?.name}</h4>
            <p>{salon?.location}</p>

            {/* Current member's services */}
            {currentMember?.selectedServices?.map((s, i) => (
              <div key={i}>
                <p>{s.name} — {s.duration} min</p>
                <p><b>LKR {s.price?.toLocaleString()}</b></p>
              </div>
            ))}

            {/* Selected professional for current member */}
            {currentSelectedPro && (
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                Professional: <b style={{ color: '#111827' }}>{currentSelectedPro.name}</b>
              </p>
            )}
          </div>

          {/* Grand total across all members */}
          <div className="total-section">
            <p>Total</p>
            <p><strong>LKR {grandTotal.toLocaleString()}</strong></p>
          </div>

          {/* Next Member / Continue button */}
          {isLastMember ? (
            <button className="continue-button" onClick={handleContinue}>
              Continue
            </button>
          ) : (
            <button className="continue-button" onClick={handleNextMember}>
              Next Member →
            </button>
          )}
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
