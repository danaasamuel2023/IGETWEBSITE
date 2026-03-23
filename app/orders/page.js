'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, AlertCircle, RefreshCw, Search, X } from 'lucide-react';

export default function UserOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchPhone, setSearchPhone] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    if (!searchPhone.trim()) {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(o =>
        o.recipientNumber?.toLowerCase().includes(searchPhone.toLowerCase()) ||
        o.orderReference?.toLowerCase().includes(searchPhone.toLowerCase())
      ));
    }
  }, [searchPhone, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('igettoken');
      if (!token) throw new Error('Please sign in to view orders');
      const response = await fetch('https://iget.onrender.com/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to fetch orders');
      setOrders(result.data || []);
      setFilteredOrders(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtDateFull = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusStyle = (status) => {
    const s = status?.toLowerCase();
    const styles = {
      completed: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      delivered: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      processing: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      failed: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      cancelled: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[s] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  };

  const getBundleIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('mtn')) return { bg: 'bg-yellow-400', label: 'MTN', text: 'text-black' };
    if (t.includes('at') || t.includes('ishare')) return { bg: 'bg-[#0066B3]', label: 'AT', text: 'text-white' };
    if (t.includes('telecel')) return { bg: 'bg-red-500', label: 'TC', text: 'text-white' };
    if (t.includes('afa')) return { bg: 'bg-green-500', label: 'AF', text: 'text-white' };
    return { bg: 'bg-gray-500', label: '??', text: 'text-white' };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Package className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">My Orders</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {orders.length} total order{orders.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by phone or reference..."
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
          />
          {searchPhone && (
            <button onClick={() => setSearchPhone('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-500"></div>
              <p className="text-sm text-gray-400">Loading orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty state */
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 py-14 text-center">
            <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            {searchPhone ? (
              <>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No matching orders</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">No orders found for "{searchPhone}"</p>
                <button onClick={() => setSearchPhone('')} className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No orders yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Your purchase history will appear here.</p>
                <button onClick={() => router.push('/mtn')} className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Browse bundles
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-2.5">Bundle</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-2.5">Recipient</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-2.5">Amount</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-2.5">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-2.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {filteredOrders.map((order) => {
                      const icon = getBundleIcon(order.bundleType);
                      return (
                        <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg ${icon.bg} flex items-center justify-center shrink-0`}>
                                <span className={`text-[10px] font-bold ${icon.text}`}>{icon.label}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.capacity} GB</p>
                                <p className="text-[10px] text-gray-400 font-mono">{order.orderReference}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{order.recipientNumber || '-'}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">GH₵ {parseFloat(order.price || 0).toFixed(2)}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusStyle(order.status)}`}>
                              {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs text-gray-400 dark:text-gray-500">{fmtDateFull(order.createdAt)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {searchPhone
                    ? `${filteredOrders.length} of ${orders.length} orders`
                    : `${orders.length} order${orders.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-2.5">
              {filteredOrders.map((order) => {
                const icon = getBundleIcon(order.bundleType);
                return (
                  <div key={order._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg ${icon.bg} flex items-center justify-center shrink-0`}>
                          <span className={`text-xs font-bold ${icon.text}`}>{icon.label}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.capacity} GB</p>
                          <p className="text-[10px] text-gray-400 font-mono">{order.orderReference}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${statusStyle(order.status)}`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">To</p>
                          <p className="font-mono text-gray-700 dark:text-gray-300 text-xs">{order.recipientNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">Amount</p>
                          <p className="font-medium text-gray-900 dark:text-white text-xs">GH₵ {parseFloat(order.price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{fmtDate(order.createdAt)}</p>
                    </div>
                  </div>
                );
              })}

              <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2">
                {searchPhone
                  ? `${filteredOrders.length} of ${orders.length} orders`
                  : `${orders.length} order${orders.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
