import React, { useState, useEffect } from 'react';
import axios from '../../Api/axios';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

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
 console.log('Requesting URL:', axios.defaults.baseURL + '/admin/salons');
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

    if (searchQuery) {
      filtered = filtered.filter(salon =>
        salon.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(salon => {
        if (statusFilter === 'Pending') return salon.approvalStatus === 'pending';
        if (statusFilter === 'Approved') return salon.approvalStatus === 'approved';
        if (statusFilter === 'Rejected') return salon.approvalStatus === 'rejected';
        return true;
      });
    }

    if (cityFilter !== 'All') {
      filtered = filtered.filter(salon =>
        salon.location?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    if (typeFilter !== 'All') {
      filtered = filtered.filter(salon => salon.salonType === typeFilter);
    }

    setFilteredSalons(filtered);
  }, [searchQuery, statusFilter, cityFilter, typeFilter, salons]);

  // Approve salon
  const handleApproveSalon = async (salonId) => {
    if (!window.confirm('Are you sure you want to approve this salon?')) return;
    try {
      await axios.patch(`/admin/salons/${salonId}/approve`);
      alert('Salon approved successfully!');
      fetchSalons();
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
      await axios.patch(`/admin/salons/${salonId}/reject`, { reason });
      alert('Salon rejected successfully!');
      fetchSalons();
    } catch (err) {
 console.error('Failed to reject salon', err);
      alert('Failed to reject salon: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const cities = ['All', ...new Set(salons.map(s => s.location).filter(Boolean))];
  const types = ['All', ...new Set(salons.map(s => s.salonType).filter(Boolean))];

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">Approved</span>;
    if (s === 'rejected') return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-100 text-red-800">Rejected</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">Pending</span>;
  };

  return (
    <AdminLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-600 rounded-l-2xl"></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <BuildingStorefrontIcon className="w-8 h-8 text-primary-600" />
              Salons Management
            </h1>
            <p className="text-gray-500 mt-1 ml-11">Review, approve, and manage salon accounts across the platform.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Search by name, email, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="md:col-span-8 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[140px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FunnelIcon className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div className="relative flex-1 min-w-[140px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                >
                  {cities.map(city => (
                    <option key={city} value={city}>{city === 'All' ? 'All Cities' : city}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div className="relative flex-1 min-w-[140px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingStorefrontIcon className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  {types.map(type => (
                    <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Loading salons data...</p>
            </div>
          ) : filteredSalons.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BuildingStorefrontIcon className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1">No Salons Found</p>
              <p className="text-gray-500">Adjust your search or filters to see more results.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Salon Information</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type & Location</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSalons.map(salon => (
                    <tr key={salon._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{salon.name}</div>
                        <div className="text-sm text-primary-600 font-medium">{salon.ownerName || 'Owner Info N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{salon.email}</div>
                        <div className="text-sm text-gray-500">{salon.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-block px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold mb-1">{salon.salonType || 'Unspecified'}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <MapPinIcon className="w-3.5 h-3.5" /> {salon.location || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(salon.approvalStatus)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {salon.approvalStatus === 'pending' || !salon.approvalStatus ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors border border-emerald-200"
                              onClick={() => handleApproveSalon(salon._id)}
                              title="Approve"
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                            </button>
                            <button
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-red-200"
                              onClick={() => handleRejectSalon(salon._id)}
                              title="Reject"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-200"
                            onClick={() => {
                              // Optional: Add view details modal or expand row
                              alert(`Viewing details for ${salon.name} is not fully implemented in this view yet.`);
                            }}
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SalonsManagement;