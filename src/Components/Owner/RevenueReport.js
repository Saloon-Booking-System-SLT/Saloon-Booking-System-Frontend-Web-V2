import React, { useEffect, useState, useCallback } from 'react';
import './RevenueReport.css';
import logo from '../../Assets/logo.png';
import { useNavigate } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import dayjs from 'dayjs';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://saloon-booking-system-backend-v2.onrender.com/api';

// ✅ Sidebar Component
const Sidebar = () => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('revenue-report');

  const menuItems = [
    { icon: 'fas fa-home', path: '/dashboard', key: 'dashboard', title: 'Home' },
    { icon: 'fas fa-calendar-alt', path: '/calendar', key: 'calendar', title: 'Calendar' },
    { icon: 'fas fa-cut', path: '/services', key: 'services', title: 'Services' },
    { icon: 'fas fa-comment-alt', path: '/feedbacks', key: 'feedbacks', title: 'Feedbacks' },
    { icon: 'fas fa-users', path: '/professionals', key: 'professionals', title: 'Professionals' },
    { icon: 'fas fa-calendar-check', path: '/book-appointment', key: 'book-appointment', title: 'Book An Appointment' },
    { icon: 'fas fa-clock', path: '/timeslots', key: 'timeslots', title: 'Time Slots' },
    { icon: 'fas fa-chart-bar', path: '/revenue-report', key: 'revenue-report', title: 'Revenue Report' },
  ];

  const handleNavigation = (path, key) => {
    setActiveItem(key);
    navigate(path);
  };

  return (
    <aside className="modern-sidebar">
      <img src={logo} alt="Brand Logo" className="modern-logo" />
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`nav-icon ${activeItem === item.key ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path, item.key)}
            title={item.title}
          >
            <i className={item.icon}></i>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div 
          className="nav-icon" 
          onClick={() => navigate('/help')}
          title="Help & Support"
        >
          <i className="fas fa-question-circle"></i>
        </div>
      </div>
    </aside>
  );
};

const RevenueReport = () => {
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    pendingPayments: 0,
    collectedAmount: 0,
    detailedReport: []
  });

  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD')
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [selectedService, setSelectedService] = useState('all');
  const [selectedProfessional, setSelectedProfessional] = useState('all');

  const fetchServicesAndProfessionals = useCallback(async () => {
    try {
      const salonData = JSON.parse(localStorage.getItem('salonUser'));
      if (!salonData?.id) return;

      // Fetch services
      const servicesRes = await axios.get(`${API_BASE_URL}/services/salon/${salonData.id}`);
      const servicesData = Array.isArray(servicesRes.data) 
        ? servicesRes.data 
        : (servicesRes.data?.data || servicesRes.data || []);
      setServices(servicesData);

      // Fetch professionals
      const professionalsRes = await axios.get(`${API_BASE_URL}/professionals/salon/${salonData.id}`);
      const professionalsData = Array.isArray(professionalsRes.data) 
        ? professionalsRes.data 
        : (professionalsRes.data?.data || professionalsRes.data || []);
      setProfessionals(professionalsData);

    } catch (err) {
      console.error('Error fetching services/professionals:', err);
      setServices([]);
      setProfessionals([]);
    }
  }, []);

  const fetchRevenueData = useCallback(async () => {
  setLoading(true);
  setError('');
  try {
    const salonData = JSON.parse(localStorage.getItem('salonUser'));
    if (!salonData?.id) {
      setError('Salon information not found. Please login again.');
      setLoading(false);
      return;
    }

    const params = {
      startDate: dateRange.start,
      endDate: dateRange.end
    };

    if (selectedService !== 'all') {
      params.serviceId = selectedService;
      console.log('Frontend sending serviceId:', selectedService);
    }

    if (selectedProfessional !== 'all') {
      params.professionalId = selectedProfessional;
      console.log('Frontend sending professionalId:', selectedProfessional);
    }

    console.log('Fetching revenue data with params:', params);

    const response = await axios.get(
      `${API_BASE_URL}/revenue/detailed/salon/${salonData.id}`,
      { params }
    );

    console.log('Revenue data response:', response.data);

    if (response.data.success) {
      const data = response.data.data;
      const totalRevenue = (data.summary.collectedAmount || 0) + (data.summary.pendingPayments || 0);
      
      setReportData({
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalAppointments: data.summary.totalAppointments || 0,
        pendingPayments: data.summary.pendingPayments || 0,
        collectedAmount: data.summary.collectedAmount || 0,
        detailedReport: data.detailedReport || []
      });
      
      console.log('Report data updated with filters:', {
        serviceFilter: selectedService,
        professionalFilter: selectedProfessional,
        appointments: data.summary.totalAppointments
      });
    } else {
      setError(response.data.message || 'Failed to fetch revenue data');
    }
  } catch (err) {
    console.error('Error fetching revenue data:', err.response?.data || err.message);
    setError('Failed to load revenue data. Please try again.');
  } finally {
    setLoading(false);
  }
}, [dateRange, selectedService, selectedProfessional]);

  useEffect(() => {
    fetchRevenueData();
    fetchServicesAndProfessionals();
  }, [dateRange, selectedService, selectedProfessional, fetchRevenueData, fetchServicesAndProfessionals]);

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceChange = (e) => setSelectedService(e.target.value);
  const handleProfessionalChange = (e) => setSelectedProfessional(e.target.value);

  const downloadReport = async () => {
    try {
      const salonData = JSON.parse(localStorage.getItem('salonUser'));
      if (!salonData?.id) {
        alert('Salon information not found');
        return;
      }

      const csvContent = generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `revenue_report_${dayjs().format('YYYY-MM-DD')}.csv`);
      link.click();
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report. Please try again.');
    }
  };

  const generateCSV = () => {
    let csv = 'SALON REVENUE REPORT\n';
    csv += `Generated on: ${dayjs().format('YYYY-MM-DD HH:mm')}\n`;
    csv += `Period: ${dateRange.start} to ${dateRange.end}\n\n`;
    
    csv += 'SUMMARY\n';
    csv += 'Metric,Value\n';
    csv += `Total Revenue (Collected + Pending),LKR ${reportData.totalRevenue.toLocaleString()}\n`;
    csv += `Total Appointments,${reportData.totalAppointments}\n`;
    csv += `Pending Payments,LKR ${reportData.pendingPayments.toLocaleString()}\n`;
    csv += `Collected Amount,LKR ${reportData.collectedAmount.toLocaleString()}\n\n`;

    csv += 'DETAILED REPORT\n';
    csv += 'Date,Service,Professional,Appointments,Revenue\n';
    reportData.detailedReport.forEach(item => {
      csv += `${item.date},${item.service},${item.professional},${item.appointments},LKR ${item.revenue.toLocaleString()}\n`;
    });

    return csv;
  };

  if (loading) {
    return (
      <div className="revenue-report-wrapper">
        <Sidebar />
        <div className="revenue-report-container">
          <div className="loading-spinner"></div>
          <p>Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="revenue-report-wrapper">
      <Sidebar />
      <div className="revenue-report-container">
        <div className="report-header">
          <div className="header-content">
            <h1>Revenue Report</h1>
            <p>Track your salon's financial performance</p>
          </div>
          <button className="download-btn" onClick={downloadReport}>
            <ArrowDownTrayIcon className="icon" />
            Download Report
          </button>
        </div>

        {error && (
          <div className="error-message">
            <ExclamationCircleIcon className="icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="advanced-filters">
          <div className="filter-section">
            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                name="start"
                value={dateRange.start}
                onChange={handleDateRangeChange}
                className="date-input"
                max={dateRange.end}
              />
            </div>
            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                name="end"
                value={dateRange.end}
                onChange={handleDateRangeChange}
                className="date-input"
                min={dateRange.start}
                max={dayjs().format('YYYY-MM-DD')}
              />
            </div>
            
            <div className="filter-group">
              <label>Filter by Service</label>
              <select 
                className="date-input"
                value={selectedService}
                onChange={handleServiceChange}
              >
                <option value="all">All Services</option>
                {services.map(service => (
                  <option key={service._id || service.id} value={service._id || service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Filter by Professional</label>
              <select 
                className="date-input"
                value={selectedProfessional}
                onChange={handleProfessionalChange}
              >
                <option value="all">All Professionals</option>
                {professionals.map(professional => (
                  <option key={professional._id || professional.id} value={professional._id || professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
            </div>

            <button className="refresh-btn" onClick={fetchRevenueData}>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon revenue-icon">
              <CurrencyDollarIcon className="icon" />
            </div>
            <div className="metric-content">
              <h3>Total Revenue</h3>
              <p className="metric-value">LKR {reportData.totalRevenue.toLocaleString()}</p>
              <span className="metric-period">Collected + Pending</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon appointment-icon">
              <CalendarIcon className="icon" />
            </div>
            <div className="metric-content">
              <h3>Total Appointments</h3>
              <p className="metric-value">{reportData.totalAppointments}</p>
              <span className="metric-period">All bookings</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon pending-icon">
              <ExclamationCircleIcon className="icon" />
            </div>
            <div className="metric-content">
              <h3>Pending Payments</h3>
              <p className="metric-value">LKR {reportData.pendingPayments.toLocaleString()}</p>
              <span className="metric-period">Awaiting payment</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon collected-icon">
              <CheckCircleIcon className="icon" />
            </div>
            <div className="metric-content">
              <h3>Collected Amount</h3>
              <p className="metric-value">LKR {reportData.collectedAmount.toLocaleString()}</p>
              <span className="metric-period">Successfully paid</span>
            </div>
          </div>
        </div>

        {/* Clean Modern Table */}
        <div className="report-card full-width">
          <div className="card-header">
            <h2>Detailed Revenue Report</h2>
            <span className="card-subtitle">Date-wise breakdown</span>
          </div>
          <div className="detailed-report-table">
            {reportData.detailedReport.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Service</th>
                    <th>Professional</th>
                    <th>Appointments</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.detailedReport.map((item, index) => (
                    <tr key={index}>
                      <td>{dayjs(item.date).format('MMM DD, YYYY')}</td>
                      <td>{item.service}</td>
                      <td>{item.professional}</td>
                      <td>
                        <span className="appointment-count">
                          {item.appointments}
                        </span>
                      </td>
                      <td>
                        <span className="revenue-amount">
                          LKR {item.revenue.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="total-label">Total</td>
                    <td>
                      <span className="total-appointments">
                        {reportData.totalAppointments}
                      </span>
                    </td>
                    <td>
                      <span className="total-revenue">
                        LKR {reportData.totalRevenue.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="no-data">
                <p>No data available for the selected filters</p>
                <p>Try adjusting your date range or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueReport;