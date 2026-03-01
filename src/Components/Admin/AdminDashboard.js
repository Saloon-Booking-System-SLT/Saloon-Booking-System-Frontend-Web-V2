import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  UsersIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  BellAlertIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import axios from '../../Api/axios';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminLayout from './AdminLayout';
import LoadingSpinner from '../Common/LoadingSpinner';

const SummaryChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
        <ChartBarIcon className="w-12 h-12 text-gray-300 mb-3" />
        <p className="font-medium">No monthly data available for chart</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72 md:h-80 lg:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: '#F3F4F6' }}
            contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
          <Bar dataKey="bookings" fill="#8B5CF6" name="Bookings" radius={[4, 4, 0, 0]} barSize={24} />
          <Bar dataKey="revenue" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
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

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs ${amount.toLocaleString('en-LK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
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

      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required. Please login again.');
        navigate('/admin-login');
        return;
      }

      const response = await axios.get('/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setDashboardData(response.data);
      setLastUpdated(new Date());

    } catch (err) {
 console.error("Failed to fetch dashboard data", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/admin-login'), 2000);
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
      <div className="w-full max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-600 rounded-l-2xl"></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ChartBarIcon className="w-8 h-8 text-primary-600" />
              Platform Overview
            </h1>
            <p className="text-gray-500 mt-1 ml-11">Monitor the overall performance and health of the salon booking network.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            {lastUpdated && (
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl whitespace-nowrap">
                Updated: {dayjs(lastUpdated).format('HH:mm:ss')}
              </div>
            )}
            <button
              className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed text-sm w-full sm:w-auto"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-4 shadow-sm">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 shrink-0" />
            <span className="font-medium text-sm flex-1">{error}</span>
            <button
              className="bg-white border border-red-200 text-red-700 px-4 py-1.5 rounded-lg hover:bg-red-50 text-sm font-bold transition-colors shadow-sm"
              onClick={handleRefresh}
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && !lastUpdated ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-gray-100">
            <LoadingSpinner />
            <p className="mt-4 text-gray-500 font-medium tracking-tight">Loading intelligence data...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats Grid */}
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-8 mb-4 px-1">Network Scale</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-[100px] -z-0 opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                      <ShoppingBagIcon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-gray-900 mb-1">{totalSalons}</div>
                  <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Salons</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] -z-0 opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <UsersIcon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-gray-900 mb-1">{totalCustomers}</div>
                  <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Customers</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-bl-[100px] -z-0 opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
                      <UserGroupIcon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-gray-900 mb-1">{totalEmployees}</div>
                  <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Professionals</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden ring-1 ring-amber-500/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[100px] -z-0 opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                      <ClipboardDocumentCheckIcon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-gray-900 mb-1">{pendingApprovals}</div>
                  <div className="text-sm font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Pending Approvals
                  </div>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              <div className="xl:col-span-2 space-y-6">
                {/* Financial Summary */}
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 px-1">Financial Intelligence</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-sm text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-emerald-300/30">
                      <CurrencyDollarIcon className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                      <div className="text-sm font-bold text-emerald-100 uppercase tracking-widest mb-2">Total Platform Revenue</div>
                      <div className="text-4xl font-black tracking-tight">{formatCurrency(totalRevenue)}</div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Pending Payments</div>
                        <div className="text-3xl font-black text-gray-900 tracking-tight">{formatCurrency(pendingPayments)}</div>
                      </div>
                      <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                        <CurrencyDollarIcon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly Summary Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between">
                    Monthly Performance
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">Last 6 Months</span>
                  </h3>
                  <SummaryChart data={monthlyData} />
                </div>
              </div>

              <div className="xl:col-span-1 space-y-6">
                {/* Alerts Section */}
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2 px-1">System Alerts</h4>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <BellAlertIcon className="w-5 h-5 text-rose-500" />
                      Active Notifications
                    </h2>
                    <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{alerts.length}</span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                        <CheckBadgeIcon className="w-10 h-10 text-emerald-400 mb-2" />
                        <span className="font-medium">All systems normal. No alerts.</span>
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div key={`alert-${alert.id || Math.random()}`} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className={`text-xs font-bold mb-1 uppercase tracking-widest ${alert.type?.toLowerCase() === 'error' ? 'text-red-600' :
                                  alert.type?.toLowerCase() === 'warning' ? 'text-amber-600' :
                                    'text-primary-600'
                                }`}>
                                {alert.type || 'Information'}
                              </div>
                              <div className="text-sm text-gray-700 leading-snug">{alert.details || 'System notification'}</div>
                            </div>
                            <button className="shrink-0 text-xs font-bold bg-white border border-gray-200 text-gray-600 hover:text-primary-600 hover:border-primary-200 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                              {alert.action || 'View'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Tables Area */}
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-8 mb-4 px-1">Recent Activity</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Latest Bookings */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Latest Bookings</h2>
                  <button onClick={() => navigate('/admin/bookings')} className="text-sm font-bold text-primary-600 hover:text-primary-800">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Date</th>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                        <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {latestBookings.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-12 text-center text-gray-500 font-medium">No recent bookings</td>
                        </tr>
                      ) : (
                        latestBookings.slice(0, 5).map((booking, index) => (
                          <tr key={booking._id || index} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mb-1">
                                #{booking._id?.slice(-6) || '12345'}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {dayjs(booking.date).format('MMM D, YY')}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{booking.user?.name || 'Unknown User'}</div>
                              <div className="text-xs text-primary-600 font-medium truncate max-w-[150px]">{booking.services?.[0]?.name || 'Service N/A'}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`inline-flex px-2.5 py-1 text-[10px] uppercase tracking-widest font-black rounded-lg border ${booking.status?.toLowerCase() === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  booking.status?.toLowerCase() === 'confirmed' ? 'bg-primary-50 text-primary-700 border-primary-200' :
                                    booking.status?.toLowerCase() === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      'bg-amber-50 text-amber-700 border-amber-200'
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

              {/* Latest Cancellations */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Recent Cancellations</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID / Date</th>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {latestCancellations.length === 0 ? (
                        <tr>
                          <td colSpan="2" className="px-6 py-12 text-center text-gray-500 font-medium">No recent cancellations</td>
                        </tr>
                      ) : (
                        latestCancellations.slice(0, 5).map((booking, index) => (
                          <tr key={`cancel-${booking._id || index}`} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mb-1">
                                #{booking._id?.slice(-6) || '12350'}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {dayjs(booking.date).format('MMM D, YY')}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-gray-900">{booking.user?.name || 'Unknown User'}</div>
                              <div className="text-xs text-rose-600 font-medium line-clamp-1 italic mt-0.5 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 inline-block">
                                {booking.cancellationReason || 'No reason provided'}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;