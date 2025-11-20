import React, { useEffect, useState } from 'react';
import './SalonsManagement.css';
import logo from '../../Assets/logo.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Sidebar Component
const AdminSidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="admin-sidebar">
      <img src={logo} alt="Brand Logo" className="admin-logo" />
      <div className="sidebar-section" style={{ gap: 6 }}>
        <div className="sidebar-link" onClick={() => navigate('/admin-dashboard')} title="Dashboard">
          <i className="fas fa-home"></i>
          <span>Dashboard</span>
        </div>
        <div className="sidebar-link active" onClick={() => navigate('/salons')} title="Salons">
          <i className="fas fa-store"></i>
          <span>Salons</span>
        </div>
        <div className="sidebar-link" onClick={() => navigate('/admincalendar')} title="Booking">
          <i className="fas fa-calendar-check"></i>
          <span>Booking</span>
        </div>
        <div className="sidebar-link" onClick={() => navigate('/customers')} title="Customers">
          <i className="fas fa-users"></i>
          <span>Customers</span>
        </div>
        <div className="sidebar-link" onClick={() => navigate('/feedback')} title="Feedback">
          <i className="fas fa-comments"></i>
          <span>Feedback</span>
        </div>
        <div className="sidebar-link" onClick={() => navigate('/promotions')} title="Promotions">
          <i className="fas fa-bullhorn"></i>
          <span>Promotions</span>
        </div>
      </div>
    </aside>
  );
};

// Main Salons Management Component
const SalonsManagement = () => {
  const [salons, setSalons] = useState([]);
  const [filteredSalons, setFilteredSalons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const navigate = useNavigate();

  // Fetch salons data
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/salons');
        const salonsData = res.data.map(salon => ({
          ...salon,
          status: salon.status || 'Active', // Default status if not in DB
          owner: salon.email, // Using email as owner for now
        }));
        setSalons(salonsData);
        setFilteredSalons(salonsData);
      } catch (err) {
        console.error('Failed to fetch salons', err);
      }
    };

    fetchSalons();
  }, []);

  // Filter salons based on search and filters
  useEffect(() => {
    let filtered = salons;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(salon =>
        salon.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(salon => salon.status === statusFilter);
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

  // Get unique cities from salons
  const cities = ['All', ...new Set(salons.map(s => s.location).filter(Boolean))];
  const types = ['All', ...new Set(salons.map(s => s.salonType).filter(Boolean))];

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'suspended':
        return 'status-suspended';
      case 'pending approval':
        return 'status-pending';
      default:
        return 'status-active';
    }
  };

  return (
    <div className="admin-full-page">
      <div className="admin-layout">
        <AdminSidebar />

        {/* Main Content */}
        <main className="admin-main-content">
          <div className="salons-content">
            {/* Header */}
            <div className="salons-header">
              <div>
                <h1 className="page-title">Salons</h1>
                <p className="page-subtitle">
                  Manage all salon accounts, including approvals, suspensions, and details.
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="filters-section">
              <div className="search-box">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Search"
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
                    <option value="All">Status</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Pending Approval">Pending Approval</option>
                  </select>
                  <i className="fas fa-chevron-down filter-icon"></i>
                </div>

                <div className="filter-dropdown">
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">City</option>
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
                    <option value="All">Type</option>
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
                      <th>Owner</th>
                      <th>City</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalons.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="no-data">No salons found</td>
                      </tr>
                    ) : (
                      filteredSalons.map((salon) => (
                        <tr key={salon._id}>
                          <td className="salon-name">{salon.name}</td>
                          <td className="owner-name">{salon.owner || salon.email}</td>
                          <td className="city-name">{salon.location || 'N/A'}</td>
                          <td>
                            <span className={`status-badge ${getStatusClass(salon.status)}`}>
                              {salon.status || 'Active'}
                            </span>
                          </td>
                          <td>
                            <button className="view-details-btn">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SalonsManagement;
