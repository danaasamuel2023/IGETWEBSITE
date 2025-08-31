'use client'

import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  RefreshCw, 
  Search, 
  AlertCircle, 
  X, 
  Edit2, 
  Save, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Package,
  PackageX,
  Info,
  Plus,
  Minus,
  TrendingDown,
  BarChart3,
  History,
  Settings
} from 'lucide-react';
import axios from 'axios';
import AdminLayout from '@/components/adminWraper';

const BundlePriceList = () => {
  const [bundleData, setBundleData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBundle, setEditingBundle] = useState(null);
  const [editPrices, setEditPrices] = useState({
    standard: '',
    admin: '',
    user: '',
    agent: '',
    Editor: ''
  });
  const [stockData, setStockData] = useState({
    available: '',
    lowThreshold: '',
    adjustment: '',
    adjustmentReason: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedBundle, setExpandedBundle] = useState(null);
  const [stockUpdateLoading, setStockUpdateLoading] = useState({});
  const [showStockHistory, setShowStockHistory] = useState(null);
  const [stockHistory, setStockHistory] = useState({});
  
  const bundleTypes = [
    'mtnup2u',
    'mtn-justforu',
    'AT-ishare',
    'Telecel-5959',
    'AfA-registration',
  ];

  const userRoles = [
    { id: 'admin', label: 'Admin' },
    { id: 'user', label: 'User' },
    { id: 'agent', label: 'Agent' },
    { id: 'editor', label: 'Editor' },
    { id: 'business', label: 'Business' },
    { id: 'dealers', label: 'Dealers' },
    { id: 'enterprise', label: 'Enterprise' }
];

  useEffect(() => {
    fetchAllBundles();
  }, []);

  const fetchAllBundles = async () => {
    setRefreshing(true);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('igettoken');
      const results = {};
      
      // Fetch all bundle types in parallel
      const requests = bundleTypes.map(type => 
        axios.get(`https://iget.onrender.com/api/iget/bundle/${type}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
          results[type] = response.data.data;
        })
        .catch(err => {
          console.error(`Error fetching ${type} bundles:`, err);
          results[type] = [];
        })
      );
      
      await Promise.all(requests);
      setBundleData(results);
    } catch (err) {
      setError('Failed to fetch bundle data. Please try again.');
      console.error('Bundle fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStockHistory = async (bundleId) => {
    try {
      const token = localStorage.getItem('igettoken');
      const response = await axios.get(
        `https://iget.onrender.com/api/iget/stock/${bundleId}/history`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setStockHistory(prev => ({
        ...prev,
        [bundleId]: response.data.data
      }));
      setShowStockHistory(bundleId);
    } catch (err) {
      setError('Failed to fetch stock history');
    }
  };

  const updateStock = async (bundleId, bundleType, action) => {
    setStockUpdateLoading(prev => ({ ...prev, [`${bundleId}_${action}`]: true }));
    
    try {
      const token = localStorage.getItem('igettoken');
      let endpoint = '';
      let requestBody = {};
      
      switch(action) {
        case 'restock':
          if (!stockData.adjustment || parseInt(stockData.adjustment) <= 0) {
            setError('Please enter a valid restock amount');
            return;
          }
          endpoint = `/api/iget/stock/${bundleId}/restock`;
          requestBody = {
            units: parseInt(stockData.adjustment),
            reason: stockData.adjustmentReason || 'Manual restock'
          };
          break;
          
        case 'adjust':
          if (!stockData.adjustment || parseInt(stockData.adjustment) === 0) {
            setError('Please enter a valid adjustment amount');
            return;
          }
          endpoint = `/api/iget/stock/${bundleId}/adjust`;
          requestBody = {
            adjustment: parseInt(stockData.adjustment),
            reason: stockData.adjustmentReason || 'Manual adjustment'
          };
          break;
          
        case 'set':
          if (!stockData.available || parseInt(stockData.available) < 0) {
            setError('Please enter a valid stock amount');
            return;
          }
          endpoint = `/api/iget/stock/${bundleId}/set`;
          requestBody = {
            units: parseInt(stockData.available),
            reason: stockData.adjustmentReason || 'Stock level set'
          };
          break;
          
        case 'threshold':
          if (!stockData.lowThreshold || parseInt(stockData.lowThreshold) < 0) {
            setError('Please enter a valid threshold');
            return;
          }
          endpoint = `/api/iget/stock/${bundleId}/low-threshold`;
          requestBody = {
            threshold: parseInt(stockData.lowThreshold)
          };
          break;
      }
      
      const response = await axios.put(
        `https://iget.onrender.com${endpoint}`,
        requestBody,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state with new stock data
      if (response.data.success) {
        setBundleData(prevData => {
          const updatedBundles = [...(prevData[bundleType] || [])];
          const bundleIndex = updatedBundles.findIndex(b => b._id === bundleId);
          
          if (bundleIndex !== -1 && response.data.data) {
            updatedBundles[bundleIndex] = {
              ...updatedBundles[bundleIndex],
              stockUnits: response.data.data.stockUnits || updatedBundles[bundleIndex].stockUnits,
              stockInfo: {
                ...updatedBundles[bundleIndex].stockInfo,
                available: response.data.data.newStock || response.data.data.currentStock?.available,
                isLowStock: response.data.data.isLowStock,
                stockPercentage: response.data.data.stockPercentage
              }
            };
          }
          
          return {
            ...prevData,
            [bundleType]: updatedBundles
          };
        });
        
        setSuccessMessage(response.data.message || 'Stock updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Clear adjustment fields after successful update
        setStockData(prev => ({
          ...prev,
          adjustment: '',
          adjustmentReason: ''
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} stock`);
    } finally {
      setStockUpdateLoading(prev => ({ ...prev, [`${bundleId}_${action}`]: false }));
    }
  };

  const toggleStock = async (bundleId, bundleType, currentStockStatus) => {
    setStockUpdateLoading(prev => ({ ...prev, [bundleId]: true }));
    
    try {
      const token = localStorage.getItem('igettoken');
      const endpoint = currentStockStatus 
        ? `/api/iget/stock/${bundleId}/out-of-stock`
        : `/api/iget/stock/${bundleId}/in-stock`;
      
      const requestBody = currentStockStatus 
        ? { reason: 'Marked out of stock by admin' }
        : {};
      
      const response = await axios.put(
        `https://iget.onrender.com${endpoint}`,
        requestBody,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setBundleData(prevData => {
        const updatedBundles = [...(prevData[bundleType] || [])];
        const bundleIndex = updatedBundles.findIndex(b => b._id === bundleId);
        
        if (bundleIndex !== -1) {
          updatedBundles[bundleIndex] = {
            ...updatedBundles[bundleIndex],
            isInStock: !currentStockStatus,
            stockInfo: response.data.data?.stockStatus || {
              isInStock: !currentStockStatus,
              isOutOfStock: currentStockStatus
            }
          };
        }
        
        return {
          ...prevData,
          [bundleType]: updatedBundles
        };
      });
      
      setSuccessMessage(`Bundle marked as ${currentStockStatus ? 'out of stock' : 'in stock'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock status');
    } finally {
      setStockUpdateLoading(prev => ({ ...prev, [bundleId]: false }));
    }
  };

  const filteredBundleTypes = searchTerm 
    ? bundleTypes.filter(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
    : bundleTypes;

  const filteredBundles = (type) => {
    const bundles = bundleData[type] || [];
    if (!searchTerm) return bundles;
    
    return bundles.filter(bundle => 
      (bundle.capacity.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bundle.price.toString().includes(searchTerm))
    );
  };

  const showAnyResults = filteredBundleTypes.some(type => filteredBundles(type).length > 0);
  
  const toggleBundleDetails = (bundleId) => {
    setExpandedBundle(expandedBundle === bundleId ? null : bundleId);
  };

  const startEditing = (bundle) => {
    setEditingBundle(bundle._id);
    
    // Initialize with current values
    setEditPrices({
      standard: bundle.price.toString(),
      admin: bundle.rolePricing?.admin?.toString() || bundle.price.toString(),
      user: bundle.rolePricing?.user?.toString() || bundle.price.toString(),
      agent: bundle.rolePricing?.agent?.toString() || bundle.price.toString(),
      Editor: bundle.rolePricing?.Editor?.toString() || bundle.price.toString()
    });
    
    // Initialize stock data
    setStockData({
      available: bundle.stockInfo?.available?.toString() || '0',
      lowThreshold: bundle.stockInfo?.lowStockThreshold?.toString() || '10',
      adjustment: '',
      adjustmentReason: ''
    });
  };
  
  const cancelEditing = () => {
    setEditingBundle(null);
    setEditPrices({
      standard: '',
      admin: '',
      user: '',
      agent: '',
      Editor: ''
    });
    setStockData({
      available: '',
      lowThreshold: '',
      adjustment: '',
      adjustmentReason: ''
    });
  };
  
  const handlePriceChange = (role, value) => {
    setEditPrices(prev => ({
      ...prev,
      [role]: value
    }));
  };
  
  const updateBundlePrice = async (bundleId, bundleType) => {
    // Validate prices
    for (const [role, price] of Object.entries(editPrices)) {
      if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        setError(`Invalid price for ${role === 'standard' ? 'standard price' : role} role`);
        return;
      }
    }
    
    setUpdateLoading(true);
    
    try {
      const token = localStorage.getItem('igettoken');
      
      // Format role pricing data for API
      const rolePricing = {
        admin: parseFloat(editPrices.admin),
        user: parseFloat(editPrices.user),
        agent: parseFloat(editPrices.agent),
        Editor: parseFloat(editPrices.Editor)
      };
      
      await axios.put(`https://iget.onrender.com/api/iget/${bundleId}`, {
        price: parseFloat(editPrices.standard),
        rolePricing
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state to reflect the change
      setBundleData(prevData => {
        const updatedBundles = [...prevData[bundleType]];
        const bundleIndex = updatedBundles.findIndex(b => b._id === bundleId);
        
        if (bundleIndex !== -1) {
          updatedBundles[bundleIndex] = {
            ...updatedBundles[bundleIndex],
            price: parseFloat(editPrices.standard),
            rolePricing
          };
        }
        
        return {
          ...prevData,
          [bundleType]: updatedBundles
        };
      });
      
      setSuccessMessage('Prices updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      cancelEditing();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update prices');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStockStatusBadge = (bundle) => {
    const available = bundle.stockInfo?.available || 0;
    const isLowStock = bundle.stockStatus?.isLowStock || bundle.stockInfo?.isLowStock;
    const percentage = bundle.stockPercentage || bundle.stockInfo?.stockPercentage || 0;
    
    if (available === 0) {
      return (
        <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-full">
          Out of Stock
        </span>
      );
    }
    if (percentage < 20) {
      return (
        <span className="px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 rounded-full">
          Critical ({available})
        </span>
      );
    }
    if (isLowStock) {
      return (
        <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full">
          Low Stock ({available})
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 dark:bg-green-900/20 dark:text-green-400 rounded-full">
        In Stock ({available})
      </span>
    );
  };

  if (loading && !refreshing) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bundle Prices & Stock Management</h1>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <input
                type="text"
                placeholder="Search bundles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
              )}
            </div>
            
            <button
              onClick={fetchAllBundles}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-grow">{error}</span>
            <button onClick={() => setError('')} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span className="flex-grow">{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!showAnyResults && !loading && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>
              {searchTerm 
                ? `No bundles found matching "${searchTerm}". Try a different search term.`
                : 'No bundles found. Try refreshing the page.'}
            </span>
          </div>
        )}

        <div className="space-y-6">
          {filteredBundleTypes.map((type) => {
            const bundles = filteredBundles(type);
            if (bundles.length === 0) return null;
            
            return (
              <div key={type} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{type}</h2>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {bundles.map((bundle) => {
                      return (
                        <div 
                          key={bundle._id}
                          className={`bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-2 ${
                            (bundle.stockInfo?.available || 0) > 0 
                              ? 'border-transparent' 
                              : 'border-red-300 dark:border-red-700'
                          }`}
                        >
                          {editingBundle === bundle._id ? (
                            // Editing mode
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {bundle.capacity} GB
                                </span>
                              </div>
                              
                              {/* Price editing section */}
                              <div className="space-y-2 border-b pb-3 dark:border-gray-600">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pricing</h4>
                                {/* Standard price edit */}
                                <div className="flex items-center">
                                  <span className="text-gray-700 dark:text-gray-300 mr-2 w-20 text-sm">Standard:</span>
                                  <div className="flex items-center flex-1">
                                    <span className="text-gray-700 dark:text-gray-300 mr-1 text-sm">GH¢</span>
                                    <input
                                      type="number"
                                      value={editPrices.standard}
                                      onChange={(e) => handlePriceChange('standard', e.target.value)}
                                      className="flex-grow p-1 border rounded w-full bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                                      step="0.01"
                                      min="0"
                                    />
                                  </div>
                                </div>
                                
                                {/* Role-based prices edit */}
                                {userRoles.map(role => (
                                  <div key={role.id} className="flex items-center">
                                    <span className="text-gray-700 dark:text-gray-300 mr-2 w-20 capitalize text-sm">
                                      {role.label}:
                                    </span>
                                    <div className="flex items-center flex-1">
                                      <span className="text-gray-700 dark:text-gray-300 mr-1 text-sm">GH¢</span>
                                      <input
                                        type="number"
                                        value={editPrices[role.id]}
                                        onChange={(e) => handlePriceChange(role.id, e.target.value)}
                                        className="flex-grow p-1 border rounded w-full bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                                        step="0.01"
                                        min="0"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Stock management section */}
                              <div className="space-y-2 border-b pb-3 dark:border-gray-600">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stock Management</h4>
                                
                                {/* Current stock display */}
                                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Current:</span>
                                      <span className="font-semibold ml-1">{bundle.stockInfo?.available || 0}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Reserved:</span>
                                      <span className="font-semibold ml-1">{bundle.stockInfo?.reserved || 0}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Sold:</span>
                                      <span className="font-semibold ml-1">{bundle.stockInfo?.sold || 0}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600 dark:text-gray-400">Threshold:</span>
                                      <span className="font-semibold ml-1">{bundle.stockInfo?.lowStockThreshold || 10}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Stock adjustment */}
                                <div className="space-y-2">
                                  <input
                                    type="number"
                                    placeholder="Add/subtract units (e.g., 50 or -20)"
                                    value={stockData.adjustment}
                                    onChange={(e) => setStockData(prev => ({ ...prev, adjustment: e.target.value }))}
                                    className="w-full p-1 border rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Reason for adjustment"
                                    value={stockData.adjustmentReason}
                                    onChange={(e) => setStockData(prev => ({ ...prev, adjustmentReason: e.target.value }))}
                                    className="w-full p-1 border rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                                  />
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => updateStock(bundle._id, type, 'restock')}
                                      disabled={stockUpdateLoading[`${bundle._id}_restock`] || !stockData.adjustment || parseInt(stockData.adjustment) <= 0}
                                      className="flex-1 p-1 text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                      {stockUpdateLoading[`${bundle._id}_restock`] ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Plus className="w-3 h-3" />
                                      )}
                                      Restock
                                    </button>
                                    <button
                                      onClick={() => updateStock(bundle._id, type, 'adjust')}
                                      disabled={stockUpdateLoading[`${bundle._id}_adjust`] || !stockData.adjustment || parseInt(stockData.adjustment) === 0}
                                      className="flex-1 p-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                      {stockUpdateLoading[`${bundle._id}_adjust`] ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <BarChart3 className="w-3 h-3" />
                                      )}
                                      Adjust
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Low stock threshold */}
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-700 dark:text-gray-300 text-sm">Low threshold:</span>
                                  <input
                                    type="number"
                                    value={stockData.lowThreshold}
                                    onChange={(e) => setStockData(prev => ({ ...prev, lowThreshold: e.target.value }))}
                                    className="w-16 p-1 border rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                                    min="1"
                                  />
                                  <button
                                    onClick={() => updateStock(bundle._id, type, 'threshold')}
                                    disabled={stockUpdateLoading[`${bundle._id}_threshold`]}
                                    className="p-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50"
                                  >
                                    {stockUpdateLoading[`${bundle._id}_threshold`] ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Settings className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              
                              <div className="flex justify-between mt-2">
                                <button
                                  onClick={() => updateBundlePrice(bundle._id, type)}
                                  disabled={updateLoading}
                                  className="p-2 text-sm bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-700 flex items-center gap-1"
                                >
                                  {updateLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                  Save Prices
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-2 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Display mode
                            <div className="flex flex-col">
                              {/* Stock status indicator with units */}
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  {getStockStatusBadge(bundle)}
                                </div>
                                
                                {/* Quick stock actions */}
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => fetchStockHistory(bundle._id)}
                                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    title="View stock history"
                                  >
                                    <History className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => toggleStock(bundle._id, type, bundle.stockInfo?.available > 0)}
                                    disabled={stockUpdateLoading[bundle._id]}
                                    className={`p-1 rounded ${
                                      bundle.stockInfo?.available > 0 
                                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                                        : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                    }`}
                                    title={bundle.stockInfo?.available > 0 ? 'Mark as out of stock' : 'Mark as in stock'}
                                  >
                                    {stockUpdateLoading[bundle._id] ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : bundle.stockInfo?.available > 0 ? (
                                      <PackageX className="w-4 h-4" />
                                    ) : (
                                      <Package className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {bundle.capacity} GB
                                </span>
                                <button
                                  onClick={() => startEditing(bundle)}
                                  className="p-1 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  title="Edit prices and stock"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                              
                              {/* Stock units display */}
                              {bundle.stockInfo && (
                                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                  Stock: {bundle.stockInfo.available || 0} units
                                  {bundle.stockInfo.reserved > 0 && (
                                    <span className="text-yellow-600 dark:text-yellow-400"> ({bundle.stockInfo.reserved} reserved)</span>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center mt-2">
                                <div className="text-gray-700 dark:text-gray-300 font-medium">
                                  GH¢ {parseFloat(bundle.price).toFixed(2)}
                                </div>
                                <button 
                                  onClick={() => toggleBundleDetails(bundle._id)}
                                  className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                  title={expandedBundle === bundle._id ? "Hide details" : "Show details"}
                                >
                                  {expandedBundle === bundle._id ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                              
                              {/* Expanded details */}
                              {expandedBundle === bundle._id && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                  {/* Stock details */}
                                  <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Details:</h4>
                                    <div className="grid grid-cols-2 gap-1">
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Available:</span>
                                        <span className="font-semibold ml-1">{bundle.stockInfo?.available || 0}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Reserved:</span>
                                        <span className="font-semibold ml-1">{bundle.stockInfo?.reserved || 0}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Total Sold:</span>
                                        <span className="font-semibold ml-1">{bundle.stockInfo?.sold || 0}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600 dark:text-gray-400">Threshold:</span>
                                        <span className="font-semibold ml-1">{bundle.stockInfo?.lowStockThreshold || 10}</span>
                                      </div>
                                    </div>
                                    {bundle.stockInfo?.stockPercentage !== undefined && (
                                      <div className="mt-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Stock Level:</span>
                                          <span className="font-semibold">{bundle.stockInfo.stockPercentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                          <div
                                            className={`h-1.5 rounded-full ${
                                              bundle.stockInfo.stockPercentage > 50 ? 'bg-green-500' :
                                              bundle.stockInfo.stockPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${bundle.stockInfo.stockPercentage}%` }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Stock info if out of stock */}
                                  {bundle.stockInfo?.available === 0 && bundle.stockInfo?.reason && (
                                    <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                                      <div className="flex items-start gap-1">
                                        <Info className="w-3 h-3 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                        <div className="text-red-700 dark:text-red-300">
                                          <p className="font-medium">Out of Stock Reason:</p>
                                          <p className="text-xs">{bundle.stockInfo.reason}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Role pricing */}
                                  <div className="text-sm">
                                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Role Prices:</h4>
                                    {bundle.rolePricing ? (
                                      <div className="space-y-1">
                                        {userRoles.map(role => (
                                          <div key={role.id} className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400 capitalize">{role.label}:</span>
                                            <span className="text-gray-800 dark:text-gray-200">
                                              GH¢ {parseFloat(bundle.rolePricing[role.id] || bundle.price).toFixed(2)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 dark:text-gray-400">
                                        No role-specific pricing set
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Stock history modal */}
                              {showStockHistory === bundle._id && stockHistory[bundle._id] && (
                                <div className="fixed inset-0 z-50 overflow-y-auto">
                                  <div className="flex items-center justify-center min-h-screen px-4">
                                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowStockHistory(null)} />
                                    
                                    <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Stock History: {bundle.type} - {bundle.capacity}GB
                                      </h3>
                                      
                                      <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {stockHistory[bundle._id].restockHistory?.length > 0 ? (
                                          stockHistory[bundle._id].restockHistory.map((history, idx) => (
                                            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                              <div className="flex justify-between items-start">
                                                <div>
                                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {history.addedUnits > 0 ? '+' : ''}{history.addedUnits} units
                                                  </p>
                                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {history.previousUnits} → {history.newTotal} units
                                                  </p>
                                                  {history.reason && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                      {history.reason}
                                                    </p>
                                                  )}
                                                </div>
                                                <div className="text-right">
                                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {new Date(history.restockedAt).toLocaleDateString()}
                                                  </p>
                                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {history.restockedBy?.username || 'System'}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-sm text-gray-500 dark:text-gray-400">No restock history available</p>
                                        )}
                                      </div>
                                      
                                      <button
                                        onClick={() => setShowStockHistory(null)}
                                        className="mt-4 w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                      >
                                        Close
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default BundlePriceList;