import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import LoadingSpinner from '../Common/LoadingSpinner';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ExclamationCircleIcon,
  CheckBadgeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <LoadingSpinner />
          <p className="mt-4 text-gray-500 font-medium">Loading customers...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center max-w-2xl mx-auto mt-10">
          <ExclamationCircleIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <p className="font-bold text-lg mb-2">Failed to load customers</p>
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-600 rounded-l-2xl"></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-primary-600" />
              Customers Management
            </h1>
            <p className="text-gray-500 mt-1 ml-11">View and manage all customer accounts on the platform.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-xl shadow-sm text-center min-w-[100px]">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total</div>
              <div className="text-2xl font-black text-primary-600 leading-none">{customers.length}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl shadow-sm text-center min-w-[100px]">
              <div className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest mb-1">Registered</div>
              <div className="text-2xl font-black text-emerald-600 leading-none">{customers.filter(c => c.isRegistered).length}</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 px-4 py-2.5 rounded-xl shadow-sm text-center min-w-[100px]">
              <div className="text-xs font-bold text-amber-600/70 uppercase tracking-widest mb-1">Guests</div>
              <div className="text-2xl font-black text-amber-600 leading-none">{customers.filter(c => !c.isRegistered).length}</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="relative max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors shadow-inner"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Bookings</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Avg. Spend</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Loyalty</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Blacklist</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">SMS Opt-In</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 bg-gray-50/30">
                      <UsersIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="font-medium">No customers found matching your criteria</p>
                    </td>
                  </tr>
                ) : (
                  currentCustomers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {customer.photoURL ? (
                            <img src={customer.photoURL} alt={customer.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-sm border-2 border-white">
                              {customer.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-900 leading-tight">{customer.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-600">
                        <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs border border-primary-100">{customer.bookings}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 tracking-tight">
                        Rs {customer.avgSpend.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {customer.loyaltyScore === null ? (
                          <span className="text-xs text-gray-400 font-medium italic">N/A</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full ${customer.loyaltyScore >= 80 ? 'bg-emerald-500' : customer.loyaltyScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(100, Math.max(0, customer.loyaltyScore))}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-gray-700">{customer.loyaltyScore}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {customer.isBlacklisted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                            <XMarkIcon className="w-3.5 h-3.5" />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckIcon className="w-3.5 h-3.5" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {customer.smsOptIn ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <CheckIcon className="w-4 h-4" />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400">
                            <XMarkIcon className="w-4 h-4" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                          onClick={() => handleViewDetails(customer)}
                        >
                          <UserCircleIcon className="w-4 h-4" />
                          Details
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <span className="text-sm text-gray-500">
                Showing <span className="font-bold text-gray-900">{indexOfFirstCustomer + 1}</span> to <span className="font-bold text-gray-900">{Math.min(indexOfLastCustomer, filteredCustomers.length)}</span> of <span className="font-bold text-gray-900">{filteredCustomers.length}</span> results
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                {/* Simplified page numbers for responsiveness */}
                <div className="flex gap-1 items-center">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => paginate(i + 1)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center ${currentPage === i + 1
                          ? 'bg-primary-600 text-white border border-primary-600'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UserCircleIcon className="w-6 h-6 text-primary-600" />
                Customer Intelligence
              </h2>
              <button
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                onClick={() => setShowModal(false)}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto w-full">
              {/* Profile Card */}
              <div className="flex flex-col sm:flex-row gap-6 mb-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full -z-0 opacity-50"></div>
                <div className="shrink-0 relative z-10 flex justify-center">
                  {selectedCustomer.photoURL ? (
                    <img src={selectedCustomer.photoURL} alt={selectedCustomer.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-3xl shadow-md border-4 border-white">
                      {selectedCustomer.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center relative z-10 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-black text-gray-900">{selectedCustomer.name}</h3>
                    {selectedCustomer.isRegistered ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><CheckBadgeIcon className="w-4 h-4" /> Registered</span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">Guest User</span>
                    )}
                  </div>
                  <div className="space-y-2 mt-2 border-t border-gray-100 pt-3">
                    <p className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                      <EnvelopeIcon className="w-4 h-4 text-primary-500" />
                      {selectedCustomer.email}
                    </p>
                    <p className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                      <PhoneIcon className="w-4 h-4 text-emerald-500" />
                      {selectedCustomer.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Analytics Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-center transition-transform hover:-translate-y-1">
                  <CalendarIcon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-black text-gray-900 leading-tight">{selectedCustomer.bookings}</div>
                  <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Bookings</div>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center transition-transform hover:-translate-y-1">
                  <CurrencyDollarIcon className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <div className="text-2xl font-black text-gray-900 leading-tight">Rs {selectedCustomer.totalSpent.toLocaleString()}</div>
                  <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Total Spent</div>
                </div>
                <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-4 text-center transition-transform hover:-translate-y-1">
                  <svg className="w-6 h-6 text-violet-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  <div className="text-2xl font-black text-gray-900 leading-tight">Rs {selectedCustomer.avgSpend.toLocaleString()}</div>
                  <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Avg. Spend</div>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-center transition-transform hover:-translate-y-1">
                  <StarIcon className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <div className="text-2xl font-black text-gray-900 leading-tight">{selectedCustomer.loyaltyScore === null ? 'N/A' : selectedCustomer.loyaltyScore}</div>
                  <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Loyalty</div>
                </div>
              </div>

              {/* Status Details */}
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Account Status</h4>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/30">
                  <span className="text-sm font-bold text-gray-700">SMS Opt-In Settings</span>
                  {selectedCustomer.smsOptIn ? (
                    <span className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <CheckIcon className="w-4 h-4" /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                      <XMarkIcon className="w-4 h-4" /> No
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 border-b border-gray-50">
                  <span className="text-sm font-bold text-gray-700">Blacklisted Override</span>
                  {selectedCustomer.isBlacklisted ? (
                    <span className="flex items-center gap-1 text-sm font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                      <XMarkIcon className="w-4 h-4" /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                      <CheckIcon className="w-4 h-4" /> No
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50/30">
                  <span className="text-sm font-bold text-gray-700">Last Registered Booking</span>
                  <span className="text-sm font-bold text-gray-900 font-mono tracking-tight">{formatDate(selectedCustomer.lastBooking)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                onClick={() => setShowModal(false)}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CustomersPage;