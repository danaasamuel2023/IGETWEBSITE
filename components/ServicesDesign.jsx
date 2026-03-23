'use client'
import React, { useState, useEffect } from 'react';
import { CreditCard, Package, Database, DollarSign, Calendar, Clock, ArrowRight, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DashboardPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    currentBalance: 0,
    todayOrdersCount: 0,
    todayRevenue: 0,
    todayOrders: []
  });

  useEffect(() => {
    const authToken = localStorage.getItem('igettoken');
    if (!authToken) {
      router.push('/Signin');
      return;
    }
    fetchDashboardData(authToken);
  }, [router]);

  const fetchDashboardData = async (token) => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch('https://iget.onrender.com/api/dashboard/today', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      if (data.success) setDashboardData(data.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatCapacity = (capacity) => {
    if (capacity >= 1000) return (capacity / 1000).toFixed(1) + ' GB';
    return capacity + ' GB';
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalGbSold = (dashboardData.todayOrders || [])
    .reduce((total, order) => total + (order.capacity || 0), 0)
    .toFixed(1);

  const statusStyle = (status) => {
    const styles = {
      completed: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      failed: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      processing: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return styles[status] || styles.processing;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-500"></div>
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Balance',
      value: formatCurrency(dashboardData.currentBalance),
      icon: CreditCard,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Orders Today',
      value: dashboardData.todayOrdersCount,
      icon: Package,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      label: 'Data Sold',
      value: `${totalGbSold} GB`,
      icon: Database,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/20'
    },
    {
      label: 'Revenue',
      value: formatCurrency(dashboardData.todayRevenue),
      icon: DollarSign,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20'
    }
  ];

  const services = [
    { key: 'mtn', label: 'MTN', href: '/mtn', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { key: 'at-ishare', label: 'AirtelTigo', href: '/at-ishare', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { key: 'telecel', label: 'Telecel', href: '/telecel', bg: 'bg-red-50 dark:bg-red-900/20' },
    { key: 'afa', label: 'AfA Reg', href: '/AfA-registration', bg: 'bg-green-50 dark:bg-green-900/20' },
  ];

  const ServiceLogo = ({ type, size = 40 }) => {
    switch (type) {
      case 'mtn':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="#FFCC00"/><ellipse cx="50" cy="50" rx="38" ry="26" stroke="#000" strokeWidth="4" fill="none"/><text x="50" y="57" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="20" fontWeight="900" fill="#000">MTN</text></svg>
        );
      case 'at-ishare':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="#0066B3"/><circle cx="35" cy="40" r="6" fill="#FFF"/><circle cx="65" cy="40" r="6" fill="#FFF"/><path d="M30 55 Q50 75 70 55" stroke="#FFF" strokeWidth="6" fill="none" strokeLinecap="round"/></svg>
        );
      case 'telecel':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="#FFF"/><circle cx="50" cy="50" r="42" fill="#E30613"/><text x="50" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="50" fontWeight="600" fill="#FFF">t</text></svg>
        );
      default:
        return (
          <div className="rounded-lg bg-green-500 flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10.5V19a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h12.5"/><path d="M9 11l3 3L22 4"/></svg>
          </div>
        );
    }
  };

  const quickActions = [
    { label: 'Bulk Purchase', icon: Layers, href: '/bulk' },
    { label: 'Order History', icon: Clock, href: '/orders' },
    { label: 'Add Funds', icon: CreditCard, href: '/deposite' },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{today}</span>
              <span className="sm:hidden">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Today's Transactions</h2>
            <button
              onClick={() => router.push('/orders')}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-2.5">Recipient</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-2.5">Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-2.5 hidden sm:table-cell">Time</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-2.5">Package</th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-2.5">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-2.5">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {dashboardData.todayOrders && dashboardData.todayOrders.length > 0 ? (
                  dashboardData.todayOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-sm font-mono text-gray-900 dark:text-white">{order.recipientNumber}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{order.bundleType}</span>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-sm text-gray-400 dark:text-gray-500">{formatTime(order.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{formatCapacity(order.capacity)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusStyle(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(order.price)}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Package className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-400 dark:text-gray-500">No transactions today</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Place New Order */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-yellow-400 via-red-500 to-blue-600"></div>
          <div className="p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Place New Order</h2>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {services.map((svc) => (
                <button
                  key={svc.key}
                  onClick={() => router.push(svc.href)}
                  className={`flex flex-col items-center p-2.5 sm:p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all ${svc.bg}`}
                >
                  <ServiceLogo type={svc.key} size={36} />
                  <span className="font-medium text-gray-800 dark:text-gray-200 text-[10px] sm:text-xs mt-2">{svc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                <action.icon className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
