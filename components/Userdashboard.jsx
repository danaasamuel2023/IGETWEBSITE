// pages/dashboard/today.js
'use client'
import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ShoppingBag, Wallet, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TodayStats() {
  const [stats, setStats] = useState({
    ordersToday: 0,
    totalOrderAmount: 0,
    walletRevenue: 0,
    transactionsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTodayStats = async () => {
      try {
        setLoading(true);
        
        // Get token from local storage
        const token = localStorage.getItem('igettoken');
        
        if (!token) {
          setError('Authentication token not found');
          router.push('/login');
          return;
        }
        
        const response = await fetch('http://localhost:5000/api/today/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch today\'s stats');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setStats(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch today\'s stats');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching today\'s stats:', err);
        
        // If token is invalid or expired, redirect to login
        if (err.message === 'Invalid authentication token' || err.message === 'Authentication token expired') {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTodayStats();
    
    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(fetchTodayStats, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [router]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading today's stats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Today's Activity</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orders Today Card */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-700">Orders Today</h3>
            <ShoppingBag className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{stats.ordersToday}</div>
          <p className="text-xs text-gray-500">
            Total value: {formatCurrency(stats.totalOrderAmount)}
          </p>
        </div>
        
        {/* Total Order Amount Card */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-700">Total Order Amount</h3>
            <div className="h-4 w-4 text-gray-500 font-bold">GHS</div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalOrderAmount)}</div>
          <p className="text-xs text-gray-500">
            From {stats.ordersToday} orders today
          </p>
        </div>
        
        {/* Wallet Revenue Card */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-700">Wallet Revenue</h3>
            <Wallet className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats.walletRevenue)}</div>
          <p className="text-xs text-gray-500 flex items-center">
            {stats.walletRevenue >= 0 ? (
              <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            From deposits and withdrawals
          </p>
        </div>
        
        {/* Transactions Card */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-700">Transactions</h3>
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{stats.transactionsCount}</div>
          <p className="text-xs text-gray-500">
            Wallet transactions today
          </p>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </button>
      </div>
    </div>
  );
}