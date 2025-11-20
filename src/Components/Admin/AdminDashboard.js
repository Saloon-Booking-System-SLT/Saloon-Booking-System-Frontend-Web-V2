import React, { useEffect, useState, useCallback } from 'react';
import './AdminDashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminLayout from './AdminLayout';
import LoadingSpinner from '../Common/LoadingSpinner';

// Simple Stat Card Component
const StatCard = ({ title, value }) => (
  <div className="stat-card">
    <div className="stat-title">{title}</div>
    <div className="stat-value">{value}</div>
  </div>
);

const SummaryChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="no-data">No data available for chart</div>;
  }

  return (
    <div className="summary-chart">
      <h3 className="chart-title">Monthly Summary</h3>
      <div style={{ width: '100%', height: 300, minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="bookings" fill="#8884d8" name="Bookings" />
            <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  // Data states
  const [dashboardData, setDashboardData] = useState({
    totalSalons: 0,
    totalCustomers: 0,
    totalEmployees: 0,
    pendingApprovals: 0,
    latestBookings: [],
    latestCancellations: [],
    totalRevenue: 0,
    pendingPayments: 0,
    monthlyData: [],
    alerts: []
  });
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const navigate = useNavigate();
  
  // Authentication check
  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      navigate('/admin-login');
    }
  }, [navigate]);
  
  // API configuration
  const API_BASE_URL = 'http://localhost:5000/api';
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
    }
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setError(null);
    setIsLoading(true);
    await fetchDashboardData();
  };
  
  // Fetch dashboard data - UPDATED TO USE REAL API
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch real data from backend
      const response = await axiosInstance.get('/admin/dashboard/stats');
      setDashboardData(response.data);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [axiosInstance]);
  
  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Destructure data for easier access
  const {
    totalSalons,
    totalCustomers,
    totalEmployees,
    pendingApprovals,
    latestBookings,
    latestCancellations,
    totalRevenue,
    pendingPayments,
    monthlyData,
    alerts
  } = dashboardData;

  return (
    <AdminLayout>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="dashboard-actions">
            {lastUpdated && (
              <div className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <button 
              className="refresh-btn" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message slide-down">
            <i className="fas fa-exclamation-circle"></i>
            {error}
            <button className="retry-btn" onClick={handleRefresh}>
              Retry
            </button>
          </div>
        )}
        
        {isLoading && !lastUpdated ? (
          <LoadingSpinner size="large" text="Loading dashboard data..." />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <StatCard title="Total Salons" value={totalSalons} />
              <StatCard title="Total Customers" value={totalCustomers} />
              <StatCard title="Total Employees" value={totalEmployees} />
            </div>

            {/* Pending Approvals */}
            <div className="pending-approvals-card">
              <div className="stat-title">Pending Salon Approvals</div>
              <div className="stat-value">{pendingApprovals}</div>
            </div>

            {/* Latest Bookings Table */}
            <div className="bookings-section">
              <h2 className="section-title">Latest Bookings</h2>
              <div className="bookings-table-wrapper">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Customer</th>
                      <th>Salon</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestBookings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="no-data">No bookings available</td>
                      </tr>
                    ) : (
                      latestBookings.map((booking, index) => (
                        <tr key={booking._id || index}>
                          <td className="booking-id">#{booking._id || '12345'}</td>
                          <td>{booking.user?.name || 'Unknown'}</td>
                          <td>{booking.salonName || 'N/A'}</td>
                          <td className="service-name">
                            {booking.services?.[0]?.name || 'N/A'}
                          </td>
                          <td className="booking-date">
                            {dayjs(booking.date).format('MMM D, YYYY')}
                          </td>
                          <td>
                            <span className={`status-badge status-${booking.status?.toLowerCase() || 'pending'}`}>
                              {booking.status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Latest Cancellations Table */}
            <div className="bookings-section">
              <h2 className="section-title">Latest Cancellations</h2>
              <div className="bookings-table-wrapper">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Customer</th>
                      <th>Salon</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestCancellations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="no-data">No cancellations</td>
                      </tr>
                    ) : (
                      latestCancellations.map((booking, index) => (
                        <tr key={`cancel-${booking._id || index}`}>
                          <td className="booking-id">#{booking._id || '12350'}</td>
                          <td>{booking.user?.name || 'Unknown'}</td>
                          <td>{booking.salonName || 'N/A'}</td>
                          <td className="service-name">
                            {booking.services?.[0]?.name || 'N/A'}
                          </td>
                          <td className="booking-date">
                            {dayjs(booking.date).format('MMM D, YYYY')}
                          </td>
                          <td className="reason-text">
                            {booking.cancellationReason || 'No reason provided'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="financial-summary">
              <h2 className="section-title">Financial Summary</h2>
              <div className="financial-grid">
                <div className="financial-card">
                  <div className="stat-title">Total Revenue</div>
                  <div className="stat-value">{formatCurrency(totalRevenue)}</div>
                </div>
                <div className="financial-card">
                  <div className="stat-title">Pending Payments</div>
                  <div className="stat-value">{formatCurrency(pendingPayments)}</div>
                </div>
              </div>
            </div>

            {/* Monthly Summary Chart */}
            <div className="summary-section">
              <SummaryChart data={monthlyData} />
            </div>

            {/* Alerts Section */}
            <div className="alerts-section">
              <h2 className="section-title">Alerts</h2>
              <div className="alerts-table-wrapper">
                <table className="alerts-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Details</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="no-data">No alerts</td>
                      </tr>
                    ) : (
                      alerts.map((alert) => (
                        <tr key={`alert-${alert.id || Math.random()}`}>
                          <td className="alert-type">{alert.type || 'Info'}</td>
                          <td className="alert-details">
                            {alert.details || 'No details available'}
                          </td>
                          <td>
                            <button className="view-btn">
                              {alert.action || 'View'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;