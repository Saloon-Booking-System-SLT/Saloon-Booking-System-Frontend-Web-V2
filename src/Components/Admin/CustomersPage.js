import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import LoadingSpinner from '../Common/LoadingSpinner';
import './CustomersPage.css';
import axios from '../../Api/axios';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const customersPerPage = 10;

  // Fetch customers from backend
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required');
          setIsLoading(false);
          return;
        }

        // Fetch customers from backend
        const response = await axios.get('/admin/customers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Transform data to match component expectations
        const transformedCustomers = response.data.map(customer => ({
          _id: customer._id,
          name: customer.name || 'Unknown',
          email: customer.email || 'N/A',
          phone: customer.phone || 'N/A',
          photoURL: customer.photoURL || null,
          bookings: customer.bookings || 0,
          totalSpent: customer.totalSpent || 0,
          avgSpend: Math.round(customer.avgSpend || 0),
          loyaltyScore: customer.loyaltyScore || null,
          isBlacklisted: customer.isBlacklisted || false,
          smsOptIn: customer.smsOptIn || false,
          isRegistered: customer.isRegistered !== undefined ? customer.isRegistered : true,
          lastBooking: customer.lastBooking || null
        }));

        setCustomers(transformedCustomers);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError(err.response?.data?.message || 'Failed to fetch customers');
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []); // Run once on component mount

  // Filter customers by search
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // View customer details
  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get loyalty score color
  const getLoyaltyColor = (score) => {
    if (score === null) return 'gray';
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="error-message">{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="customers-container">
        {/* Header */}
        <div className="customers-header">
          <h1 className="page-title">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Customers Management
          </h1>
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-label">Total</span>
              <span className="stat-value">{customers.length}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Registered</span>
              <span className="stat-value">{customers.filter(c => c.isRegistered).length}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Guests</span>
              <span className="stat-value">{customers.filter(c => !c.isRegistered).length}</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>

        {/* Customers Table */}
        <div className="customers-table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Bookings</th>
                <th>Avg. Spend</th>
                <th>Loyalty Score</th>
                <th>Blacklist</th>
                <th>SMS Opt-in</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    No customers found
                  </td>
                </tr>
              ) : (
                currentCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td className="customer-info">
                      {customer.photoURL ? (
                        <img src={customer.photoURL} alt={customer.name} className="customer-avatar" />
                      ) : (
                        <div className="customer-avatar-placeholder">
                          {customer.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <div className="customer-name">{customer.name}</div>
                        <div className="customer-email">{customer.email}</div>
                      </div>
                    </td>
                    <td className="bookings-cell">
                      <span className="badge badge-blue">{customer.bookings}</span>
                    </td>
                    <td className="spend-cell">${customer.avgSpend}</td>
                    <td>
                      {customer.loyaltyScore === null ? (
                        <span className="loyalty-na">N/A</span>
                      ) : (
                        <div className="loyalty-score">
                          <div className="loyalty-bar">
                            <div 
                              className="loyalty-fill" 
                              style={{ 
                                width: `${customer.loyaltyScore}%`,
                                backgroundColor: getLoyaltyColor(customer.loyaltyScore)
                              }}
                            ></div>
                          </div>
                          <span className="loyalty-value">{customer.loyaltyScore}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {customer.isBlacklisted ? (
                        <span className="status-badge blacklisted">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                          </svg>
                          Yes
                        </span>
                      ) : (
                        <span className="status-badge active">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          No
                        </span>
                      )}
                    </td>
                    <td>
                      {customer.smsOptIn ? (
                        <span className="opt-in yes">✓ Yes</span>
                      ) : (
                        <span className="opt-in no">✗ No</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="view-details-btn"
                        onClick={() => handleViewDetails(customer)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <div className="pagination-numbers">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  className={`pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button 
              className="pagination-btn"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Customer Details
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="customer-profile">
                <div className="profile-photo-placeholder">
                  {selectedCustomer.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="profile-info">
                  <h3>{selectedCustomer.name}</h3>
                  <p>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {selectedCustomer.email}
                  </p>
                  <p>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {selectedCustomer.phone}
                  </p>
                  <p>
                    Status: {selectedCustomer.isRegistered ? (
                      <span className="status-badge registered">Registered</span>
                    ) : (
                      <span className="status-badge guest">Guest</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="customer-stats-grid">
                <div className="stat-card">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h4>{selectedCustomer.bookings}</h4>
                    <p>Total Bookings</p>
                  </div>
                </div>
                <div className="stat-card">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4>${selectedCustomer.totalSpent}</h4>
                    <p>Total Spent</p>
                  </div>
                </div>
                <div className="stat-card">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div>
                    <h4>${selectedCustomer.avgSpend}</h4>
                    <p>Avg. Spend</p>
                  </div>
                </div>
                <div className="stat-card">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <div>
                    <h4>{selectedCustomer.loyaltyScore === null ? 'N/A' : selectedCustomer.loyaltyScore}</h4>
                    <p>Loyalty Score</p>
                  </div>
                </div>
              </div>

              <div className="detail-row">
                <strong>SMS Opt-in:</strong>
                <span>{selectedCustomer.smsOptIn ? '✓ Yes' : '✗ No'}</span>
              </div>
              <div className="detail-row">
                <strong>Blacklisted:</strong>
                <span>{selectedCustomer.isBlacklisted ? 'Yes' : 'No'}</span>
              </div>
              <div className="detail-row">
                <strong>Last Booking:</strong>
                <span>{formatDate(selectedCustomer.lastBooking)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CustomersPage;