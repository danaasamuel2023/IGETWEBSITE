'use client'
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import Head from 'next/head';
import AdminLayout from '@/components/adminWraper';
import * as XLSX from 'xlsx';
import { Phone, User, Search } from 'lucide-react';

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    status: '',
    bundleType: '',
    startDate: '',
    endDate: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [itemsPerPage] = useState(20);
  const [senderID, setSenderID] = useState('EL VENDER');
  
  // State for capacity exclusion
  const [excludedCapacities, setExcludedCapacities] = useState([]);
  const [showCapacityFilter, setShowCapacityFilter] = useState(false);
  const [availableCapacities, setAvailableCapacities] = useState([]);
  
  // New state for network exclusion
  const [excludedNetworks, setExcludedNetworks] = useState([]);
  const [showNetworkFilter, setShowNetworkFilter] = useState(false);
  const [availableNetworks, setAvailableNetworks] = useState([]);
  
  // New state for combined network-capacity exclusion
  const [excludedNetworkCapacities, setExcludedNetworkCapacities] = useState([]);
  const [showNetworkCapacityFilter, setShowNetworkCapacityFilter] = useState(false);
  const [availableNetworkCapacities, setAvailableNetworkCapacities] = useState([]);

  // Add state for paginated loading
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);

  // Helper function to extract network from bundle type
  const getNetworkFromBundleType = useCallback((bundleType) => {
    if (!bundleType) return 'Unknown';
    
    const networkMap = {
      'mtnup2u': 'MTN',
      'mtn-justforu': 'MTN',
      'AT-ishare': 'AirtelTigo',
      'Telecel-5959': 'Telecel',
      'AfA-registration': 'AfA'
    };
    
    return networkMap[bundleType] || 'Unknown';
  }, []);

  // Optimized fetch function with pagination
  const fetchOrders = useCallback(async (page = 1, limit = 100, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);
      
      const response = await axios.get(`https://iget.onrender.com/api/orders/all`, {
        params: {
          page,
          limit,
          ...filter // Include current filters in the request
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('igettoken')}`
        }
      });
      
      if (response.data && response.data.success) {
        const newOrders = response.data.data || [];
        
        if (append) {
          setOrders(prev => [...prev, ...newOrders]);
        } else {
          setOrders(newOrders);
        }
        
        setTotalOrders(response.data.total || newOrders.length);
        
        // Check if we've loaded all orders
        if (newOrders.length < limit) {
          setHasLoadedAll(true);
        }
        
        console.log(`Fetched ${newOrders.length} orders (page ${page})`);
      } else {
        if (!append) {
          setOrders([]);
          setFilteredOrders([]);
          setDisplayedOrders([]);
        }
        setError('Failed to fetch orders data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
      if (!append) {
        setOrders([]);
        setFilteredOrders([]);
        setDisplayedOrders([]);
      }
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [filter]);

  // Load more orders function
  const loadMoreOrders = useCallback(async () => {
    if (!hasLoadedAll && !loading) {
      const nextPage = Math.ceil(orders.length / 100) + 1;
      await fetchOrders(nextPage, 100, true);
    }
  }, [hasLoadedAll, loading, orders.length, fetchOrders]);

  // Initial load - fetch first batch
  useEffect(() => {
    if (isInitialLoad) {
      fetchOrders(1, 100, false);
    }
  }, [isInitialLoad, fetchOrders]);

  // Define the standard capacities
  const STANDARD_CAPACITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50, 100];
  
  // Memoized calculation of available options
  const { capacities, networks, networkCapacityCombos } = useMemo(() => {
    if (orders.length === 0) {
      return { capacities: [], networks: [], networkCapacityCombos: [] };
    }

    // Capacities
    const orderCapacities = new Set(orders.map(order => order.capacity).filter(cap => cap !== null && cap !== undefined));
    const capacities = STANDARD_CAPACITIES.filter(cap => orderCapacities.has(cap));
    
    // Networks
    const networksSet = new Set(orders.map(order => getNetworkFromBundleType(order.bundleType)));
    const networks = Array.from(networksSet)
      .filter(network => network !== 'Unknown')
      .sort();
    
    // Network-Capacity combinations
    const networkCapacityCombos = [];
    const existingCombos = new Set();
    
    orders.forEach(order => {
      const network = getNetworkFromBundleType(order.bundleType);
      if (network !== 'Unknown' && order.capacity !== null && order.capacity !== undefined) {
        existingCombos.add(`${network}-${order.capacity}`);
      }
    });
    
    networks.forEach(network => {
      STANDARD_CAPACITIES.forEach(capacity => {
        if (existingCombos.has(`${network}-${capacity}`)) {
          networkCapacityCombos.push({
            network,
            capacity,
            combo: `${network}-${capacity}GB`
          });
        }
      });
    });
    
    return { capacities, networks, networkCapacityCombos };
  }, [orders, getNetworkFromBundleType]);

  // Update state when memoized values change
  useEffect(() => {
    setAvailableCapacities(capacities);
    setAvailableNetworks(networks);
    setAvailableNetworkCapacities(networkCapacityCombos);
  }, [capacities, networks, networkCapacityCombos]);

  // Optimized filter function with debounce
  const applyFilters = useCallback(() => {
    console.log('Applying filters...');
    
    let result = [...orders];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      
      result = result.filter(order => {
        // Optimize search by checking most likely fields first
        const recipientCheck = order.recipientNumber?.toLowerCase().includes(query);
        if (recipientCheck) return true;
        
        const phoneCheck = order.phoneNumber?.toLowerCase().includes(query);
        if (phoneCheck) return true;
        
        const referenceCheck = order.orderReference?.toLowerCase().includes(query);
        if (referenceCheck) return true;
        
        // Check other fields only if needed
        const otherFields = [
          order._id,
          order.user?.username,
          order.user?.email,
          order.bundleType,
          order.status,
          order.capacity?.toString(),
          order.price?.toString()
        ];
        
        return otherFields.some(field => field?.toString().toLowerCase().includes(query));
      });
    }
    
    // Apply status filter
    if (filter.status) {
      result = result.filter(order => order.status === filter.status);
    }
    
    // Apply bundle type filter
    if (filter.bundleType) {
      result = result.filter(order => order.bundleType === filter.bundleType);
    }
    
    // Apply date filters with optimized date comparison
    if (filter.startDate) {
      const startTime = new Date(filter.startDate).setHours(0, 0, 0, 0);
      result = result.filter(order => new Date(order.createdAt).getTime() >= startTime);
    }
    
    if (filter.endDate) {
      const endTime = new Date(filter.endDate).setHours(23, 59, 59, 999);
      result = result.filter(order => new Date(order.createdAt).getTime() <= endTime);
    }
    
    // Apply exclusion filters
    if (excludedCapacities.length > 0) {
      const excludedSet = new Set(excludedCapacities);
      result = result.filter(order => !excludedSet.has(order.capacity));
    }
    
    if (excludedNetworks.length > 0) {
      const excludedSet = new Set(excludedNetworks);
      result = result.filter(order => {
        const network = getNetworkFromBundleType(order.bundleType);
        return !excludedSet.has(network);
      });
    }
    
    if (excludedNetworkCapacities.length > 0) {
      const excludedSet = new Set(excludedNetworkCapacities);
      result = result.filter(order => {
        const network = getNetworkFromBundleType(order.bundleType);
        const combo = `${network}-${order.capacity}GB`;
        return !excludedSet.has(combo);
      });
    }
    
    setFilteredOrders(result);
    const total = Math.ceil(result.length / itemsPerPage);
    setTotalPages(total > 0 ? total : 1);
    setCurrentPage(1);
    
    console.log(`Filtered: ${result.length} orders`);
  }, [orders, searchQuery, filter, excludedCapacities, excludedNetworks, excludedNetworkCapacities, itemsPerPage, getNetworkFromBundleType]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, applyFilters]);

  // Apply filters when other dependencies change
  useEffect(() => {
    applyFilters();
  }, [filter, orders, excludedCapacities, excludedNetworks, excludedNetworkCapacities, applyFilters]);

  // Update displayed orders based on pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedResult = filteredOrders.slice(startIndex, startIndex + itemsPerPage);
    setDisplayedOrders(paginatedResult);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Handlers
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearFilters = () => {
    setFilter({
      status: '',
      bundleType: '',
      startDate: '',
      endDate: ''
    });
    setExcludedCapacities([]);
    setExcludedNetworks([]);
    setExcludedNetworkCapacities([]);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setError(null);
      
      const response = await axios.put(`https://iget.onrender.com/api/orders/${orderId}/status`, {
        status: newStatus,
        senderID: senderID
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('igettoken')}`
        }
      });
      
      if (response.data && response.data.success) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
      } else {
        setError('Failed to update order status');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
      console.error('Error updating order status:', err);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (!newStatus || selectedOrders.length === 0) {
      setError('Please select at least one order and a status to update');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Process in batches of 10 to avoid overwhelming the server
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < selectedOrders.length; i += batchSize) {
        batches.push(selectedOrders.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        const updatePromises = batch.map(orderId => 
          axios.put(`https://iget.onrender.com/api/orders/${orderId}/status`, {
            status: newStatus,
            senderID: senderID
          }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('igettoken')}`
            }
          })
        );
        
        await Promise.all(updatePromises);
      }
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          selectedOrders.includes(order._id) ? { ...order, status: newStatus } : order
        )
      );
      
      setSelectedOrders([]);
      setBulkStatus('');
    } catch (err) {
      setError('Failed to update multiple orders');
      console.error('Error updating multiple orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === displayedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(displayedOrders.map(order => order._id));
    }
  };

  const handleSelectAllFiltered = () => {
    const ordersToSelect = filteredOrders
      .filter(order => {
        if (excludedCapacities.includes(order.capacity)) return false;
        const network = getNetworkFromBundleType(order.bundleType);
        if (excludedNetworks.includes(network)) return false;
        const combo = `${network}-${order.capacity}GB`;
        if (excludedNetworkCapacities.includes(combo)) return false;
        return true;
      })
      .map(order => order._id);
    
    if (selectedOrders.length === ordersToSelect.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(ordersToSelect);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    // Refetch from server with filters
    fetchOrders(1, 100, false);
  };

  const resetAll = () => {
    setFilter({
      status: '',
      bundleType: '',
      startDate: '',
      endDate: ''
    });
    setSearchQuery('');
    setExcludedCapacities([]);
    setExcludedNetworks([]);
    setExcludedNetworkCapacities([]);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  const toggleCapacityExclusion = (capacity) => {
    setExcludedCapacities(prev => {
      if (prev.includes(capacity)) {
        return prev.filter(c => c !== capacity);
      } else {
        return [...prev, capacity];
      }
    });
  };

  const toggleNetworkExclusion = (network) => {
    setExcludedNetworks(prev => {
      if (prev.includes(network)) {
        return prev.filter(n => n !== network);
      } else {
        return [...prev, network];
      }
    });
  };

  const toggleNetworkCapacityExclusion = (combo) => {
    setExcludedNetworkCapacities(prev => {
      if (prev.includes(combo)) {
        return prev.filter(c => c !== combo);
      } else {
        return [...prev, combo];
      }
    });
  };

  const exportToExcel = async () => {
    try {
      // Show loading indicator for export
      setLoading(true);
      
      const ordersToExport = selectedOrders.length > 0 
        ? orders.filter(order => selectedOrders.includes(order._id))
        : filteredOrders;
      
      // Process in chunks to avoid blocking UI
      const chunkSize = 1000;
      const excelData = [];
      
      for (let i = 0; i < ordersToExport.length; i += chunkSize) {
        const chunk = ordersToExport.slice(i, i + chunkSize);
        const chunkData = chunk.map(order => ({
          'Recipient Number': order.recipientNumber || order.phoneNumber || 'N/A', 
          'Capacity (GB)': order.capacity ? (order.capacity).toFixed(1) : 0,
          'Network': getNetworkFromBundleType(order.bundleType),
          'Bundle Type': order.bundleType || 'N/A'
        }));
        excelData.push(...chunkData);
      }
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      
      const maxWidth = excelData.reduce((w, r) => Math.max(w, r['Recipient Number'].length), 10);
      const wscols = [
        { wch: maxWidth },
        { wch: 12 },
        { wch: 15 },
        { wch: 20 }
      ];
      worksheet['!cols'] = wscols;
      
      const filename = selectedOrders.length > 0 
        ? `Selected_Orders_Export_${new Date().toISOString().slice(0,10)}.xlsx` 
        : `Orders_Export_${new Date().toISOString().slice(0,10)}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      setError('Failed to export orders to Excel');
      console.error('Error exporting orders:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Orders Management | Admin Dashboard</title>
      </Head>
      
      <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-white dark:bg-gray-900">
        {/* Header with Sender ID input */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 sm:mb-0 text-gray-900 dark:text-white">Order Management</h1>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center space-x-2">
              <label htmlFor="senderID" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                SMS Sender ID:
              </label>
              <input
                type="text"
                id="senderID"
                value={senderID}
                onChange={(e) => setSenderID(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md p-2 text-sm"
                placeholder="Sender ID"
                maxLength="11"
              />
            </div>
            
            {selectedOrders.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedOrders.length} orders selected:
                </span>
                <select
                  className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md p-2"
                  value={bulkStatus}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusChange(e.target.value);
                    } else {
                      setBulkStatus(e.target.value);
                    }
                  }}
                >
                  <option value="">Bulk Update Status</option>
                  <option value="pending">Set All to Pending</option>
                  <option value="processing">Set All to Processing</option>
                  <option value="completed">Set All to Completed</option>
                  <option value="failed">Set All to Failed</option>
                  <option value="refunded">Set All to Refunded</option>
                </select>
                <button
                  onClick={handleSelectAllFiltered}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {selectedOrders.length === filteredOrders.filter(order => {
                    if (excludedCapacities.includes(order.capacity)) return false;
                    const network = getNetworkFromBundleType(order.bundleType);
                    if (excludedNetworks.includes(network)) return false;
                    const combo = `${network}-${order.capacity}GB`;
                    if (excludedNetworkCapacities.includes(combo)) return false;
                    return true;
                  }).length 
                    ? "Deselect All Filtered" 
                    : "Select All Filtered Orders"}
                </button>
              </div>
            ) : null}
            <button
              onClick={exportToExcel}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {selectedOrders.length > 0 
                ? `Export Selected (${selectedOrders.length})` 
                : `Export All Filtered (${filteredOrders.length})`}
            </button>
          </div>
        </div>

        {/* Load More Button for fetching additional orders */}
        {!hasLoadedAll && orders.length > 0 && orders.length < totalOrders && (
          <div className="mb-4 text-center">
            <button
              onClick={loadMoreOrders}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Loading...' : `Load More Orders (${orders.length} of ${totalOrders})`}
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by ID, username, email, phone, recipient number, or order reference..."
              className="pl-10 pr-10 py-2 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button 
                  onClick={clearSearch}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Searching across {orders.length} loaded orders...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Tip: Try searching with different formats (e.g., with/without country code: 0241234567 or 233241234567)
              </p>
            </div>
          )}
        </div>

        {/* Filter Form with Exclusion Buttons */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Status</label>
              <select
                id="status"
                name="status"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filter.status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="bundleType" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Bundle Type</label>
              <select
                id="bundleType"
                name="bundleType"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filter.bundleType}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="mtnup2u">MTN Up2U</option>
                <option value="mtn-justforu">MTN JustForU</option>
                <option value="AT-ishare">AT iShare</option>
                <option value="Telecel-5959">Telecel 5959</option>
                <option value="AfA-registration">AfA Registration</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filter.startDate}
                onChange={handleFilterChange}
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-200">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filter.endDate}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-4 flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex justify-center py-2 px-4 border border-red-300 dark:border-red-600 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900 hover:bg-red-100 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reset All (Search & Filters)
              </button>
              <button
                type="button"
                onClick={() => setShowCapacityFilter(!showCapacityFilter)}
                className="inline-flex justify-center py-2 px-4 border border-blue-300 dark:border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {showCapacityFilter ? 'Hide' : 'Show'} Capacity Filter ({excludedCapacities.length} excluded)
              </button>
              <button
                type="button"
                onClick={() => setShowNetworkFilter(!showNetworkFilter)}
                className="inline-flex justify-center py-2 px-4 border border-purple-300 dark:border-purple-600 shadow-sm text-sm font-medium rounded-md text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900 hover:bg-purple-100 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {showNetworkFilter ? 'Hide' : 'Show'} Network Filter ({excludedNetworks.length} excluded)
              </button>
              <button
                type="button"
                onClick={() => setShowNetworkCapacityFilter(!showNetworkCapacityFilter)}
                className="inline-flex justify-center py-2 px-4 border border-orange-300 dark:border-orange-600 shadow-sm text-sm font-medium rounded-md text-orange-700 dark:text-orange-200 bg-orange-50 dark:bg-orange-900 hover:bg-orange-100 dark:hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                {showNetworkCapacityFilter ? 'Hide' : 'Show'} Network+Capacity Filter ({excludedNetworkCapacities.length} excluded)
              </button>
            </div>
          </form>
          
          {/* Capacity Exclusion Filter */}
          {showCapacityFilter && availableCapacities.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                Exclude Capacities from Selection:
              </h4>
              <div className="grid grid-cols-10 gap-2">
                {availableCapacities.map(capacity => (
                  <button
                    key={capacity}
                    onClick={() => toggleCapacityExclusion(capacity)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors text-center ${
                      excludedCapacities.includes(capacity)
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                    }`}
                  >
                    {capacity}GB
                  </button>
                ))}
              </div>
              {excludedCapacities.length > 0 && (
                <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/40 rounded">
                  <p className="text-xs font-medium text-red-800 dark:text-red-200">
                    Excluded capacities ({excludedCapacities.length}): {excludedCapacities.sort((a, b) => a - b).join(', ')} GB
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Network Exclusion Filter */}
          {showNetworkFilter && availableNetworks.length > 0 && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Exclude Networks from Selection:
              </h4>
              <div className="flex flex-wrap gap-2">
                {availableNetworks.map(network => (
                  <button
                    key={network}
                    onClick={() => toggleNetworkExclusion(network)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      excludedNetworks.includes(network)
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                    }`}
                  >
                    {network} {excludedNetworks.includes(network) && '✕'}
                  </button>
                ))}
              </div>
              {excludedNetworks.length > 0 && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Orders from {excludedNetworks.join(', ')} will be excluded from bulk selection
                </p>
              )}
            </div>
          )}
          
          {/* Network-Capacity Combination Exclusion Filter */}
          {showNetworkCapacityFilter && availableNetworkCapacities.length > 0 && (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                Exclude Specific Network-Capacity Combinations:
              </h4>
              <div className="space-y-3">
                {['MTN', 'AirtelTigo', 'Telecel', 'AfA'].map(network => {
                  const networkCombos = availableNetworkCapacities.filter(item => item.network === network);
                  if (networkCombos.length === 0) return null;
                  
                  return (
                    <div key={network} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {network} Capacities:
                      </p>
                      <div className="grid grid-cols-10 gap-1.5">
                        {networkCombos.sort((a, b) => a.capacity - b.capacity).map(item => (
                          <button
                            key={item.combo}
                            onClick={() => toggleNetworkCapacityExclusion(item.combo)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors text-center ${
                              excludedNetworkCapacities.includes(item.combo)
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                            }`}
                          >
                            {item.capacity}GB
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {excludedNetworkCapacities.length > 0 && (
                <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/40 rounded">
                  <p className="text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">
                    Excluded Combinations ({excludedNetworkCapacities.length}):
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    {excludedNetworkCapacities.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data Stats */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-4">
          <div>Total Orders: <span className="font-semibold">{totalOrders || orders.length}</span></div>
          <div>Loaded Orders: <span className="font-semibold">{orders.length}</span></div>
          <div>Filtered Orders: <span className="font-semibold">{filteredOrders.length}</span></div>
          <div>Current Page: <span className="font-semibold">{currentPage} of {totalPages}</span></div>
          <div>Displayed Orders: <span className="font-semibold">{displayedOrders.length}</span></div>
          <div>SMS Sender ID: <span className="font-semibold">{senderID}</span></div>
          {excludedCapacities.length > 0 && (
            <div>Excluded Capacities: <span className="font-semibold">{excludedCapacities.join(', ')} GB</span></div>
          )}
          {excludedNetworks.length > 0 && (
            <div>Excluded Networks: <span className="font-semibold">{excludedNetworks.join(', ')}</span></div>
          )}
          {excludedNetworkCapacities.length > 0 && (
            <div>Excluded Combos: <span className="font-semibold">{excludedNetworkCapacities.length} items</span></div>
          )}
          {searchQuery && (
            <div className="text-blue-600 dark:text-blue-400 font-semibold">
              Search Results: {filteredOrders.length} matching "{searchQuery}"
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-100 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        {loading && isInitialLoad ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                          onChange={handleSelectAll}
                          checked={displayedOrders.length > 0 && selectedOrders.length === displayedOrders.length}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Network</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bundle Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recipient</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Capacity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {displayedOrders.length > 0 ? (
                    displayedOrders.map((order) => (
                      <tr key={order._id} className={selectedOrders.includes(order._id) ? "bg-indigo-50 dark:bg-indigo-900" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                              onChange={() => handleOrderSelect(order._id)}
                              checked={selectedOrders.includes(order._id)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {order.orderReference || order._id.substring(0, 8) + '...'}
                        </td>
                        
                        {/* Special display for AfA-registration bundle type */}
                        {order.bundleType === 'AfA-registration' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <User className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {order.metadata?.fullName || order.user?.username || 'N/A'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700">
                                {getNetworkFromBundleType(order.bundleType)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {order.bundleType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {order.phoneNumber || order.recipientNumber || order.user?.phone || 'N/A'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              -
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">{order.user?.username || 'N/A'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{order.user?.email || 'N/A'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{order.user?.phone || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                getNetworkFromBundleType(order.bundleType) === 'MTN' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                                getNetworkFromBundleType(order.bundleType) === 'AirtelTigo' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                                getNetworkFromBundleType(order.bundleType) === 'Telecel' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                              }`}>
                                {getNetworkFromBundleType(order.bundleType)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {order.bundleType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {order.recipientNumber || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {order.capacity ? order.capacity : 'N/A'} GB
                            </td>
                          </>
                        )}
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ₵{order.price?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-2">
                            <select 
                              className="text-sm text-indigo-600 dark:text-indigo-400 bg-transparent border border-indigo-300 dark:border-indigo-700 rounded-md p-1"
                              value={order.status || ''}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            >
                              <option value="" disabled>Change Status</option>
                              <option value="pending" className="bg-white dark:bg-gray-700">Pending</option>
                              <option value="processing" className="bg-white dark:bg-gray-700">Processing</option>
                              <option value="completed" className="bg-white dark:bg-gray-700">Completed</option>
                              <option value="failed" className="bg-white dark:bg-gray-700">Failed</option>
                              <option value="refunded" className="bg-white dark:bg-gray-700">Refunded</option>
                            </select>
                            <span className="text-xs text-gray-500 dark:text-gray-400">SMS: {senderID}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery || Object.values(filter).some(v => v !== '') || excludedCapacities.length > 0 || excludedNetworks.length > 0 || excludedNetworkCapacities.length > 0
                          ? "No orders found matching your search/filters" 
                          : "No orders found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredOrders.length > 0 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex flex-wrap items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-4 rounded-lg shadow">
            <div className="flex-1 flex flex-wrap justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
                  </span> of{' '}
                  <span className="font-medium">{filteredOrders.length}</span> orders
                  {(excludedCapacities.length > 0 || excludedNetworks.length > 0 || excludedNetworkCapacities.length > 0) && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      (with exclusions applied)
                    </span>
                  )}
                  {searchQuery && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                      (from search results)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {[...Array(totalPages).keys()].map((number) => {
                    const pageNumber = number + 1;
                    
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= Math.max(1, currentPage - 2) && 
                       pageNumber <= Math.min(totalPages, currentPage + 2))
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            currentPage === pageNumber
                              ? 'z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 text-indigo-600 dark:text-indigo-200'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          } text-sm font-medium`}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                    
                    if ((pageNumber === 2 && currentPage > 4) ||
                        (pageNumber === totalPages - 1 && currentPage < totalPages - 3)) {
                      return (
                        <span 
                          key={`ellipsis-${pageNumber}`} 
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          ...
                        </span>
                      );
                    }
                    
                    return null;
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}