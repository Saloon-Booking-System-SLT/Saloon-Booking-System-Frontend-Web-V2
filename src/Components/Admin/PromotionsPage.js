import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from '../../Api/axios';
import './PromotionsPage.css';

const PROMOTION_TYPES = ['Discount', 'Bundle', 'Seasonal', 'Flash Sale', 'Referral', 'Targeted'];

const emptyForm = {
  title: '',
  description: '',
  type: 'Discount',
  discountPercentage: '',
  code: '',
  salonId: '',
  startDate: '',
  endDate: '',
  status: 'scheduled',
};

const PromotionsPage = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Promotions data from backend
  const [promotions, setPromotions] = useState([]);

  // Salons for the dropdown
  const [salons, setSalons] = useState([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch promotions from backend
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/promotions');
      const data = response.data;

      // Transform data to match UI format
      const transformedData = data.map(promo => ({
        _id: promo._id,
        name: promo.title || promo.name,
        salon: promo.salonId?.name || 'All Salons',
        type: promo.type || 'Discount',
        status: new Date(promo.endDate) < new Date() ? 'expired' : (new Date(promo.startDate) > new Date() ? 'scheduled' : 'active'),
        startDate: promo.startDate?.split('T')[0] || promo.startDate,
        endDate: promo.endDate?.split('T')[0] || promo.endDate,
        category: new Date(promo.endDate) < new Date() ? 'expired' : (new Date(promo.startDate) > new Date() ? 'scheduled' : 'active'),
        description: promo.description,
        discount: promo.discountPercentage,
        code: promo.code,
      }));

      setPromotions(transformedData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
      setError('Failed to load promotions');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch salons for dropdown
  const fetchSalons = async () => {
    try {
      const response = await axios.get('/salons');
      setSalons(response.data || []);
    } catch (err) {
      console.error('Failed to fetch salons:', err);
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchSalons();
  }, []);

  // Filter promotions by tab and search
  const filteredPromotions = promotions.filter(promo => {
    const matchesTab = promo.category === activeTab;
    const matchesSearch = searchQuery === '' ||
      promo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.salon.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.type.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Count promotions by category
  const activeCount = promotions.filter(p => p.category === 'active').length;
  const expiredCount = promotions.filter(p => p.category === 'expired').length;
  const scheduledCount = promotions.filter(p => p.category === 'scheduled').length;

  // Handle view details
  const handleViewDetails = (promotion) => {
    alert(`Promotion Details:\n\nName: ${promotion.name}\nSalon: ${promotion.salon}\nType: ${promotion.type}\nStatus: ${promotion.status}\nStart: ${promotion.startDate}\nEnd: ${promotion.endDate}${promotion.code ? '\nPromo Code: ' + promotion.code : ''}${promotion.discount ? '\nDiscount: ' + promotion.discount + '%' : ''}`);
  };

  // Get status class
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'status-active';
      case 'expired': return 'status-expired';
      case 'scheduled': return 'status-scheduled';
      default: return 'status-active';
    }
  };

  // Open / close modal
  const openModal = () => {
    setFormData(emptyForm);
    setFormError('');
    setSuccessMsg('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
    setSuccessMsg('');
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit new promotion
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    // Basic validation
    if (!formData.title.trim()) return setFormError('Promotion title is required.');
    if (!formData.startDate) return setFormError('Start date is required.');
    if (!formData.endDate) return setFormError('End date is required.');
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      return setFormError('End date must be after start date.');
    }
    if (formData.discountPercentage && (Number(formData.discountPercentage) < 1 || Number(formData.discountPercentage) > 100)) {
      return setFormError('Discount percentage must be between 1 and 100.');
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : undefined,
        code: formData.code.trim() || undefined,
        // Only include salonId when a specific salon is chosen (not 'all' or empty)
        ...(formData.salonId && formData.salonId !== 'all' ? { salonId: formData.salonId } : {}),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
      };

      await axios.post('/promotions', payload);
      setSuccessMsg('Promotion created successfully!');
      await fetchPromotions();
      setTimeout(() => {
        closeModal();
      }, 1200);
    } catch (err) {
      console.error('Failed to create promotion:', err);
      setFormError(err.response?.data?.message || 'Failed to create promotion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="promotions-container">
        {/* Header */}
        <div className="promotions-header">
          <div>
            <h1 className="page-title">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Promotions Management
            </h1>
            <p className="page-subtitle">Manage and analyze your salon's promotional campaigns</p>
          </div>
          {/* ✅ Create Promotion Button */}
          <button className="create-promotion-btn" onClick={openModal} id="btn-create-promotion">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Promotion
          </button>
        </div>

        {/* Tabs */}
        <div className="promotions-tabs">
          <button
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
            <span className="tab-count">{activeCount}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
            onClick={() => setActiveTab('expired')}
          >
            Expired
            <span className="tab-count">{expiredCount}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'scheduled' ? 'active' : ''}`}
            onClick={() => setActiveTab('scheduled')}
          >
            Scheduled
            <span className="tab-count">{scheduledCount}</span>
          </button>
        </div>

        {/* Overview Cards */}
        <div className="overview-section">
          <div className="overview-grid">
            {/* Conversion Rates Card */}
            <div className="overview-card">
              <div className="card-header">
                <div className="card-icon conversion">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="card-info">
                  <h3>Conversion Rates</h3>
                  <div className="stat-row">
                    <div className="stat-value">15%</div>
                    <div className="stat-change positive">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      +2%
                    </div>
                  </div>
                  <p className="stat-description">vs last month</p>
                </div>
              </div>
              <div className="chart-container">
                <div className="mini-bar-chart">
                  <div className="mini-bar" style={{ height: '55%' }}></div>
                  <div className="mini-bar" style={{ height: '70%' }}></div>
                  <div className="mini-bar" style={{ height: '48%' }}></div>
                  <div className="mini-bar" style={{ height: '85%' }}></div>
                  <div className="mini-bar" style={{ height: '65%' }}></div>
                  <div className="mini-bar" style={{ height: '78%' }}></div>
                  <div className="mini-bar" style={{ height: '92%' }}></div>
                </div>
                <div className="chart-legend">Weekly performance trend</div>
              </div>
            </div>

            {/* Delivery Success Card */}
            <div className="overview-card">
              <div className="card-header">
                <div className="card-icon delivery">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="card-info">
                  <h3>Delivery Success</h3>
                  <div className="stat-row">
                    <div className="stat-value">92%</div>
                    <div className="stat-change negative">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      -1%
                    </div>
                  </div>
                  <p className="stat-description">vs last month</p>
                </div>
              </div>
              <div className="chart-container">
                <svg className="mini-line-chart" viewBox="0 0 200 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,30 L28,15 L57,22 L86,10 L114,18 L143,12 L171,20 L200,8"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  <path
                    d="M0,30 L28,15 L57,22 L86,10 L114,18 L143,12 L171,20 L200,8 L200,60 L0,60 Z"
                    fill="url(#lineGradient)"
                  />
                </svg>
                <div className="chart-legend">Weekly performance trend</div>
              </div>
            </div>
          </div>
        </div>

        {/* Promotions Table Section */}
        <div className="promotions-table-section">
          <div className="table-header-row">
            <h2 className="section-title">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Promotions
            </h2>
            <div className="promotions-count">
              {filteredPromotions.length} {filteredPromotions.length === 1 ? 'promotion' : 'promotions'}
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-bar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, salon, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Loading / Error */}
          {loading && <div className="loading-msg">Loading promotions...</div>}
          {error && <div className="error-msg">{error}</div>}

          {/* Promotions Table */}
          {!loading && (
            <div className="promotions-table-container">
              <table className="promotions-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Salon</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromotions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p>No promotions found</p>
                        <button className="no-data-create-btn" onClick={openModal}>
                          + Create your first promotion
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredPromotions.map((promo) => (
                      <tr key={promo._id}>
                        <td className="promo-name">{promo.name}</td>
                        <td className="salon-name">{promo.salon}</td>
                        <td className="type-badge">
                          <span className="badge badge-type">{promo.type}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusClass(promo.status)}`}>
                            {promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
                          </span>
                        </td>
                        <td className="date-cell">{promo.startDate}</td>
                        <td className="date-cell">{promo.endDate}</td>
                        <td>
                          <button
                            className="view-details-btn"
                            onClick={() => handleViewDetails(promo)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== Create Promotion Modal ===== */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="modal-title">Create New Promotion</h2>
                  <p className="modal-subtitle">Fill in the details to launch a new promotional campaign</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal} aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form className="modal-form" onSubmit={handleSubmit}>

              {formError && (
                <div className="form-error-banner">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
                  </svg>
                  {formError}
                </div>
              )}

              {successMsg && (
                <div className="form-success-banner">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {successMsg}
                </div>
              )}

              <div className="form-grid">
                {/* Promotion Title */}
                <div className="form-group full-width">
                  <label htmlFor="promo-title">Promotion Title <span className="required">*</span></label>
                  <input
                    id="promo-title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Summer Flash Sale 20% Off"
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="form-group full-width">
                  <label htmlFor="promo-desc">Description</label>
                  <textarea
                    id="promo-desc"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the promotion to customers..."
                    rows={3}
                  />
                </div>

                {/* Salon */}
                <div className="form-group">
                  <label htmlFor="promo-salon">Salon <span className="required">*</span></label>
                  <select
                    id="promo-salon"
                    name="salonId"
                    value={formData.salonId}
                    onChange={handleChange}
                  >
                    <option value="">— Select a salon —</option>
                    <option value="all">🌐 All Salons</option>
                    {salons.map(salon => (
                      <option key={salon._id} value={salon._id}>{salon.name}</option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div className="form-group">
                  <label htmlFor="promo-type">Promotion Type <span className="required">*</span></label>
                  <select
                    id="promo-type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    {PROMOTION_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Discount Percentage */}
                <div className="form-group">
                  <label htmlFor="promo-discount">Discount Percentage (%)</label>
                  <input
                    id="promo-discount"
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    placeholder="e.g. 20"
                    min={1}
                    max={100}
                  />
                </div>

                {/* Promo Code */}
                <div className="form-group">
                  <label htmlFor="promo-code">Promo Code</label>
                  <input
                    id="promo-code"
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g. SUMMER20"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                {/* Start Date */}
                <div className="form-group">
                  <label htmlFor="promo-start">Start Date <span className="required">*</span></label>
                  <input
                    id="promo-start"
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>

                {/* End Date */}
                <div className="form-group">
                  <label htmlFor="promo-end">End Date <span className="required">*</span></label>
                  <input
                    id="promo-end"
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>

                {/* Status */}
                <div className="form-group full-width">
                  <label htmlFor="promo-status">Initial Status</label>
                  <div className="status-radio-group">
                    {['scheduled', 'active'].map(s => (
                      <label key={s} className={`status-radio-label ${formData.status === s ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          checked={formData.status === s}
                          onChange={handleChange}
                        />
                        <span className={`radio-dot status-dot-${s}`}></span>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={submitting} id="btn-submit-promotion">
                  {submitting ? (
                    <>
                      <span className="spinner"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Create Promotion
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PromotionsPage;