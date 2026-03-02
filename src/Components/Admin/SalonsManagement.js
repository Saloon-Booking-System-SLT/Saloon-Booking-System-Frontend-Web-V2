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
  MapPinIcon,
  TrashIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const SalonsManagement = () => {
  const [salons, setSalons] = useState([]);
  const [filteredSalons, setFilteredSalons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Terminate salon
  const handleTerminateSalon = async (salonId) => {
    const reason = prompt('Please provide a reason for terminating this salon (this will hide them from the app):');
    if (!reason) return;
    try {
      await axios.patch(`/admin/salons/${salonId}/terminate`, { reason });
      alert('Salon terminated successfully!');
      fetchSalons();
    } catch (err) {
      console.error('Failed to terminate salon', err);
      alert('Failed to terminate salon: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  // Delete salon
  const handleDeleteSalon = async (salonId) => {
    if (!window.confirm('WARNING: Are you sure you want to PERMANENTLY delete this salon and all associated data including appointments and professionals?')) return;
    try {
      await axios.delete(`/admin/salons/${salonId}`);
      alert('Salon deleted successfully!');
      fetchSalons();
    } catch (err) {
      console.error('Failed to delete salon', err);
      alert('Failed to delete salon: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const openDetailsModal = (salon) => {
    setSelectedSalon(salon);
    setIsModalOpen(true);
  };

  const cities = ['All', ...new Set(salons.map(s => s.location).filter(Boolean))];
  const types = ['All', ...new Set(salons.map(s => s.salonType).filter(Boolean))];

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">Approved</span>;
    if (s === 'rejected') return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-100 text-red-800">Rejected</span>;
    if (s === 'terminated') return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-gray-100 text-gray-800">Terminated</span>;
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
                              className="text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-200"
                              onClick={() => openDetailsModal(salon)}
                            >
                              Details
                            </button>
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
                            <button
                              className="p-1.5 bg-gray-50 text-gray-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-gray-200 hover:border-red-200 ml-1"
                              onClick={() => handleDeleteSalon(salon._id)}
                              title="Delete Salon"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ) : salon.approvalStatus === 'approved' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-200"
                              onClick={() => openDetailsModal(salon)}
                            >
                              Details
                            </button>
                            <button
                              className="text-sm font-bold text-orange-600 hover:text-orange-800 transition-colors bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-200"
                              onClick={() => handleTerminateSalon(salon._id)}
                              title="Terminate (Hide from App)"
                            >
                              Terminate
                            </button>
                            <button
                              className="p-1.5 bg-gray-50 text-gray-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-gray-200 hover:border-red-200"
                              onClick={() => handleDeleteSalon(salon._id)}
                              title="Delete Salon"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-200"
                              onClick={() => openDetailsModal(salon)}
                            >
                              Details
                            </button>
                            <button
                              className="p-1.5 bg-gray-50 text-gray-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-gray-200 hover:border-red-200"
                              onClick={() => handleDeleteSalon(salon._id)}
                              title="Delete Salon"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
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

      {/* Details Modal */}
      {isModalOpen && selectedSalon && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-2xl leading-6 font-bold text-gray-900 flex items-center gap-2" id="modal-title">
                        <BuildingStorefrontIcon className="w-7 h-7 text-primary-600" />
                        Salon Details
                      </h3>
                      {getStatusBadge(selectedSalon.approvalStatus)}
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 border-b border-gray-200 pb-2">Business Info</h4>
                          <p className="font-bold text-gray-900 text-lg">{selectedSalon.name}</p>
                          <div className="mt-2 space-y-2 text-sm text-gray-600">
                            <p className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> Owner: {selectedSalon.ownerName || 'N/A'}</p>
                            <p className="flex items-center gap-2"><EnvelopeIcon className="w-4 h-4" /> {selectedSalon.email}</p>
                            <p className="flex items-center gap-2"><PhoneIcon className="w-4 h-4" /> {selectedSalon.phone}</p>
                            <p className="flex items-start gap-2"><MapPinIcon className="w-4 h-4 mt-1 flex-shrink-0" /> <span>{selectedSalon.location}</span></p>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 border-b border-gray-200 pb-2">Operations</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p className="flex items-center gap-2"><ClockIcon className="w-4 h-4" /> Hours: <span className="font-medium text-gray-900">{selectedSalon.workingHours || 'Not specified'}</span></p>
                            <p className="flex items-center gap-2"><BuildingStorefrontIcon className="w-4 h-4" /> Type: <span className="font-medium text-gray-900">{selectedSalon.salonType || 'Not specified'}</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-full">
                          <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 border-b border-gray-200 pb-2">Offered Services</h4>
                          {selectedSalon.services && selectedSalon.services.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedSalon.services.map((service, idx) => (
                                <span key={idx} className="bg-primary-50 text-primary-700 border border-primary-100 px-3 py-1 rounded-full text-sm font-semibold">
                                  {service}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No services listed</p>
                          )}
                        </div>

                        {selectedSalon.rejectionReason && (
                          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                            <h4 className="text-sm font-bold text-red-500 uppercase mb-2">Rejection Reason</h4>
                            <p className="text-sm text-red-700">{selectedSalon.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image Preview (if exists) */}
                    {selectedSalon.image && (
                      <div className="mt-6 border-t border-gray-200 pt-5">
                        <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Salon Image</h4>
                        <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                          <img src={selectedSalon.image} alt="Salon preview" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl border-t border-gray-200">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SalonsManagement;