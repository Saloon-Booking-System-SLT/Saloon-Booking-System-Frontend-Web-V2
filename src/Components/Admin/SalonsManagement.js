import React, { useEffect, useState } from 'react';
import './SalonsManagement.css';
import { useNavigate } from 'react-router-dom';
import axios from '../../Api/axios';
import AdminLayout from './AdminLayout';

// Main Salons Management Component
const SalonsManagement = () => {
  const [salons, setSalons] = useState([]);
  const [filteredSalons, setFilteredSalons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch salons data
  const fetchSalons = async () => {
    setLoading(true);
    try {
      // LOG THE URL for debugging
      console.log('Requesting URL:', axios.defaults.baseURL + '/admin/salons');

      // The token will be automatically added by the interceptor
      const res = await axios.get('/admin/salons');
      
      setSalons(res.data);
      setFilteredSalons(res.data);
    } catch (err) {
      console.error('Failed to fetch salons', err);
      if (err.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/admin-login');
      } else if (err.code === 'ERR_NETWORK') {
        alert('Cannot connect to server. Please make sure the backend is running on port 5000.');
      } else {
        // Show the actual error message from the backend
        const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
        alert(`Error fetching salons: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, []);

  // Filter salons based on search and filters
  useEffect(() => {
    let filtered = salons;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(salon =>
        salon.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(salon => {
        if (statusFilter === 'Pending') return salon.approvalStatus === 'pending';
        if (statusFilter === 'Approved') return salon.approvalStatus === 'approved';
        if (statusFilter === 'Rejected') return salon.approvalStatus === 'rejected';
        return true;
      });
    }

    // City filter
    if (cityFilter !== 'All') {
      filtered = filtered.filter(salon =>
        salon.location?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter(salon => salon.salonType === typeFilter);
    }

    setFilteredSalons(filtered);
  }, [searchQuery, statusFilter, cityFilter, typeFilter, salons]);

  // Approve salon
  const handleApproveSalon = async (salonId) => {
    if (!window.confirm('Are you sure you want to approve this salon?')) return;
    
    try {
      // Token automatically added by interceptor
      await axios.patch(`/admin/salons/${salonId}/approve`);
      
      alert('Salon approved successfully!');
      fetchSalons(); // Refresh the list
    } catch (err) {
      console.error('Failed to approve salon', err);
      alert('Failed to approve salon: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  // Reject salon
  const handleRejectSalon = async (salonId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      // Token automatically added by interceptor
      await axios.patch(`/admin/salons/${salonId}/reject`, { reason });
      
      alert('Salon rejected successfully!');
      fetchSalons(); // Refresh the list
    } catch (err) {
      console.error('Failed to reject salon', err);
      alert('Failed to reject salon: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  // Get unique cities from salons
  const cities = ['All', ...new Set(salons.map(s => s.location).filter(Boolean))];
  const types = ['All', ...new Set(salons.map(s => s.salonType).filter(Boolean))];

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'status-active';
      case 'rejected':
        return 'status-suspended';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-pending';
    }
  };

  return (
    <AdminLayout>
      <div className="salons-content">
        {/* Header */}
        <div className="salons-header">
          <div>
            <h1 className="page-title">Salons</h1>
            <p className="page-subtitle">
              Manage all salon accounts, including approvals, rejections, and details.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="filters-section">
          <div className="search-box">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search by name, email, or location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters-row">
            <div className="filter-dropdown">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <i className="fas fa-chevron-down filter-icon"></i>
            </div>

            <div className="filter-dropdown">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Cities</option>
                {cities.slice(1).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down filter-icon"></i>
            </div>

            <div className="filter-dropdown">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Types</option>
                {types.slice(1).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down filter-icon"></i>
            </div>
          </div>
        </div>

        {/* Salons Table */}
        <div className="salons-table-section">
          <div className="table-wrapper">
            <table className="salons-table">
              <thead>
                <tr>
                  <th>Salon Name</th>
                  <th>Owner Email</th>
                  <th>City</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="no-data">Loading...</td>
                  </tr>
                ) : filteredSalons.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">No salons found</td>
                  </tr>
                ) : (
                  filteredSalons.map((salon) => (
                    <tr key={salon._id}>
                      <td className="salon-name">{salon.name}</td>
                      <td className="owner-name">{salon.email}</td>
                      <td className="city-name">{salon.location || 'N/A'}</td>
                      <td>{salon.salonType || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(salon.approvalStatus)}`}>
                          {salon.approvalStatus || 'pending'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {salon.approvalStatus === 'pending' && (
                            <>
                              <button 
                                className="view-details-btn"
                                style={{ backgroundColor: '#28a745' }}
                                onClick={() => handleApproveSalon(salon._id)}
                              >
                                ✓ Approve
                              </button>
                              <button 
                                className="view-details-btn"
                                style={{ backgroundColor: '#dc3545' }}
                                onClick={() => handleRejectSalon(salon._id)}
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                          {salon.approvalStatus === 'rejected' && (
                            <button 
                              className="view-details-btn"
                              style={{ backgroundColor: '#28a745' }}
                              onClick={() => handleApproveSalon(salon._id)}
                            >
                              ✓ Approve
                            </button>
                          )}
                          {salon.approvalStatus === 'approved' && (
                            <button 
                              className="view-details-btn"
                              style={{ backgroundColor: '#dc3545' }}
                              onClick={() => handleRejectSalon(salon._id)}
                            >
                              ✗ Reject
                            </button>
                          )}
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
    </AdminLayout>
  );
};

export default SalonsManagement;