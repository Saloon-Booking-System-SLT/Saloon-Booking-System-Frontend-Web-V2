import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import LoadingSpinner from '../Common/LoadingSpinner';
import { getFeedbacks, updateFeedbackStatus } from '../../services/api';
import './FeedbackModeration.css';

const FeedbackModerationPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch feedbacks from API
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setIsLoading(true);
        const data = await getFeedbacks();
        
        // Transform data to match UI format
        const transformedData = data.map(feedback => ({
          _id: feedback._id || feedback.id,
          status: feedback.status || 'pending',
          rating: feedback.rating || 0,
          comment: feedback.review || feedback.comment || '',
          customer: feedback.customerName || feedback.user?.name || 'Anonymous',
          salon: feedback.salonId?.name || 'Unknown Salon',
          date: feedback.createdAt || new Date().toISOString(),
          professional: feedback.professionalId?.name || 'N/A'
        }));
        
        setFeedbacks(transformedData);
      } catch (err) {
        console.error('Failed to fetch feedbacks:', err);
        setError('Failed to load feedbacks. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  // Filter feedbacks by search
  const filteredFeedbacks = feedbacks.filter(feedback =>
    feedback.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.salon?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.comment?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate analytics
  const totalFeedbacks = feedbacks.length;
  const positiveFeedbacks = feedbacks.filter(f => f.rating >= 4).length;
  const negativeFeedbacks = feedbacks.filter(f => f.rating < 4).length;
  const positivePercentage = totalFeedbacks > 0 ? Math.round((positiveFeedbacks / totalFeedbacks) * 100) : 0;
  const negativePercentage = totalFeedbacks > 0 ? Math.round((negativeFeedbacks / totalFeedbacks) * 100) : 0;

  // Handle approve action
  const handleApprove = async (feedbackId) => {
    try {
      await updateFeedbackStatus(feedbackId, 'approved');
      setFeedbacks(feedbacks.map(f => 
        f._id === feedbackId ? { ...f, status: 'approved' } : f
      ));
    } catch (err) {
      console.error('Failed to approve feedback:', err);
      alert('Failed to approve feedback. Please try again.');
    }
  };

  // Handle reject action
  const handleReject = async (feedbackId) => {
    try {
      await updateFeedbackStatus(feedbackId, 'rejected');
      setFeedbacks(feedbacks.map(f => 
        f._id === feedbackId ? { ...f, status: 'rejected' } : f
      ));
    } catch (err) {
      console.error('Failed to reject feedback:', err);
      alert('Failed to reject feedback. Please try again.');
    }
  };

  // Handle view action
  const handleView = (feedbackId) => {
    const feedback = feedbacks.find(f => f._id === feedbackId);
    alert(`Viewing feedback from ${feedback.customer}\n\nRating: ${feedback.rating} stars\nReview: ${feedback.comment}\nSalon: ${feedback.salon}`);
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-pending';
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`star ${star <= rating ? 'filled' : 'empty'}`}
            fill={star <= rating ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        ))}
        <span className="rating-number">({rating})</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="error-message">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="feedback-container">
        {/* Header */}
        <div className="feedback-header">
          <div>
            <h1 className="page-title">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Feedback Moderation
            </h1>
            <p className="page-subtitle">Review and manage customer feedback from all salons</p>
          </div>
        </div>

        {/* Top Analytics */}
        <div className="feedback-analytics">
          <div className="analytics-grid">
            <div className="analytics-card positive">
              <div className="analytics-icon">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <div className="analytics-info">
                <h3>Positive Feedback</h3>
                <div className="stat-value">{positivePercentage}%</div>
                <p className="stat-count">{positiveFeedbacks} reviews</p>
              </div>
            </div>

            <div className="analytics-card negative">
              <div className="analytics-icon">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
              </div>
              <div className="analytics-info">
                <h3>Negative Feedback</h3>
                <div className="stat-value">{negativePercentage}%</div>
                <p className="stat-count">{negativeFeedbacks} reviews</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Table Section */}
        <div className="feedback-table-section">
          <div className="table-header-row">
            <h2 className="section-title">Customer Reviews</h2>
            <div className="feedback-count">{filteredFeedbacks.length} total reviews</div>
          </div>

          {/* Search Bar */}
          <div className="search-bar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by customer, salon, or review..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="feedback-table-container">
            <table className="feedback-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Customer</th>
                  <th>Salon</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p>No feedback found</p>
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((feedback) => (
                    <tr key={feedback._id}>
                      <td>
                        <span className={`status-badge ${getStatusClass(feedback.status)}`}>
                          {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                        </span>
                      </td>
                      <td className="rating-cell">
                        {renderStars(feedback.rating)}
                      </td>
                      <td className="review-cell">
                        <div className="review-text">{feedback.comment}</div>
                      </td>
                      <td className="customer-cell">{feedback.customer}</td>
                      <td className="salon-cell">{feedback.salon}</td>
                      <td>
                        {feedback.status === 'pending' ? (
                          <div className="action-buttons">
                            <button 
                              className="action-btn approve-btn"
                              onClick={() => handleApprove(feedback._id)}
                              title="Approve this review"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button 
                              className="action-btn reject-btn"
                              onClick={() => handleReject(feedback._id)}
                              title="Reject this review"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="action-btn view-btn"
                            onClick={() => handleView(feedback._id)}
                            title="View full details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FeedbackModerationPage;