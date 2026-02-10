import React, { useEffect, useState } from 'react';
import axiosInstance from '../../Api/axios';
import './RevenueReport.css';

const RevenueReport = ({ salonId }) => {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const periods = [
    { value: 'daily', label: 'Today', icon: 'fa-calendar-day' },
    { value: 'weekly', label: 'Last 7 Days', icon: 'fa-calendar-week' },
    { value: 'monthly', label: 'This Month', icon: 'fa-calendar-alt' },
    { value: 'annual', label: 'This Year', icon: 'fa-calendar' }
  ];

  useEffect(() => {
    if (!salonId) return;
    fetchRevenueData();
  }, [salonId, selectedPeriod]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/salons/revenue/${salonId}?period=${selectedPeriod}`);
      setRevenueData(response.data);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError(err.response?.data?.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `LKR ${amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatPeriodLabel = (periodStr) => {
    if (!periodStr) return '';
    
    if (selectedPeriod === 'daily') {
      // Format hourly data (e.g., "2024-02-11 14:00" -> "2 PM")
      const hour = parseInt(periodStr.split(' ')[1]?.split(':')[0]);
      return hour >= 12 ? `${hour === 12 ? 12 : hour - 12} PM` : `${hour === 0 ? 12 : hour} AM`;
    } else if (selectedPeriod === 'weekly' || selectedPeriod === 'monthly') {
      // Format daily data (e.g., "2024-02-11" -> "Feb 11")
      const date = new Date(periodStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (selectedPeriod === 'annual') {
      // Format monthly data (e.g., "2024-02" -> "Feb 2024")
      const [year, month] = periodStr.split('-');
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return periodStr;
  };

  if (loading) {
    return (
      <div className="revenue-report-card">
        <div className="revenue-header">
          <h3><i className="fas fa-chart-line"></i> Revenue Report</h3>
        </div>
        <div className="revenue-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="revenue-report-card">
        <div className="revenue-header">
          <h3><i className="fas fa-chart-line"></i> Revenue Report</h3>
        </div>
        <div className="revenue-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button onClick={fetchRevenueData} className="retry-btn">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="revenue-report-card">
      {/* Header with Period Selector */}
      <div className="revenue-header">
        <h3><i className="fas fa-chart-line"></i> Revenue Report</h3>
        <div className="period-selector">
          {periods.map((period) => (
            <button
              key={period.value}
              className={`period-btn ${selectedPeriod === period.value ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period.value)}
              title={period.label}
            >
              <i className={`fas ${period.icon}`}></i>
              <span className="period-label">{period.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="revenue-summary">
        <div className="revenue-card total">
          <div className="card-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="card-content">
            <p className="card-label">Total Revenue</p>
            <h4 className="card-value">{formatCurrency(revenueData?.totalRevenue)}</h4>
            <small className="card-subtext">{revenueData?.totalAppointments || 0} appointments</small>
          </div>
        </div>

        <div className="revenue-card completed">
          <div className="card-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="card-content">
            <p className="card-label">Completed</p>
            <h4 className="card-value">{formatCurrency(revenueData?.completedRevenue)}</h4>
            <small className="card-subtext">Confirmed payments</small>
          </div>
        </div>

        <div className="revenue-card pending">
          <div className="card-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="card-content">
            <p className="card-label">Pending</p>
            <h4 className="card-value">{formatCurrency(revenueData?.pendingRevenue)}</h4>
            <small className="card-subtext">Awaiting completion</small>
          </div>
        </div>
      </div>

      {/* Revenue Timeline */}
      {revenueData?.revenueByPeriod && revenueData.revenueByPeriod.length > 0 && (
        <div className="revenue-timeline">
          <h4 className="timeline-title">
            <i className="fas fa-chart-bar"></i> Revenue Breakdown
          </h4>
          <div className="timeline-chart">
            {revenueData.revenueByPeriod.map((item, index) => {
              const maxRevenue = Math.max(...revenueData.revenueByPeriod.map(i => i.revenue));
              const barHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={index} className="timeline-item">
                  <div className="timeline-bar-container">
                    <div 
                      className="timeline-bar"
                      style={{ height: `${barHeight}%` }}
                      title={`${formatCurrency(item.revenue)} - ${item.appointments} appointments`}
                    >
                      <span className="bar-value">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                  <span className="timeline-label">{formatPeriodLabel(item.period)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Services */}
      {revenueData?.topServices && revenueData.topServices.length > 0 && (
        <div className="top-services">
          <h4 className="services-title">
            <i className="fas fa-star"></i> Top Services
          </h4>
          <div className="services-list">
            {revenueData.topServices.map((service, index) => (
              <div key={index} className="service-item">
                <div className="service-rank">{index + 1}</div>
                <div className="service-details">
                  <h5>{service.serviceName}</h5>
                  <small>{service.count} bookings</small>
                </div>
                <div className="service-revenue">
                  {formatCurrency(service.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!revenueData?.revenueByPeriod || revenueData.revenueByPeriod.length === 0) && (
        <div className="revenue-empty">
          <i className="fas fa-chart-line"></i>
          <h4>No Revenue Data</h4>
          <p>No completed appointments found for this period.</p>
        </div>
      )}
    </div>
  );
};

export default RevenueReport;
