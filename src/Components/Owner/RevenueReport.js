import React, { useEffect, useState } from 'react';
import axiosInstance from '../../Api/axios';
import {
  ChartBarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const RevenueReport = ({ salonId }) => {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const periods = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'Last 7 Days' },
    { value: 'monthly', label: 'This Month' },
    { value: 'annual', label: 'This Year' }
  ];

  useEffect(() => {
    if (!salonId) return;
    fetchRevenueData();
  }, [salonId, selectedPeriod]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all appointments for the salon - this endpoint IS available on live server
      const response = await axiosInstance.get(`/appointments/salon/${salonId}`);
      const allAppointments = response.data || [];

      // Filter appointments based on selected period
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();

      switch (selectedPeriod) {
        case 'daily':
          // Today (starting from 00:00:00)
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'weekly':
          // Last 7 days
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          // Current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case 'annual':
          // Current year
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear() + 1, 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      }

      // We need to compare dates carefully as strings or Date objects
      const filteredAppointments = allAppointments.filter(appt => {
        if (!appt.date) return false;
        // The appt.date is usually in "YYYY-MM-DD" format from backend
        // We handle potential variations in date format
        try {
          const [year, month, day] = appt.date.split('-').map(Number);
          const apptDate = new Date(year, month - 1, day);
          return apptDate >= startDate && apptDate < endDate;
        } catch (e) {
          return false;
        }
      });

      let totalRevenueValue = 0;
      let completedRevenueValue = 0;
      let pendingRevenueValue = 0;
      const periodMap = new Map();
      const serviceMap = new Map();

      filteredAppointments.forEach(appt => {
        // Calculate total price of services in this appointment
        const apptPrice = (appt.services || []).reduce((sum, s) => {
          const price = typeof s === 'number' ? s : (Number(s.price) || 0);
          return sum + price;
        }, 0);

        totalRevenueValue += apptPrice;
        if (appt.status === 'completed') {
          completedRevenueValue += apptPrice;
        } else if (appt.status === 'pending' || appt.status === 'confirmed') {
          pendingRevenueValue += apptPrice;
        }

        // Group by period for the chart
        let periodKey = '';
        if (selectedPeriod === 'daily') {
          const timePrefix = appt.time ? appt.time.split(':')[0].padStart(2, '0') : '00';
          periodKey = `${appt.date} ${timePrefix}:00`;
        } else if (selectedPeriod === 'weekly' || selectedPeriod === 'monthly') {
          periodKey = appt.date;
        } else if (selectedPeriod === 'annual') {
          const dateParts = appt.date.split('-');
          periodKey = `${dateParts[0]}-${dateParts[1]}`;
        }

        if (periodKey) {
          if (!periodMap.has(periodKey)) {
            periodMap.set(periodKey, { period: periodKey, revenue: 0, appointments: 0 });
          }
          const pData = periodMap.get(periodKey);
          pData.revenue += apptPrice;
          pData.appointments += 1;
        }

        // Group by top services
        (appt.services || []).forEach(s => {
          const sName = typeof s === 'string' ? s : (s.name || 'Unknown');
          const sPrice = typeof s === 'number' ? s : (Number(s.price) || 0);

          if (!serviceMap.has(sName)) {
            serviceMap.set(sName, { serviceName: sName, revenue: 0, count: 0 });
          }
          const sData = serviceMap.get(sName);
          sData.revenue += sPrice;
          sData.count += 1;
        });
      });

      const revenueByPeriod = Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period));
      const topServices = Array.from(serviceMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setRevenueData({
        period: selectedPeriod,
        totalRevenue: totalRevenueValue,
        completedRevenue: completedRevenueValue,
        pendingRevenue: pendingRevenueValue,
        totalAppointments: filteredAppointments.length,
        revenueByPeriod,
        topServices
      });

    } catch (err) {
      console.error('Error computing revenue data:', err);
      setError('Failed to compute revenue data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `LKR ${amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
  };

  const formatPeriodLabel = (periodStr) => {
    if (!periodStr) return '';

    if (selectedPeriod === 'daily') {
      // Format hourly data (e.g., "2024-02-11 14:00" -> "2 PM")
      const hour = parseInt(periodStr.split(' ')[1]?.split(':')[0]);
      return hour >= 12 ? `${hour === 12 ? 12 : hour - 12} PM` : `${hour === 0 ? 12 : hour} AM`;
    } else if (selectedPeriod === 'weekly' || selectedPeriod === 'monthly') {
      // Format daily data (e.g., "2024-02-11" -> "Feb 11")
      const date = new Date(periodStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (selectedPeriod === 'annual') {
      // Format monthly data (e.g., "2024-02" -> "Feb 2024")
      const [year, month] = periodStr.split('-');
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return periodStr;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8 w-full animate-pulse">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
          <ChartBarIcon className="w-6 h-6 text-gray-300" />
          <div className="h-6 w-48 bg-gray-200 rounded"></div>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8 w-full">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
          <ChartBarIcon className="w-6 h-6 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-800 tracking-tight">Revenue Report</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ExclamationCircleIcon className="w-12 h-12 text-red-500 mb-3" />
          <p className="text-gray-700 font-medium mb-4">{error}</p>
          <button
            onClick={fetchRevenueData}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2.5 rounded-xl font-bold transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 w-full overflow-hidden">
      {/* Header with Period Selector */}
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
        <div className="flex flex-col">
          <h3 className="text-xl font-black text-dark-900 tracking-tight flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-primary-600" /> Revenue Report
          </h3>
          <p className="text-sm text-gray-500 font-medium mt-1">Track your earnings and bookings.</p>
        </div>

        <div className="flex flex-wrap items-center bg-gray-100 p-1.5 rounded-2xl sm:w-auto overflow-x-auto gap-1">
          {periods.map((period) => (
            <button
              key={period.value}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${selectedPeriod === period.value
                ? 'bg-white text-dark-900 shadow-sm ring-1 ring-gray-200 block sm:inline-block'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 bg-transparent'
                }`}
              onClick={() => setSelectedPeriod(period.value)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-primary-50/50 border border-primary-100 rounded-[1.5rem] p-6 relative overflow-hidden group hover:border-primary-300 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-50 text-primary-200 group-hover:scale-110 transition-transform duration-300">
              <BanknotesIcon className="w-16 h-16 -mr-4 -mt-4" />
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-600 mb-4 border border-primary-100">
                <BanknotesIcon className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-primary-600/80 uppercase tracking-widest mb-1">Total Revenue</p>
              <h4 className="text-3xl font-black text-primary-900 tracking-tight">{formatCurrency(revenueData?.totalRevenue)}</h4>
              <p className="text-sm text-primary-700/80 font-medium mt-2">
                {revenueData?.totalAppointments || 0} appointments
              </p>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-[1.5rem] p-6 relative overflow-hidden group hover:border-emerald-300 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-50 text-emerald-200 group-hover:scale-110 transition-transform duration-300">
              <CheckCircleIcon className="w-16 h-16 -mr-4 -mt-4" />
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-emerald-600/80 uppercase tracking-widest mb-1">Completed</p>
              <h4 className="text-3xl font-black text-emerald-900 tracking-tight">{formatCurrency(revenueData?.completedRevenue)}</h4>
              <p className="text-sm text-emerald-700/80 font-medium mt-2">Confirmed payments</p>
            </div>
          </div>

          <div className="bg-orange-50/50 border border-orange-100 rounded-[1.5rem] p-6 relative overflow-hidden group hover:border-orange-300 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-50 text-orange-200 group-hover:scale-110 transition-transform duration-300">
              <ClockIcon className="w-16 h-16 -mr-4 -mt-4" />
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-600 mb-4 border border-orange-100">
                <ClockIcon className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-orange-600/80 uppercase tracking-widest mb-1">Pending</p>
              <h4 className="text-3xl font-black text-orange-900 tracking-tight">{formatCurrency(revenueData?.pendingRevenue)}</h4>
              <p className="text-sm text-orange-700/80 font-medium mt-2">Awaiting completion</p>
            </div>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Revenue Timeline Chart */}
          <div className="lg:col-span-2">
            <h4 className="text-lg font-bold text-dark-900 flex items-center gap-2 mb-6">
              <ChartBarIcon className="w-5 h-5 text-gray-400" /> Revenue Breakdown
            </h4>

            {revenueData?.revenueByPeriod && revenueData.revenueByPeriod.length > 0 ? (
              <div className="h-64 flex items-end gap-2 md:gap-4 overflow-x-auto pb-6 relative group pt-8">
                {/* Y-axis guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 z-0">
                  <div className="w-full h-px bg-gray-100"></div>
                  <div className="w-full h-px bg-gray-100"></div>
                  <div className="w-full h-px bg-gray-100"></div>
                  <div className="w-full h-px border-b border-gray-200"></div>
                </div>

                {revenueData.revenueByPeriod.map((item, index) => {
                  const maxRevenue = Math.max(...revenueData.revenueByPeriod.map(i => i.revenue));
                  const barHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

                  return (
                    <div key={index} className="relative flex flex-col items-center flex-1 min-w-[32px] group/item z-10 h-full justify-end group">
                      {/* Tooltip */}
                      <div className="absolute bottom-[calc(100%+0.5rem)] opacity-0 group-hover/item:opacity-100 transition-opacity bg-dark-900 text-white text-xs py-1.5 px-3 rounded-lg whitespace-nowrap pointer-events-none shadow-lg z-50 transform -translate-y-2 group-hover/item:translate-y-0">
                        <div className="font-bold">{formatCurrency(item.revenue)}</div>
                        <div className="text-gray-400">{item.appointments} appts</div>
                        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-dark-900 rotate-45"></div>
                      </div>

                      <div className="w-full bg-gray-100 rounded-t-md h-full relative overflow-hidden flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-md transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative group-hover/item:from-primary-500 group-hover/item:to-primary-300"
                          style={{ height: `${Math.max(barHeight, 5)}%` }}
                        ></div>
                      </div>

                      <span className="text-[10px] sm:text-xs text-gray-500 font-medium mt-3 whitespace-nowrap block absolute top-full left-1/2 -translate-x-1/2">
                        {formatPeriodLabel(item.period)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                <ChartBarIcon className="w-10 h-10 mb-2 opacity-50" />
                <p className="font-medium text-sm">No data available</p>
              </div>
            )}
          </div>

          {/* Top Services */}
          <div className="lg:border-l lg:border-gray-100 lg:pl-8">
            <h4 className="text-lg font-bold text-dark-900 flex items-center gap-2 mb-6">
              <StarIcon className="w-5 h-5 text-amber-500" /> Top Services
            </h4>

            {revenueData?.topServices && revenueData.topServices.length > 0 ? (
              <div className="space-y-4">
                {revenueData.topServices.slice(0, 5).map((service, index) => (
                  <div key={index} className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100 hover:bg-white hover:border-gray-200 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 font-bold text-xs text-gray-500 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-200 transition-colors shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-dark-900 text-sm truncate pr-2">{service.serviceName}</h5>
                      <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1">
                        {service.count} {service.count === 1 ? 'booking' : 'bookings'}
                      </span>
                    </div>
                    <div className="font-bold text-primary-600 text-sm whitespace-nowrap shrink-0 pr-1">
                      {formatCurrency(service.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                <StarIcon className="w-10 h-10 mb-2 opacity-50" />
                <p className="font-medium text-sm">No services booked</p>
              </div>
            )}
          </div>

        </div>

        {/* Empty State */}
        {(!revenueData?.revenueByPeriod || revenueData.revenueByPeriod.length === 0) && (
          <div className="bg-gray-50 rounded-[1.5rem] border-2 border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center mt-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm mb-4">
              <ChartBarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-bold text-dark-900 mb-1">No Revenue Data</h4>
            <p className="text-gray-500 font-medium">No completed appointments found for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueReport;
