import React, { useEffect, useState } from 'react';
import './CustomerManagement.css';
import './AdminDashboard.css';
import logo from '../../Assets/logo.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const salonData = JSON.parse(localStorage.getItem("salonUser"));
    if (!salonData?.id) {
      navigate("/");
      return;
    }

    fetchCustomers();
  }, []);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchTerm, filterStatus, sortBy]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const salonData = JSON.parse(localStorage.getItem("salonUser"));
      
      // Fetch appointments to get customer data
      const appointmentsRes = await axios.get(`https://dpdlab1.slt.lk:8447/salon-api/api/appointments/salon/${salonData.id}`);
      const appointments = appointmentsRes.data;

      // Process customers from appointments
      const customerMap = new Map();
      
      appointments.forEach(appointment => {
        const customer = appointment.user;
        if (customer && customer._id) {
          if (!customerMap.has(customer._id)) {
            customerMap.set(customer._id, {
              ...customer,
              totalAppointments: 0,
              totalSpent: 0,
              lastVisit: null,
              status: 'active',
              appointments: []
            });
          }
          
          const customerData = customerMap.get(customer._id);
          customerData.totalAppointments++;
          customerData.totalSpent += appointment.services[0]?.price || 0;
          customerData.appointments.push(appointment);
          
          if (!customerData.lastVisit || dayjs(appointment.date).isAfter(customerData.lastVisit)) {
            customerData.lastVisit = appointment.date;
          }
        }
      });

      // Convert to array and calculate status
      const customersArray = Array.from(customerMap.values()).map(customer => {
        const daysSinceLastVisit = dayjs().diff(dayjs(customer.lastVisit), 'days');
        
        let status = 'active';
        if (daysSinceLastVisit > 90) {
          status = 'inactive';
        } else if (daysSinceLastVisit > 30) {
          status = 'at-risk';
        }

        return {
          ...customer,
          status,
          avgSpentPerVisit: customer.totalAppointments > 0 ? Math.round(customer.totalSpent / customer.totalAppointments) : 0
        };
      });

      setCustomers(customersArray);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCustomers = () => {
    let filtered = [...customers];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(customer => customer.status === filterStatus);
    }

    // Sort customers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        case 'totalAppointments':
          return b.totalAppointments - a.totalAppointments;
        case 'lastVisit':
          return dayjs(b.lastVisit).diff(dayjs(a.lastVisit));
        default:
          return 0;
      }
    });

    setFilteredCustomers(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'at-risk':
        return 'yellow';
      case 'inactive':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return 'fa-check-circle';
      case 'at-risk':
        return 'fa-exclamation-triangle';
      case 'inactive':
        return 'fa-times-circle';
      default:
        return 'fa-question-circle';
    }
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const sendMessage = (customer) => {
    // Implement messaging functionality
    alert(`Sending message to ${customer.name}`);
  };

  const addNote = (customer) => {
    // Implement note adding functionality
    const note = prompt('Add a note for this customer:');
    if (note) {
      // Update customer with note
      console.log('Note added:', note);
    }
  };

  const handleAddCustomerInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    try {
      // Create new user in backend
      const response = await axios.post('https://dpdlab1.slt.lk:8447/salon-api/api/users/register', newCustomerData);
      
      if (response.data) {
        alert('Customer added successfully!');
        // Reset form
        setNewCustomerData({
          name: '',
          email: '',
          phone: '',
          password: ''
        });
        setShowAddCustomerModal(false);
        // Refresh customer list
        fetchCustomers();
      }
    } catch (error) {
      console.error('Failed to add customer:', error);
      alert(error.response?.data?.message || 'Failed to add customer. Please try again.');
    }
  };

  const openAddCustomerModal = () => {
    setNewCustomerData({
      name: '',
      email: '',
      phone: '',
      password: ''
    });
    setShowAddCustomerModal(true);
  };

  const closeAddCustomerModal = () => {
    setShowAddCustomerModal(false);
    setNewCustomerData({
      name: '',
      email: '',
      phone: '',
      password: ''
    });
  };

  const exportToPDF = () => {
    const salonData = JSON.parse(localStorage.getItem("salonUser"));
    const salonName = salonData?.name || 'Salon';
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Client Report - ${salonName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #10b981; padding-bottom: 20px; }
          .header h1 { color: #10b981; font-size: 28px; margin-bottom: 5px; }
          .header h2 { color: #666; font-size: 18px; font-weight: normal; }
          .meta-info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 12px; color: #666; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; }
          .summary-card h3 { font-size: 24px; color: #10b981; margin-bottom: 5px; }
          .summary-card p { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #10b981; color: white; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; }
          td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
          .status-active { background-color: #d1fae5; color: #065f46; }
          .status-at-risk { background-color: #fef3c7; color: #92400e; }
          .status-inactive { background-color: #fee2e2; color: #991b1b; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${salonName}</h1>
          <h2>Client Report</h2>
        </div>
        <div class="meta-info">
          <div><strong>Report Date:</strong> ${dayjs().format('MMMM DD, YYYY')}</div>
          <div><strong>Total Clients:</strong> ${filteredCustomers.length}</div>
        </div>
        <div class="summary">
          <div class="summary-card"><h3>${customers.length}</h3><p>Total Customers</p></div>
          <div class="summary-card"><h3>${customers.filter(c => c.status === 'active').length}</h3><p>Active Customers</p></div>
          <div class="summary-card"><h3>${customers.filter(c => c.status === 'at-risk').length}</h3><p>At Risk</p></div>
          <div class="summary-card"><h3>LKR ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}</h3><p>Total Revenue</p></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th>
              <th>Appointments</th><th>Total Spent</th><th>Avg/Visit</th><th>Last Visit</th>
            </tr>
          </thead>
          <tbody>
            ${filteredCustomers.map((customer, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><strong>${customer.name}</strong></td>
                <td>${customer.email}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td><span class="status-badge status-${customer.status}">${customer.status}</span></td>
                <td>${customer.totalAppointments}</td>
                <td>LKR ${customer.totalSpent.toLocaleString()}</td>
                <td>LKR ${customer.avgSpentPerVisit.toLocaleString()}</td>
                <td>${dayjs(customer.lastVisit).format('MMM DD, YYYY')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Generated by ${salonName} - ${dayjs().format('MMMM DD, YYYY [at] hh:mm A')}</p>
          <p>This is a computer-generated document. No signature is required.</p>
        </div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <script>
          window.onload = function() {
            const element = document.body;
            const opt = {
              margin: 10,
              filename: 'clients_report_${dayjs().format('YYYY-MM-DD')}.pdf',
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };
            html2pdf().set(opt).from(element).save().then(() => {
              window.close();
            });
          };
        </script>
      </body>
      </html>
    `;

    // Open new window and trigger PDF download
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="customer-management-page">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-full-page">
      <div className="admin-layout">
        {/* Sidebar (match Admin Dashboard) */}
        <aside className="admin-sidebar">
          <img src={logo} alt="Brand Logo" className="admin-logo" />
          <div className="sidebar-section" style={{ gap: 6 }}>
            <div className="sidebar-link" onClick={() => navigate('/admin-dashboard')} title="Dashboard">
              <i className="fas fa-home"></i>
              <span>Dashboard</span>
            </div>
            <div className="sidebar-link active" onClick={() => navigate('/customers')} title="Client">
              <i className="fas fa-users"></i>
              <span>Client</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/admincalendar')} title="Booking">
              <i className="fas fa-calendar-check"></i>
              <span>Booking</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/professionals')} title="Staff">
              <i className="fas fa-user-tie"></i>
              <span>Staff</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/services')} title="Services">
              <i className="fas fa-concierge-bell"></i>
              <span>Services</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/promotions')} title="Promotions">
              <i className="fas fa-bullhorn"></i>
              <span>Promotions</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main-content">
          {/* Header (match Admin Dashboard style) */}
          <header className="admin-header">
            <div className="header-left">
              <h1>Clients</h1>
              <p>Manage your salon's customer relationships</p>
            </div>
            <div className="admin-header-right">
              <button className="logout-btn" style={{ background:'#3b82f6' }} onClick={openAddCustomerModal}>
                <i className="fa-solid fa-user-plus"></i>
                Add Customer
              </button>
              <button 
                className="logout-btn" 
                style={{ background:'#dc2626' }} 
                onClick={exportToPDF}
              >
                <i className="fa-solid fa-file-pdf"></i>
                Export PDF
              </button>
            </div>
          </header>

        {/* Filters and Search */}
        <section className="filters-section">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filters">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Customers</option>
              <option value="active">Active</option>
              <option value="at-risk">At Risk</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Sort by Name</option>
              <option value="totalSpent">Sort by Total Spent</option>
              <option value="totalAppointments">Sort by Appointments</option>
              <option value="lastVisit">Sort by Last Visit</option>
            </select>
          </div>
        </section>

        {/* Customer Stats */}
        <section className="customer-stats">
          <div className="stat-card">
            <div className="stat-icon blue">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <h3>{customers.length}</h3>
              <p>Total Customers</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{customers.filter(c => c.status === 'active').length}</h3>
              <p>Active Customers</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="stat-content">
              <h3>{customers.filter(c => c.status === 'at-risk').length}</h3>
              <p>At Risk</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="stat-content">
              <h3>LKR {customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
        </section>

        {/* Customer List */}
        <section className="customer-list">
          <div className="list-header">
            <h3>Customer List ({filteredCustomers.length})</h3>
          </div>
          <div className="customer-grid">
            {filteredCustomers.map(customer => (
              <div key={customer._id} className="customer-card" onClick={() => handleCustomerClick(customer)}>
                <div className="customer-header">
                  <div className="customer-avatar">
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="customer-info">
                    <h4>{customer.name}</h4>
                    <p>{customer.email}</p>
                    {customer.phone && <p>{customer.phone}</p>}
                  </div>
                  <div className={`status-badge ${getStatusColor(customer.status)}`}>
                    <i className={`fas ${getStatusIcon(customer.status)}`}></i>
                    {customer.status}
                  </div>
                </div>
                <div className="customer-metrics">
                  <div className="metric">
                    <span className="metric-label">Appointments</span>
                    <span className="metric-value">{customer.totalAppointments}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Total Spent</span>
                    <span className="metric-value">LKR {customer.totalSpent.toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Last Visit</span>
                    <span className="metric-value">{dayjs(customer.lastVisit).format('MMM DD, YYYY')}</span>
                  </div>
                </div>
                <div className="customer-actions">
                  <button 
                    className="action-btn message"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendMessage(customer);
                    }}
                  >
                    <i className="fas fa-envelope"></i>
                  </button>
                  <button 
                    className="action-btn note"
                    onClick={(e) => {
                      e.stopPropagation();
                      addNote(customer);
                    }}
                  >
                    <i className="fas fa-sticky-note"></i>
                  </button>
                  <button 
                    className="action-btn view"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCustomerClick(customer);
                    }}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Customer Detail Modal */}
        {showCustomerModal && selectedCustomer && (
          <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
            <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Customer Details</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowCustomerModal(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-content">
                <div className="customer-detail-header">
                  <div className="detail-avatar">
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="detail-info">
                    <h4>{selectedCustomer.name}</h4>
                    <p>{selectedCustomer.email}</p>
                    {selectedCustomer.phone && <p>{selectedCustomer.phone}</p>}
                    <div className={`status-badge ${getStatusColor(selectedCustomer.status)}`}>
                      <i className={`fas ${getStatusIcon(selectedCustomer.status)}`}></i>
                      {selectedCustomer.status}
                    </div>
                  </div>
                </div>
                
                <div className="detail-metrics">
                  <div className="detail-metric">
                    <h5>Total Appointments</h5>
                    <p>{selectedCustomer.totalAppointments}</p>
                  </div>
                  <div className="detail-metric">
                    <h5>Total Spent</h5>
                    <p>LKR {selectedCustomer.totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="detail-metric">
                    <h5>Average per Visit</h5>
                    <p>LKR {selectedCustomer.avgSpentPerVisit.toLocaleString()}</p>
                  </div>
                  <div className="detail-metric">
                    <h5>Last Visit</h5>
                    <p>{dayjs(selectedCustomer.lastVisit).format('MMM DD, YYYY')}</p>
                  </div>
                </div>

                <div className="appointment-history">
                  <h5>Recent Appointments</h5>
                  <div className="history-list">
                    {selectedCustomer.appointments.slice(0, 5).map((appointment, index) => (
                      <div key={index} className="history-item">
                        <div className="history-date">
                          {dayjs(appointment.date).format('MMM DD, YYYY')}
                        </div>
                        <div className="history-service">
                          {appointment.services[0]?.name}
                        </div>
                        <div className="history-price">
                          LKR {appointment.services[0]?.price}
                        </div>
                        <div className={`history-status ${appointment.status.toLowerCase()}`}>
                          {appointment.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddCustomerModal && (
          <div className="modal-overlay" onClick={closeAddCustomerModal}>
            <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Customer</h3>
                <button className="close-btn" onClick={closeAddCustomerModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleAddCustomer} className="modal-content">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newCustomerData.name}
                    onChange={handleAddCustomerInputChange}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={newCustomerData.email}
                    onChange={handleAddCustomerInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newCustomerData.phone}
                    onChange={handleAddCustomerInputChange}
                    placeholder="+94 77 123 4567"
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={newCustomerData.password}
                    onChange={handleAddCustomerInputChange}
                    placeholder="Enter password"
                    required
                    minLength="6"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeAddCustomerModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    Add Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default CustomerManagement;

