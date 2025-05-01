'use client'
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, AlertCircle, XCircle, RefreshCw, Clock, Wifi, WifiOff, ChevronDown, ChevronUp, Info, Moon, Sun } from 'lucide-react';

const NetworkAvailabilityDashboard = () => {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRules, setShowRules] = useState(true);
  const [expandedNetworks, setExpandedNetworks] = useState({});
  const [darkMode, setDarkMode] = useState(false);

  // Check system preference for dark mode on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDarkModePreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDarkModePreferred);
    }
  }, []);

  // Fetch network availability data on component mount
  useEffect(() => {
    fetchNetworks();
  }, []);

  // Function to fetch network availability data
  const fetchNetworks = async () => {
    try {
      setLoading(true);
      
      // Get authentication token from localStorage
      const token = localStorage.getItem('igettoken');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Real API call with authentication token
      const response = await fetch('http://localhost:5000/api/network', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Raw API network data:', data.data);
        
        if (data.data && Array.isArray(data.data)) {
          const processedNetworks = data.data.map(network => ({
            networkType: network.networkType || 'unknown',
            isAvailable: typeof network.isAvailable === 'boolean' ? network.isAvailable : true,
            unavailableMessage: network.unavailableMessage || 'This network is currently unavailable.',
            updatedAt: network.updatedAt || new Date().toISOString(),
            updatedBy: network.updatedBy || null
          }));
          
          console.log('Processed networks:', processedNetworks);
          setNetworks(processedNetworks);
        } else {
          setNetworks([]);
        }
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch network data');
      }
      
      setLoading(false);
      
    } catch (err) {
      setError('Failed to fetch network availability data');
      setLoading(false);
      console.error('Error fetching network availability:', err);
    }
  };

  // Function to toggle network availability
  const toggleAvailability = async (networkType, currentStatus) => {
    try {
      setLoading(true);
      const newStatus = !currentStatus;
      
      // Get authentication token from localStorage
      const token = localStorage.getItem('igettoken');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/network/availability/${networkType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isAvailable: newStatus
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setNetworks(networks.map(network => 
          network.networkType === networkType 
            ? { ...network, isAvailable: newStatus, updatedAt: new Date().toISOString() } 
            : network
        ));
        
        setSuccessMessage(`${formatNetworkType(networkType)} has been marked as ${newStatus ? 'Available' : 'Out of Stock'}`);
      } else {
        setError(data.message || `Failed to update ${networkType} availability`);
      }
      
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(`Failed to update ${networkType} availability`);
      setLoading(false);
      console.error('Error toggling network availability:', err);
    }
  };

  // Function to update unavailable message
  const updateUnavailableMessage = async (networkType, message) => {
    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem('igettoken');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/network/availability/${networkType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isAvailable: false,
          unavailableMessage: message
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setNetworks(networks.map(network => 
          network.networkType === networkType 
            ? { ...network, unavailableMessage: message, isAvailable: false, updatedAt: new Date().toISOString() } 
            : network
        ));
        
        setSuccessMessage(`Message updated for ${formatNetworkType(networkType)}`);
      } else {
        setError(data.message || `Failed to update message for ${networkType}`);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(`Failed to update message for ${networkType}`);
      console.error('Error updating unavailable message:', err);
    }
  };

  // Function to initialize all networks
  const initializeNetworks = async () => {
    try {
      setLoading(true);
      
      // Get authentication token from localStorage
      const token = localStorage.getItem('igettoken');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/network/availability/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchNetworks();
        setSuccessMessage('All networks initialized successfully');
      } else {
        setError(data.message || 'Failed to initialize networks');
      }
      
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Failed to initialize networks');
      setLoading(false);
      console.error('Error initializing networks:', err);
    }
  };

  // Format network type for display
  const formatNetworkType = (type) => {
    // Handle undefined or null type values
    if (!type) {
      return 'Unknown Network';
    }
    
    // Create a mapping for proper names based on the backend schema
    const networkDisplayNames = {
      'mtnup2u': 'MTN Up2U',
      'mtn-fibre': 'MTN Fibre',
      'mtn-justforu': 'MTN JustForU',
      'at-ishare': 'AT iShare',
      'AT-ishare': 'AT iShare',
      'telecel-5959': 'Telecel 5959',
      'Telecel-5959': 'Telecel 5959',
      'afa-registration': 'AfA Registration',
      'AfA-registration': 'AfA Registration',
      'other': 'Other'
    };
    
    // First try to use the exact mapping
    if (networkDisplayNames[type]) {
      return networkDisplayNames[type];
    }
    
    // If not found in mapping, try lowercase version
    const lowerCaseType = type.toLowerCase();
    if (networkDisplayNames[lowerCaseType]) {
      return networkDisplayNames[lowerCaseType];
    }
    
    // If still not found, use a generic formatter
    console.log(`Network type not found in mapping: ${type}`);
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Toggle expanded state for a network
  const toggleExpanded = (networkType) => {
    setExpandedNetworks({
      ...expandedNetworks,
      [networkType]: !expandedNetworks[networkType]
    });
  };

  // Get network color based on type with dark mode support
  const getNetworkColor = (type) => {
    // Handle undefined or null type values
    if (!type) {
      return darkMode ? 'border-gray-500' : 'border-gray-400';
    }
    
    const networkType = type.toLowerCase();
    
    // MTN networks (yellow)
    if (['mtnup2u', 'mtn-fibre', 'mtn-justforu'].includes(networkType)) {
      return darkMode ? 'border-yellow-500' : 'border-yellow-400';
    }
    
    // AT networks (blue)
    if (networkType === 'at-ishare' || networkType === 'at-ishare') {
      return darkMode ? 'border-blue-500' : 'border-blue-400';
    }
    
    // Telecel networks (red)
    if (networkType === 'telecel-5959' || networkType === 'telecel-5959') {
      return darkMode ? 'border-red-500' : 'border-red-400';
    }
    
    // AFA networks (green)
    if (networkType === 'afa-registration' || networkType === 'afa-registration') {
      return darkMode ? 'border-green-500' : 'border-green-400';
    }
    
    // Default case
    return darkMode ? 'border-gray-500' : 'border-gray-400';
  };

  // Get network icon
  const getNetworkIcon = (type, isAvailable) => {
    if (isAvailable) {
      return <Wifi className="h-5 w-5 text-green-500" />;
    } else {
      return <WifiOff className="h-5 w-5 text-red-500" />;
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`w-full ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
      {/* Dark Mode Toggle */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={toggleDarkMode} 
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
      
      {/* Admin Rules and Warnings */}
      <div className={`mb-6 ${darkMode ? 'bg-amber-900/30 border-amber-600' : 'bg-amber-50 border-amber-500'} border-l-4 p-4 rounded-md`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <AlertTriangle className={`h-6 w-6 ${darkMode ? 'text-amber-400' : 'text-amber-500'} mr-2`} />
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-amber-100' : 'text-gray-800'}`}>iGet Ghana Admin Rules</h2>
          </div>
          <button 
            onClick={() => setShowRules(!showRules)} 
            className={`${darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {showRules ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
        
        {showRules && (
          <div className={`mt-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} space-y-2`}>
            <p className="flex items-start">
              <span className="mr-2 mt-1"><XCircle className="h-4 w-4 text-red-500" /></span>
              <span>Do not skip any order(s). If you do you will be sacked.</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2 mt-1"><XCircle className="h-4 w-4 text-red-500" /></span>
              <span>Do not process refund during network downtime, service monitoring by the telcos unless communicated to you by the business owner.</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2 mt-1"><XCircle className="h-4 w-4 text-red-500" /></span>
              <span>Do not process refunds to commission numbers (where a network internet data bundle's order has been requested to a number on a different network). You'll be requested to pay for the service since our account will be Debited/limited to beneficiaries to subscription done.</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2 mt-1"><XCircle className="h-4 w-4 text-red-500" /></span>
              <span>Do not change the status of the transactions if it is not so.</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2 mt-1"><Info className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} /></span>
              <span>Process top up only after payment has been received to your Mobile money account.</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2 mt-1"><Info className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} /></span>
              <span>Ensure all orders have been completed successfully.</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2 mt-1"><Clock className={`h-4 w-4 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} /></span>
              <span>Do not process orders outside business hours. If you do, you'll be sacked and held liable if audit doesn't tally with the expectations and you'll have to pay for it.</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2 mt-1"><XCircle className="h-4 w-4 text-red-500" /></span>
              <span>Do not respond to messages where you are not in charge of. Intruding in other person's task is offensive and you'll be sacked.</span>
            </p>
          </div>
        )}
      </div>
      
      {/* Success and Error Messages */}
      {successMessage && (
        <div className={`mb-6 ${darkMode ? 'bg-green-900/30 border-green-600' : 'bg-green-50 border-green-500'} border-l-4 p-4 rounded-md flex items-center`}>
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <p className={darkMode ? 'text-green-300' : 'text-green-700'}>{successMessage}</p>
        </div>
      )}
      
      {error && (
        <div className={`mb-6 ${darkMode ? 'bg-red-900/30 border-red-600' : 'bg-red-50 border-red-500'} border-l-4 p-4 rounded-md flex items-center`}>
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className={darkMode ? 'text-red-300' : 'text-red-700'}>{error}</p>
        </div>
      )}
      
      {/* Action Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Manage Network Availability</h2>
        <div className="flex space-x-3">
          <button 
            onClick={fetchNetworks} 
            className={`flex items-center px-4 py-2 ${darkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors`}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={initializeNetworks} 
            className={`flex items-center px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-800' : 'bg-gray-600 hover:bg-gray-700'} text-white rounded-md transition-colors`}
            disabled={loading}
          >
            <Check className="h-4 w-4 mr-2" />
            Set All Available
          </button>
        </div>
      </div>
      
      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center my-12">
          <div className={`inline-flex items-center px-4 py-2 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'} rounded-md`}>
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            Loading...
          </div>
        </div>
      )}
      
      {/* Networks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {networks.map(network => {
          // Log each network for debugging
          console.log(`Rendering network:`, network);
          const formattedName = formatNetworkType(network.networkType);
          console.log(`Formatted name: ${formattedName} for type: ${network.networkType}`);
          
          return (
          <div 
            key={network.networkType} 
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-md border-l-4 ${getNetworkColor(network.networkType)}`}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  {getNetworkIcon(network.networkType, network.isAvailable)}
                  <h3 className={`ml-2 font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {formattedName}
                  </h3>
                </div>
                <div 
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    network.isAvailable 
                      ? darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                      : darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {network.isAvailable ? 'Available' : 'Out of Stock'}
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => toggleAvailability(network.networkType, network.isAvailable)}
                  className={`w-full py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                    network.isAvailable 
                      ? darkMode ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' : 'bg-red-50 text-red-700 hover:bg-red-100'
                      : darkMode ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50' : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                  disabled={loading}
                >
                  {network.isAvailable ? 'Mark as Out of Stock' : 'Mark as Available'}
                </button>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => toggleExpanded(network.networkType)}
                  className={`flex items-center justify-between w-full px-3 py-2 ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  } rounded-md text-sm transition-colors`}
                >
                  <span>Additional Settings</span>
                  {expandedNetworks[network.networkType] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {expandedNetworks[network.networkType] && (
                <div className={`mt-4 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md`}>
                  <div className="mb-3">
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>
                      Out of Stock Message:
                    </label>
                    <textarea
                      defaultValue={network.unavailableMessage}
                      onBlur={(e) => updateUnavailableMessage(network.networkType, e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-600 text-gray-200 focus:ring-blue-400' 
                          : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                      } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent text-sm`}
                      placeholder="Enter message to display when network is unavailable"
                    />
                  </div>
                  
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p>Last updated: {new Date(network.updatedAt).toLocaleString()}</p>
                    <p>Updated by: {network.updatedBy?.username || 'System'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )})}
      </div>
      
      {/* No Networks Found */}
      {!loading && networks.length === 0 && (
        <div className="text-center py-12">
          <WifiOff className={`mx-auto h-12 w-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <h3 className={`mt-2 text-lg font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>No networks found</h3>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try refreshing the page or initializing the networks.</p>
          <div className="mt-6">
            <button
              onClick={initializeNetworks}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                darkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Initialize Networks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkAvailabilityDashboard;