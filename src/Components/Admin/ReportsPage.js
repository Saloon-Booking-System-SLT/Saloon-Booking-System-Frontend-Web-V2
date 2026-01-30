import React, { useEffect, useState, useCallback } from 'react';
import './ReportsPage.css';
import logo from '../../Assets/logo.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const ReportsPage = () => {
  const [reportData, setReportData] = useState({
    revenue: {
      daily: [],
      monthly: [],
      total: 0,
      growth: 0
    },
    appointments: {
      daily: [],
      monthly: [],
      total: 0,
      growth: 0
    },
    customers: {
      new: 0,
      returning: 0,
      total: 0,
      growth: 0
    },
    services: {
      popular: [],
      revenue: []
    },
    professionals: {
      performance: []
    },
    trends: {
      peakHours: [],
      peakDays: [],
      seasonal: []
    }
  });
  
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD')
  });
  
  const [reportType, setReportType] = useState('overview');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const salonData = JSON.parse(localStorage.getItem("salonUser"));
      
      // Fetch appointments data
      const appointmentsRes = await axios.get(`https://saloon-booking-system-backend-v2.onrender.com/api/appointments/salon/${salonData.id}`);
      const appointments = appointmentsRes.data;
      
      // Fetch services data
      await axios.get(`https://saloon-booking-system-backend-v2.onrender.com/api/services/salon/${salonData.id}`);
      // const services = servicesRes.data; // Commented out unused variable
      
      // Fetch professionals data
      await axios.get(`https://saloon-booking-system-backend-v2.onrender.com/api/professionals/salon/${salonData.id}`);
      // const professionals = professionalsRes.data; // Commented out unused variable

      // Filter data by date range
      const filteredAppointments = appointments.filter(apt => 
        dayjs(apt.date).isBetween(dateRange.start, dateRange.end, null, '[]')
      );

      // Calculate revenue data
      const dailyRevenue = {};
      const monthlyRevenue = {};
      let totalRevenue = 0;

      filteredAppointments.forEach(apt => {
        const date = dayjs(apt.date);
        const dayKey = date.format('YYYY-MM-DD');
        const monthKey = date.format('YYYY-MM');
        
        const revenue = apt.services[0]?.price || 0;
        totalRevenue += revenue;
        
        dailyRevenue[dayKey] = (dailyRevenue[dayKey] || 0) + revenue;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + revenue;
      });

      // Calculate appointment data
      const dailyAppointments = {};
      const monthlyAppointments = {};
      let totalAppointments = 0;

      filteredAppointments.forEach(apt => {
        const date = dayjs(apt.date);
        const dayKey = date.format('YYYY-MM-DD');
        const monthKey = date.format('YYYY-MM');
        
        totalAppointments++;
        dailyAppointments[dayKey] = (dailyAppointments[dayKey] || 0) + 1;
        monthlyAppointments[monthKey] = (monthlyAppointments[monthKey] || 0) + 1;
      });

      // Calculate customer data
      const uniqueCustomers = new Set(filteredAppointments.map(apt => apt.user?._id));
      const newCustomers = new Set();
      const returningCustomers = new Set();

      filteredAppointments.forEach(apt => {
        const customerId = apt.user?._id;
        const aptDate = dayjs(apt.date);
        const isNewCustomer = aptDate.isAfter(dayjs().subtract(30, 'days'));
        
        if (isNewCustomer) {
          newCustomers.add(customerId);
        } else {
          returningCustomers.add(customerId);
        }
      });

      // Calculate service performance
      const serviceStats = {};
      const serviceRevenue = {};
      
      filteredAppointments.forEach(apt => {
        const serviceName = apt.services[0]?.name;
        const revenue = apt.services[0]?.price || 0;
        
        if (serviceName) {
          serviceStats[serviceName] = (serviceStats[serviceName] || 0) + 1;
          serviceRevenue[serviceName] = (serviceRevenue[serviceName] || 0) + revenue;
        }
      });

      const popularServices = Object.entries(serviceStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const topRevenueServices = Object.entries(serviceRevenue)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Calculate professional performance
      const professionalStats = {};
      filteredAppointments.forEach(apt => {
        const professionalId = apt.professional?._id;
        if (professionalId) {
          if (!professionalStats[professionalId]) {
            professionalStats[professionalId] = {
              name: apt.professional?.name,
              appointments: 0,
              revenue: 0
            };
          }
          professionalStats[professionalId].appointments++;
          professionalStats[professionalId].revenue += apt.services[0]?.price || 0;
        }
      });

      const professionalPerformance = Object.values(professionalStats)
        .sort((a, b) => b.revenue - a.revenue);

      // Calculate trends
      const hourStats = {};
      const dayStats = {};
      
      filteredAppointments.forEach(apt => {
        const hour = dayjs(`2000-01-01T${apt.startTime}`).hour();
        const day = dayjs(apt.date).day();
        
        hourStats[hour] = (hourStats[hour] || 0) + 1;
        dayStats[day] = (dayStats[day] || 0) + 1;
      });

      const peakHours = Object.entries(hourStats)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const peakDays = Object.entries(dayStats)
        .map(([day, count]) => ({ 
          day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)], 
          count 
        }))
        .sort((a, b) => b.count - a.count);

      setReportData({
        revenue: {
          daily: Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount })),
          monthly: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount })),
          total: totalRevenue,
          growth: 12.5 // Mock growth percentage
        },
        appointments: {
          daily: Object.entries(dailyAppointments).map(([date, count]) => ({ date, count })),
          monthly: Object.entries(monthlyAppointments).map(([month, count]) => ({ month, count })),
          total: totalAppointments,
          growth: 8.3 // Mock growth percentage
        },
        customers: {
          new: newCustomers.size,
          returning: returningCustomers.size,
          total: uniqueCustomers.size,
          growth: 15.2 // Mock growth percentage
        },
        services: {
          popular: popularServices,
          revenue: topRevenueServices
        },
        professionals: {
          performance: professionalPerformance
        },
        trends: {
          peakHours,
          peakDays,
          seasonal: [] // Mock seasonal data
        }
      });

    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, reportType]);

  useEffect(() => {
    const salonData = JSON.parse(localStorage.getItem(\"salonUser\"));
    if (!salonData?.id) {
      navigate(\"/\");
      return;
    }

    fetchReportData();
  }, [fetchReportData, navigate]);

  const generateReport = () => {
    // Implement report generation
    alert('Generating comprehensive report...');
  };

  const exportReport = (format) => {
    // Implement report export
    alert(`Exporting report as ${format}...`);
  };

  const ReportCard = ({ title, value, icon, color, trend, subtitle }) => (
    <div className="report-card">
      <div className="card-header">
        <i className={`fas ${icon} ${color}`}></i>
        <span className="trend">{trend}</span>
      </div>
      <div className="card-content">
        <h3>{value}</h3>
        <p>{title}</p>
        {subtitle && <small>{subtitle}</small>}
      </div>
    </div>
  );

  const ChartCard = ({ title, children, actions }) => (
    <div className="chart-card">
      <div className="chart-header">
        <h3>{title}</h3>
        {actions && <div className="chart-actions">{actions}</div>}
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="reports-page">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Generating reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      {/* Sidebar */}
      <aside className="reports-sidebar">
        <img src={logo} alt="Brand Logo" className="reports-logo" />
        <i className="fas fa-home" title="Dashboard" onClick={() => navigate('/admin-dashboard')}></i>
        <i className="fas fa-chart-line" title="Analytics" onClick={() => navigate('/analytics')}></i>
        <i className="fas fa-calendar-alt" title="Calendar" onClick={() => navigate('/admincalendar')}></i>
        <i className="fas fa-users" title="Customers" onClick={() => navigate('/customers')}></i>
        <i className="fas fa-user-tie" title="Professionals" onClick={() => navigate('/professionals')}></i>
        <i className="fas fa-concierge-bell" title="Services" onClick={() => navigate('/services')}></i>
        <i className="fas fa-chart-bar active" title="Reports" onClick={() => navigate('/reports')}></i>
        <i className="fas fa-comment" title="Feedbacks" onClick={() => navigate('/feedbacks')}></i>
        <i className="fas fa-cog" title="Settings" onClick={() => navigate('/settings')}></i>
      </aside>

      {/* Main Content */}
      <main className="reports-main">
        {/* Header */}
        <header className="reports-header">
          <div className="header-left">
            <h1>Business Reports</h1>
            <p>Comprehensive insights and analytics for your salon</p>
          </div>
          <div className="header-right">
            <div className="date-range">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="date-input"
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="date-input"
              />
            </div>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="report-type-select"
            >
              <option value="overview">Overview Report</option>
              <option value="revenue">Revenue Report</option>
              <option value="appointments">Appointments Report</option>
              <option value="customers">Customer Report</option>
              <option value="services">Services Report</option>
            </select>
            <button className="generate-btn" onClick={generateReport}>
              <i className="fas fa-file-alt"></i>
              Generate Report
            </button>
            <div className="export-dropdown">
              <button className="export-btn">
                <i className="fas fa-download"></i>
                Export
              </button>
              <div className="export-menu">
                <button onClick={() => exportReport('PDF')}>Export as PDF</button>
                <button onClick={() => exportReport('Excel')}>Export as Excel</button>
                <button onClick={() => exportReport('CSV')}>Export as CSV</button>
              </div>
            </div>
          </div>
        </header>

        {/* Key Metrics */}
        <section className="metrics-section">
          <ReportCard
            title="Total Revenue"
            value={`LKR ${reportData.revenue.total.toLocaleString()}`}
            icon="fa-dollar-sign"
            color="green"
            trend={`+${reportData.revenue.growth}%`}
            subtitle="vs previous period"
          />
          <ReportCard
            title="Total Appointments"
            value={reportData.appointments.total}
            icon="fa-calendar-check"
            color="blue"
            trend={`+${reportData.appointments.growth}%`}
            subtitle="bookings completed"
          />
          <ReportCard
            title="Active Customers"
            value={reportData.customers.total}
            icon="fa-users"
            color="purple"
            trend={`+${reportData.customers.growth}%`}
            subtitle="unique clients"
          />
          <ReportCard
            title="New Customers"
            value={reportData.customers.new}
            icon="fa-user-plus"
            color="orange"
            trend="+25%"
            subtitle="first-time visitors"
          />
        </section>

        {/* Charts Section */}
        <section className="charts-section">
          <div className="charts-grid">
            {/* Revenue Trend */}
            <ChartCard 
              title="Revenue Trend"
              actions={
                <select className="chart-period">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              }
            >
              <div className="chart-container">
                <div className="chart-placeholder">
                  <i className="fas fa-chart-line"></i>
                  <p>Revenue Chart</p>
                  <small>Revenue over selected period</small>
                </div>
              </div>
            </ChartCard>

            {/* Appointment Volume */}
            <ChartCard title="Appointment Volume">
              <div className="chart-container">
                <div className="chart-placeholder">
                  <i className="fas fa-chart-bar"></i>
                  <p>Appointments Chart</p>
                  <small>Appointment bookings over time</small>
                </div>
              </div>
            </ChartCard>

            {/* Peak Hours */}
            <ChartCard title="Peak Hours Analysis">
              <div className="peak-hours-list">
                {reportData.trends.peakHours.map((item, index) => (
                  <div key={index} className="peak-hour-item">
                    <div className="hour-info">
                      <span className="hour">{item.hour}:00</span>
                      <span className="count">{item.count} appointments</span>
                    </div>
                    <div className="hour-bar">
                      <div 
                        className="hour-fill" 
                        style={{ 
                          width: `${(item.count / reportData.trends.peakHours[0]?.count) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Peak Days */}
            <ChartCard title="Peak Days Analysis">
              <div className="peak-days-list">
                {reportData.trends.peakDays.map((item, index) => (
                  <div key={index} className="peak-day-item">
                    <div className="day-info">
                      <span className="day">{item.day}</span>
                      <span className="count">{item.count} appointments</span>
                    </div>
                    <div className="day-bar">
                      <div 
                        className="day-fill" 
                        style={{ 
                          width: `${(item.count / reportData.trends.peakDays[0]?.count) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </section>

        {/* Service Performance */}
        <section className="service-performance">
          <div className="performance-grid">
            <ChartCard title="Top Performing Services">
              <div className="service-performance-list">
                {reportData.services.popular.map((service, index) => (
                  <div key={index} className="service-performance-item">
                    <div className="service-rank">#{index + 1}</div>
                    <div className="service-info">
                      <h4>{service.name}</h4>
                      <p>{service.count} bookings</p>
                    </div>
                    <div className="service-metric">
                      <span className="metric-label">Popularity</span>
                      <span className="metric-value">{service.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Top Revenue Services">
              <div className="revenue-performance-list">
                {reportData.services.revenue.map((service, index) => (
                  <div key={index} className="revenue-performance-item">
                    <div className="service-rank">#{index + 1}</div>
                    <div className="service-info">
                      <h4>{service.name}</h4>
                      <p>LKR {service.revenue.toLocaleString()}</p>
                    </div>
                    <div className="service-metric">
                      <span className="metric-label">Revenue</span>
                      <span className="metric-value">LKR {service.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </section>

        {/* Professional Performance */}
        <section className="professional-performance">
          <ChartCard title="Professional Performance Report">
            <div className="professional-performance-list">
              {reportData.professionals.performance.map((professional, index) => (
                <div key={index} className="professional-performance-item">
                  <div className="professional-rank">#{index + 1}</div>
                  <div className="professional-info">
                    <div className="professional-avatar">
                      <i className="fas fa-user-tie"></i>
                    </div>
                    <div className="professional-details">
                      <h4>{professional.name}</h4>
                      <p>{professional.appointments} appointments</p>
                    </div>
                  </div>
                  <div className="professional-metrics">
                    <div className="metric">
                      <span className="metric-label">Revenue</span>
                      <span className="metric-value">LKR {professional.revenue.toLocaleString()}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Avg per Appointment</span>
                      <span className="metric-value">
                        LKR {Math.round(professional.revenue / professional.appointments).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </section>

        {/* Summary Insights */}
        <section className="summary-insights">
          <ChartCard title="Key Insights & Recommendations">
            <div className="insights-list">
              <div className="insight-item positive">
                <i className="fas fa-trophy"></i>
                <div>
                  <h4>Best Performing Service</h4>
                  <p>{reportData.services.popular[0]?.name} with {reportData.services.popular[0]?.count} bookings</p>
                </div>
              </div>
              <div className="insight-item positive">
                <i className="fas fa-clock"></i>
                <div>
                  <h4>Peak Business Hours</h4>
                  <p>{reportData.trends.peakHours[0]?.hour}:00 - {reportData.trends.peakHours[0]?.hour + 1}:00</p>
                </div>
              </div>
              <div className="insight-item neutral">
                <i className="fas fa-calendar"></i>
                <div>
                  <h4>Busiest Day</h4>
                  <p>{reportData.trends.peakDays[0]?.day} with {reportData.trends.peakDays[0]?.count} appointments</p>
                </div>
              </div>
              <div className="insight-item recommendation">
                <i className="fas fa-lightbulb"></i>
                <div>
                  <h4>Growth Opportunity</h4>
                  <p>Consider extending hours during peak times to increase revenue</p>
                </div>
              </div>
            </div>
          </ChartCard>
        </section>
      </main>
    </div>
  );
};

export default ReportsPage;












