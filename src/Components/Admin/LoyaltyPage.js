import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import './LoyaltyPage.css';

const LoyaltyPage = () => {
  const navigate = useNavigate();

  // Global configuration state
  const [globalConfig, setGlobalConfig] = useState({
    pointsThreshold: 100,
    conversionRate: 10
  });

  // Issue/Revoke points state
  const [issueEmail, setIssueEmail] = useState('');
  const [issuePoints, setIssuePoints] = useState('');
  const [revokeEmail, setRevokeEmail] = useState('');
  const [revokePoints, setRevokePoints] = useState('');

  // Sample most loyal customers
  const [loyalCustomers] = useState([
    {
      id: 1,
      name: 'Emma Wilson',
      email: 'emma.wilson@email.com',
      points: 2450,
      lastVisit: '2024-11-16'
    },
    {
      id: 2,
      name: 'Isabella Davis',
      email: 'isabella.davis@email.com',
      points: 2180,
      lastVisit: '2024-11-15'
    },
    {
      id: 3,
      name: 'Sophia Clark',
      email: 'sophia.clark@email.com',
      points: 1890,
      lastVisit: '2024-11-14'
    },
    {
      id: 4,
      name: 'Ava Martinez',
      email: 'ava.martinez@email.com',
      points: 1650,
      lastVisit: '2024-11-13'
    },
    {
      id: 5,
      name: 'Olivia Martinez',
      email: 'olivia.m@email.com',
      points: 1420,
      lastVisit: '2024-11-12'
    }
  ]);

  // Sample salon loyalty settings
  const [salonSettings, setSalonSettings] = useState([
    {
      id: 1,
      salonName: 'Glam Studio',
      status: 'active',
      pointsThreshold: 100,
      conversionRate: 10
    },
    {
      id: 2,
      salonName: 'Nail Paradise',
      status: 'active',
      pointsThreshold: 150,
      conversionRate: 15
    },
    {
      id: 3,
      salonName: 'Beauty Bar',
      status: 'inactive',
      pointsThreshold: 100,
      conversionRate: 10
    },
    {
      id: 4,
      salonName: 'Spa Serenity',
      status: 'active',
      pointsThreshold: 200,
      conversionRate: 20
    },
    {
      id: 5,
      salonName: 'Style Studio',
      status: 'active',
      pointsThreshold: 100,
      conversionRate: 12
    }
  ]);

  // Handle global config save
  const handleSaveConfig = () => {
    console.log('Saving global configuration:', globalConfig);
    alert(`Configuration saved!\nPoints Threshold: ${globalConfig.pointsThreshold}\nConversion Rate: ${globalConfig.conversionRate}`);
  };

  // Toggle salon status
  const handleToggleStatus = (salonId) => {
    setSalonSettings(salonSettings.map(salon => 
      salon.id === salonId 
        ? { ...salon, status: salon.status === 'active' ? 'inactive' : 'active' }
        : salon
    ));
  };

  // Handle issue points
  const handleIssuePoints = () => {
    if (!issueEmail || !issuePoints) {
      alert('Please enter both email and points amount');
      return;
    }
    console.log(`Issuing ${issuePoints} points to ${issueEmail}`);
    alert(`Successfully issued ${issuePoints} points to ${issueEmail}`);
    setIssueEmail('');
    setIssuePoints('');
  };

  // Handle revoke points
  const handleRevokePoints = () => {
    if (!revokeEmail || !revokePoints) {
      alert('Please enter both email and points amount');
      return;
    }
    console.log(`Revoking ${revokePoints} points from ${revokeEmail}`);
    alert(`Successfully revoked ${revokePoints} points from ${revokeEmail}`);
    setRevokeEmail('');
    setRevokePoints('');
  };

  return (
    <AdminLayout>
      <div className="loyalty-container">
        {/* Header */}
        <div className="loyalty-header">
          <h1 className="page-title">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Loyalty Program
          </h1>
          <p className="page-subtitle">Configure and manage your customer loyalty rewards program</p>
        </div>

        {/* Top Grid: Configuration & Total Points */}
        <div className="loyalty-grid">
          {/* Global Configuration */}
          <div className="loyalty-card">
            <h2 className="card-title">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Global Configuration
            </h2>
            <form className="config-form" onSubmit={(e) => { e.preventDefault(); handleSaveConfig(); }}>
              <div className="form-group">
                <label className="form-label">Points Threshold</label>
                <input
                  type="number"
                  className="form-input"
                  value={globalConfig.pointsThreshold}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, pointsThreshold: e.target.value })}
                  placeholder="Enter points threshold"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Conversion Rate ($)</label>
                <input
                  type="number"
                  className="form-input"
                  value={globalConfig.conversionRate}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, conversionRate: e.target.value })}
                  placeholder="Enter conversion rate"
                />
              </div>
              <button type="submit" className="save-btn">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Configuration
              </button>
            </form>
          </div>

          {/* Total Points Issued */}
          <div className="loyalty-card total-points-card">
            <h2 className="card-title">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Total Points Issued
            </h2>
            <div className="total-points-value">50,000</div>
            <p className="points-description">
              Lifetime points issued across all salons
            </p>
          </div>
        </div>

        {/* Most Loyal Customers */}
        <div className="full-width-card">
          <h2 className="card-title">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Most Loyal Customers
          </h2>
          <table className="loyalty-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Points</th>
                <th>Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {loyalCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="customer-name">{customer.name}</td>
                  <td>
                    <span className="points-badge">{customer.points.toLocaleString()} pts</span>
                  </td>
                  <td className="date-cell">{customer.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Salon Loyalty Settings */}
        <div className="full-width-card">
          <h2 className="card-title">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Salon Loyalty Settings
          </h2>
          <table className="loyalty-table">
            <thead>
              <tr>
                <th>Salon</th>
                <th>Status</th>
                <th>Points Threshold</th>
                <th>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {salonSettings.map((salon) => (
                <tr key={salon.id}>
                  <td className="customer-name">{salon.salonName}</td>
                  <td>
                    <div 
                      className={`status-toggle ${salon.status === 'active' ? 'active' : ''}`}
                      onClick={() => handleToggleStatus(salon.id)}
                    >
                      <div className={`toggle-switch ${salon.status === 'active' ? 'active' : ''}`}>
                        <div className="toggle-slider"></div>
                      </div>
                      <span className={`toggle-label ${salon.status === 'active' ? 'active' : ''}`}>
                        {salon.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td>{salon.pointsThreshold} points</td>
                  <td>${salon.conversionRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Issue or Revoke Points */}
        <div className="points-action-section">
          {/* Issue Points */}
          <div className="action-card issue">
            <h2 className="action-card-title">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Issue Points
            </h2>
            <div className="config-form">
              <div className="form-group">
                <label className="form-label">Customer Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={issueEmail}
                  onChange={(e) => setIssueEmail(e.target.value)}
                  placeholder="customer@email.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Points Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={issuePoints}
                  onChange={(e) => setIssuePoints(e.target.value)}
                  placeholder="Enter points to issue"
                />
              </div>
              <button className="action-btn issue" onClick={handleIssuePoints}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Issue Points
              </button>
            </div>
          </div>

          {/* Revoke Points */}
          <div className="action-card revoke">
            <h2 className="action-card-title">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Revoke Points
            </h2>
            <div className="config-form">
              <div className="form-group">
                <label className="form-label">Customer Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={revokeEmail}
                  onChange={(e) => setRevokeEmail(e.target.value)}
                  placeholder="customer@email.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Points Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={revokePoints}
                  onChange={(e) => setRevokePoints(e.target.value)}
                  placeholder="Enter points to revoke"
                />
              </div>
              <button className="action-btn revoke" onClick={handleRevokePoints}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Revoke Points
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LoyaltyPage;