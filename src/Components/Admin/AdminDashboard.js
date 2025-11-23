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
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    if (!user || !token || user.role !== 'admin') {
      navigate('/admin-login');
    }
  }, [navigate]);
  
  // API configuration
  const API_BASE_URL = 'http://localhost:5000/api';
  const getAxiosInstance = () => {
    const token = localStorage.getItem('token');
    return axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`
      }
    });
  };

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
      const axiosInstance = getAxiosInstance(); // Get fresh instance with token
      const response = await axiosInstance.get('/admin/dashboard/stats');
      setDashboardData(response.data);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove axiosInstance from dependencies
  
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
      <div className="w-full max-w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
              <button 
                className={`bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <i className={`fas fa-sync-alt ${isLoading ? 'fa-spin' : ''}`}></i>
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-lg"></i>
              <span>{error}</span>
              <button 
                className="ml-auto bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                onClick={handleRefresh}
              >
                Retry
              </button>
            </div>
          )}
          
          {isLoading && !lastUpdated ? (
            <LoadingSpinner size="large" text="Loading dashboard data..." />
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                  <div className="text-sm font-medium text-gray-600 mb-2">Total Salons</div>
                  <div className="text-3xl font-bold text-gray-900">{totalSalons}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                  <div className="text-sm font-medium text-gray-600 mb-2">Total Customers</div>
                  <div className="text-3xl font-bold text-gray-900">{totalCustomers}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                  <div className="text-sm font-medium text-gray-600 mb-2">Total Employees</div>
                  <div className="text-3xl font-bold text-gray-900">{totalEmployees}</div>
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="text-sm font-medium text-gray-600 mb-2">Pending Salon Approvals</div>
                <div className="text-3xl font-bold text-gray-900">{pendingApprovals}</div>
              </div>

              {/* Latest Bookings Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Latest Bookings</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Booking ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Salon</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {latestBookings.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No bookings available</td>
                        </tr>
                      ) : (
                        latestBookings.map((booking, index) => (
                          <tr key={booking._id || index} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 text-sm font-mono text-blue-600">#{booking._id?.slice(-6) || '12345'}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{booking.user?.name || 'Unknown'}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{booking.salonName || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-blue-600">{booking.services?.[0]?.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-blue-600">{dayjs(booking.date).format('MMM D, YYYY')}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                booking.status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                                booking.status?.toLowerCase() === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                booking.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Latest Cancellations</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Booking ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Salon</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {latestCancellations.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No cancellations</td>
                        </tr>
                      ) : (
                        latestCancellations.map((booking, index) => (
                          <tr key={`cancel-${booking._id || index}`} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 text-sm font-mono text-blue-600">#{booking._id?.slice(-6) || '12350'}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{booking.user?.name || 'Unknown'}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{booking.salonName || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-blue-600">{booking.services?.[0]?.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-blue-600">{dayjs(booking.date).format('MMM D, YYYY')}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{booking.cancellationReason || 'No reason provided'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                    <div className="text-sm font-medium text-gray-600 mb-2">Total Revenue</div>
                    <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                    <div className="text-sm font-medium text-gray-600 mb-2">Pending Payments</div>
                    <div className="text-3xl font-bold text-gray-900">{formatCurrency(pendingPayments)}</div>
                  </div>
                </div>
              </div>

              {/* Monthly Summary Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Summary</h3>
                {monthlyData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No data available for chart</div>
                ) : (
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                )}
              </div>

              {/* Alerts Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Alerts</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {alerts.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-12 text-center text-gray-500">No alerts</td>
                        </tr>
                      ) : (
                        alerts.map((alert) => (
                          <tr key={`alert-${alert.id || Math.random()}`} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 text-sm font-medium text-blue-600">{alert.type || 'Info'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{alert.details || 'No details available'}</td>
                            <td className="px-6 py-4">
                              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline">
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
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;