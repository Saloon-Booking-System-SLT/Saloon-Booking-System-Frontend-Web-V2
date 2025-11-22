import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import './FinancialInsights.css';

const FinancialInsights = () => {
  // const [selectedPeriod, setSelectedPeriod] = useState('month'); // Commented out unused variable
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 10;

  // Sample payment data
  const [payments] = useState([
    {
      id: 1,
      salon: 'Glam Studio',
      date: '2024-11-16',
      amount: 1250.00,
      method: 'Credit Card',
      status: 'success'
    },
    {
      id: 2,
      salon: 'Nail Paradise',
      date: '2024-11-16',
      amount: 890.50,
      method: 'PayPal',
      status: 'success'
    },
    {
      id: 3,
      salon: 'Beauty Bar',
      date: '2024-11-15',
      amount: 1575.00,
      method: 'Bank Transfer',
      status: 'success'
    },
    {
      id: 4,
      salon: 'Spa Serenity',
      date: '2024-11-15',
      amount: 2100.00,
      method: 'Credit Card',
      status: 'pending'
    },
    {
      id: 5,
      salon: 'Style Studio',
      date: '2024-11-14',
      amount: 450.00,
      method: 'Debit Card',
      status: 'failed'
    },
    {
      id: 6,
      salon: 'Color Me Beautiful',
      date: '2024-11-14',
      amount: 1820.00,
      method: 'Credit Card',
      status: 'success'
    },
    {
      id: 7,
      salon: 'Luxury Spa & Salon',
      date: '2024-11-13',
      amount: 3200.00,
      method: 'Bank Transfer',
      status: 'success'
    },
    {
      id: 8,
      salon: 'Quick Cuts',
      date: '2024-11-13',
      amount: 320.00,
      method: 'Credit Card',
      status: 'failed'
    },
    {
      id: 9,
      salon: 'Glam Studio',
      date: '2024-11-12',
      amount: 1450.00,
      method: 'PayPal',
      status: 'success'
    },
    {
      id: 10,
      salon: 'Nail Paradise',
      date: '2024-11-12',
      amount: 950.00,
      method: 'Credit Card',
      status: 'success'
    },
    {
      id: 11,
      salon: 'Beauty Bar',
      date: '2024-11-11',
      amount: 1680.00,
      method: 'Bank Transfer',
      status: 'success'
    },
    {
      id: 12,
      salon: 'Spa Serenity',
      date: '2024-11-11',
      amount: 2250.00,
      method: 'Credit Card',
      status: 'success'
    }
  ]);

  // Failed payments
  const failedPayments = payments.filter(p => p.status === 'failed');

  // Filter payments by search
  const filteredPayments = payments.filter(payment =>
    payment.salon.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.date.includes(searchQuery) ||
    payment.amount.toString().includes(searchQuery)
  );

  // Pagination logic
  const indexOfLastPayment = currentPage * paymentsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstPayment, indexOfLastPayment);
  const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Export functions
  const handleExportCSV = () => {
    console.log('Exporting CSV...');
    alert('Exporting payment data to CSV...');
  };

  const handleExportPDF = () => {
    console.log('Exporting PDF...');
    alert('Exporting payment data to PDF...');
  };

  // Get status class
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'success': return 'status-success';
      case 'pending': return 'status-pending';
      case 'failed': return 'status-failed';
      default: return '';
    }
  };

  return (
    <AdminLayout>
      <div className="financial-container">
        {/* Header */}
        <div className="financial-header">
          <h1 className="page-title">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Financial Insights
          </h1>
          <p className="page-subtitle">Track platform-level revenue and manage payments</p>
        </div>

        {/* Summary Cards */}
        <div className="summary-grid">
          {/* Monthly Revenue */}
          <div className="summary-card">
            <div className="card-header">
              <div className="card-info">
                <h3>Monthly Revenue</h3>
                <div className="card-value">$15,000</div>
                <div className="card-change positive">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +15%
                </div>
              </div>
              <div className="card-icon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="mini-chart">
              <div className="mini-bars">
                <div className="mini-bar" style={{ height: '60%' }}></div>
                <div className="mini-bar" style={{ height: '75%' }}></div>
                <div className="mini-bar" style={{ height: '50%' }}></div>
                <div className="mini-bar" style={{ height: '85%' }}></div>
                <div className="mini-bar" style={{ height: '70%' }}></div>
                <div className="mini-bar" style={{ height: '90%' }}></div>
                <div className="mini-bar" style={{ height: '100%' }}></div>
              </div>
            </div>
          </div>

          {/* Commission Breakdown */}
          <div className="summary-card">
            <div className="card-header">
              <div className="card-info">
                <h3>Commission Breakdown</h3>
                <div className="card-value">$2,250</div>
                <div className="card-change negative">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  -5%
                </div>
              </div>
              <div className="card-icon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="mini-chart">
              <div className="mini-bars">
                <div className="mini-bar" style={{ height: '100%' }}></div>
                <div className="mini-bar" style={{ height: '85%' }}></div>
                <div className="mini-bar" style={{ height: '90%' }}></div>
                <div className="mini-bar" style={{ height: '70%' }}></div>
                <div className="mini-bar" style={{ height: '65%' }}></div>
                <div className="mini-bar" style={{ height: '60%' }}></div>
                <div className="mini-bar" style={{ height: '55%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Failed Payment Alerts */}
        {failedPayments.length > 0 && (
          <div className="failed-payments-section">
            <div className="alert-header">
              <div className="alert-icon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="alert-title">Failed Payment Alerts</h2>
                <p style={{ color: '#991b1b', fontSize: '13px', margin: '4px 0 0 0' }}>
                  {failedPayments.length} payment{failedPayments.length !== 1 ? 's' : ''} require{failedPayments.length === 1 ? 's' : ''} attention
                </p>
              </div>
            </div>
            <ul className="alert-list">
              {failedPayments.map((payment) => (
                <li key={payment.id} className="alert-item">
                  <div className="alert-item-info">
                    <div className="alert-salon">{payment.salon}</div>
                    <div className="alert-reason">Payment failed - {payment.method} declined</div>
                  </div>
                  <div className="alert-amount">${payment.amount.toFixed(2)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Payment Logs Section */}
        <div className="payment-logs-section">
          <div className="section-header">
            <h2 className="section-title">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Payment Logs
            </h2>
            <div className="export-buttons">
              <button className="export-btn csv" onClick={handleExportCSV}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button className="export-btn pdf" onClick={handleExportPDF}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export PDF
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-bar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by salon, date, or amount..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Payment Table */}
          <div className="payment-table-container">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Salon</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentPayments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p>No payment records found</p>
                    </td>
                  </tr>
                ) : (
                  currentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="salon-name">{payment.salon}</td>
                      <td className="date-cell">{payment.date}</td>
                      <td className="amount-cell">${payment.amount.toFixed(2)}</td>
                      <td>
                        <span className="method-badge">{payment.method}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
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
      </div>
    </AdminLayout>
  );
};

export default FinancialInsights;