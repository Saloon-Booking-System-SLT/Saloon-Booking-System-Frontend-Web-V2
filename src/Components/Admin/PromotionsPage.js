import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import './PromotionsPage.css';

const PromotionsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample promotions data
  const [promotions] = useState([
    {
      _id: 1,
      name: '50% Off First Visit',
      salon: 'Glam Studio',
      type: 'Discount',
      status: 'active',
      startDate: '2024-11-01',
      endDate: '2024-12-31',
      category: 'active'
    },
    {
      _id: 2,
      name: 'Buy 2 Get 1 Free Manicure',
      salon: 'Nail Paradise',
      type: 'Bundle',
      status: 'active',
      startDate: '2024-11-10',
      endDate: '2024-12-15',
      category: 'active'
    },
    {
      _id: 3,
      name: 'Holiday Special - 30% Off',
      salon: 'Beauty Bar',
      type: 'Seasonal',
      status: 'active',
      startDate: '2024-11-15',
      endDate: '2024-12-25',
      category: 'active'
    },
    {
      _id: 4,
      name: 'New Customer Welcome',
      salon: 'Spa Serenity',
      type: 'Referral',
      status: 'active',
      startDate: '2024-10-01',
      endDate: '2024-12-31',
      category: 'active'
    },
    {
      _id: 5,
      name: 'Summer Sale 2024',
      salon: 'Color Me Beautiful',
      type: 'Seasonal',
      status: 'expired',
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      category: 'expired'
    },
    {
      _id: 6,
      name: 'Back to School Special',
      salon: 'Style Studio',
      type: 'Discount',
      status: 'expired',
      startDate: '2024-08-01',
      endDate: '2024-09-30',
      category: 'expired'
    },
    {
      _id: 7,
      name: 'Black Friday Mega Sale',
      salon: 'Luxury Spa & Salon',
      type: 'Flash Sale',
      status: 'expired',
      startDate: '2024-11-24',
      endDate: '2024-11-25',
      category: 'expired'
    },
    {
      _id: 8,
      name: 'New Year Special 2025',
      salon: 'Glam Studio',
      type: 'Seasonal',
      status: 'scheduled',
      startDate: '2024-12-26',
      endDate: '2025-01-15',
      category: 'scheduled'
    },
    {
      _id: 9,
      name: 'Valentine\'s Day Romance Package',
      salon: 'Spa Serenity',
      type: 'Bundle',
      status: 'scheduled',
      startDate: '2025-02-01',
      endDate: '2025-02-14',
      category: 'scheduled'
    },
    {
      _id: 10,
      name: 'Spring Renewal Sale',
      salon: 'Beauty Bar',
      type: 'Seasonal',
      status: 'scheduled',
      startDate: '2025-03-01',
      endDate: '2025-04-30',
      category: 'scheduled'
    }
  ]);

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
    alert(`Promotion Details:\n\nName: ${promotion.name}\nSalon: ${promotion.salon}\nType: ${promotion.type}\nStatus: ${promotion.status}\nStart: ${promotion.startDate}\nEnd: ${promotion.endDate}`);
  };

  // Get status class
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'active': return 'status-active';
      case 'expired': return 'status-expired';
      case 'scheduled': return 'status-scheduled';
      default: return 'status-active';
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
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
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

          {/* Promotions Table */}
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
        </div>
      </div>
    </AdminLayout>
  );
};

export default PromotionsPage;