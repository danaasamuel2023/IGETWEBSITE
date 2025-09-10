'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Settings, Activity, Clock, Shield, Database, Send, Key, Phone, Mail, Server, Lock, LogOut } from 'lucide-react';

const TelecelAdminDashboard = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Dashboard data
  const [dashboard, setDashboard] = useState({
    token: {},
    configuration: {},
    credentials: {},
    statistics: {}
  });
  
  // Token management
  const [otpStep, setOtpStep] = useState('idle'); // idle, waiting, verifying
  const [otpCode, setOtpCode] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [manualTokenReason, setManualTokenReason] = useState('');
  
  // Settings
  const [settings, setSettings] = useState({
    subscriberMsisdn: '',
    email: '',
    password: '',
    phoneNumber: '',
    isEnabled: true,
    autoRetry: true,
    maxRetries: 3
  });
  
  // Statistics
  const [stats, setStats] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Get token from localStorage
  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('igettoken') || '';
    }
    return '';
  }, []);

  // API Base URL - Make this configurable
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/telecel/admin';

  // Authentication check
  const checkAuthentication = useCallback(() => {
    const token = getAuthToken();
    
    if (!token) {
      console.log('No authentication token found');
      setIsAuthenticated(false);
      setAuthChecking(false);
      return false;
    }
    
    // Optionally decode JWT to check expiration
    try {
      // Basic check - you might want to decode JWT here
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      setIsAuthenticated(true);
      setAuthChecking(false);
      return true;
    } catch (err) {
      console.error('Invalid token:', err);
      setIsAuthenticated(false);
      setAuthChecking(false);
      return false;
    }
  }, [getAuthToken]);

  // Handle authentication errors
  const handleAuthError = useCallback((response) => {
    if (response.status === 401 || response.status === 403) {
      setSessionExpired(true);
      setError('Session expired. Please login again.');
      setIsAuthenticated(false);
      
      // Clear token
      localStorage.removeItem('igettoken');
      
      // Redirect after delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
      return true;
    }
    return false;
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('igettoken');
    window.location.href = '/login';
  };

  // Enhanced fetch with auth handling
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token');
    }
    
    const defaultHeaders = {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders
    });
    
    // Check for auth errors
    if (handleAuthError(response)) {
      throw new Error('Authentication failed');
    }
    
    return response;
  }, [getAuthToken, handleAuthError]);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/dashboard`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDashboard(data.data || {
          token: {},
          configuration: {},
          credentials: {},
          statistics: {}
        });
        
        // Pre-fill settings with current values
        if (data.data) {
          setSettings(prev => ({
            ...prev,
            subscriberMsisdn: data.data.configuration?.subscriberMsisdn || '',
            email: data.data.credentials?.email || '',
            isEnabled: data.data.configuration?.isEnabled ?? true,
            autoRetry: data.data.configuration?.autoRetry ?? true,
            maxRetries: data.data.configuration?.maxRetries || 3,
            phoneNumber: data.data.credentials?.phoneNumber || ''
          }));
        }
      } else {
        setError(data.message || 'Failed to load dashboard');
      }
    } catch (err) {
      if (!sessionExpired) {
        setError(err.message || 'Failed to connect to server');
      }
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Request OTP
  const requestOTP = async () => {
    setLoading(true);
    setError(null);
    setOtpStep('waiting');
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ step: 'request-otp' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`OTP sent to ${data.data?.otpSentTo || 'your phone'}`);
        setOtpStep('verifying');
      } else {
        setError(data.message || 'Failed to send OTP');
        setOtpStep('idle');
      }
    } catch (err) {
      setError('Failed to request OTP');
      setOtpStep('idle');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          step: 'verify-otp',
          otpCode: otpCode 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Token refreshed successfully!');
        setOtpStep('idle');
        setOtpCode('');
        fetchDashboard(); // Reload dashboard
      } else {
        setError(data.message || 'Failed to verify OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP');
    } finally { 
      setLoading(false);
    }
  };

  // Update settings
  const updateSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/update-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Settings updated successfully');
        fetchDashboard();
      } else {
        setError(data.message || 'Failed to update settings');
      }
    } catch (err) {
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // Test connection
  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/test-connection`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Connection test successful!');
      } else {
        setError(data.message || 'Connection test failed');
      }
    } catch (err) {
      setError('Failed to test connection');
    } finally {
      setLoading(false);
    }
  };

  // Manual token override
  const submitManualToken = async () => {
    if (!manualToken || !manualTokenReason) {
      setError('Token and reason are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/manual-token-override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: manualToken,
          reason: manualTokenReason,
          expiresInHours: 12
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Token manually set');
        setManualToken('');
        setManualTokenReason('');
        fetchDashboard();
      } else {
        setError(data.message || 'Failed to set token');
      }
    } catch (err) {
      setError('Failed to set manual token');
    } finally {
      setLoading(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/audit-logs?limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setAuditLogs(data.data?.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data || {});
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error && !sessionExpired) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, sessionExpired]);

  // Check authentication on mount
  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  // Load initial data after authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated]);

  // Load tab-specific data
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'audit') fetchAuditLogs();
      if (activeTab === 'stats') fetchStats();
    }
  }, [activeTab, isAuthenticated]);

  // Token status indicator
  const getTokenStatusColor = () => {
    if (dashboard.token?.status === 'active') return 'text-green-600 dark:text-green-400';
    if (dashboard.token?.status === 'expired') return 'text-red-600 dark:text-red-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  const getTokenStatusIcon = () => {
    if (dashboard.token?.status === 'active') return <CheckCircle className="w-5 h-5" />;
    if (dashboard.token?.status === 'expired') return <AlertCircle className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };

  // Show loading spinner during auth check
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show login required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full mx-auto mb-4">
            <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            Please login to access the Telecel Admin Dashboard
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Telecel Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchDashboard}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-8 overflow-x-auto">
            {['dashboard', 'token', 'settings', 'stats', 'audit'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Token Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Token Status</h3>
                <div className={`flex items-center gap-1 ${getTokenStatusColor()}`}>
                  {getTokenStatusIcon()}
                  <span className="text-sm font-medium capitalize">{dashboard.token?.status || 'Unknown'}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Expires In:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{dashboard.token?.hoursRemaining || 0} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Waiting for OTP:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{dashboard.token?.waitingForOtp ? 'Yes' : 'No'}</span>
                </div>
              </div>
              {dashboard.token?.needsRefresh && (
                <button
                  onClick={() => setActiveTab('token')}
                  className="mt-4 w-full px-3 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition"
                >
                  Refresh Token Now
                </button>
              )}
            </div>

            {/* Configuration Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration</h3>
                <Settings className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Service:</span>
                  <span className={`font-medium ${dashboard.configuration?.isEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {dashboard.configuration?.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Auto Retry:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{dashboard.configuration?.autoRetry ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Max Retries:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{dashboard.configuration?.maxRetries || 0}</span>
                </div>
              </div>
              <button
                onClick={testConnection}
                className="mt-4 w-full px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition"
                disabled={loading}
              >
                Test Connection
              </button>
            </div>

            {/* Statistics Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Last 24 Hours</h3>
                <Activity className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Transactions:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{dashboard.statistics?.last24Hours?.transactions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Success Rate:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{dashboard.statistics?.last24Hours?.successRate || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Credentials Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Credentials</h3>
                <Shield className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="font-medium text-gray-900 dark:text-white truncate">{dashboard.credentials?.email || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{dashboard.credentials?.phoneNumber || 'Not set'}</span>
                </div>
              </div>
            </div>

            {/* MSISDN Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscriber Info</h3>
                <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">MSISDN:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{dashboard.configuration?.subscriberMsisdn || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {dashboard.configuration?.lastUpdated ? 
                      new Date(dashboard.configuration.lastUpdated).toLocaleDateString() : 
                      'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Token Management Tab */}
        {activeTab === 'token' && (
          <div className="space-y-6">
            {/* OTP Token Refresh */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Refresh Token via OTP</h3>
              
              {otpStep === 'idle' && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Request an OTP to refresh the Telecel API token. The OTP will be sent to {dashboard.credentials?.phoneNumber || 'your registered phone'}.
                  </p>
                  <button
                    onClick={requestOTP}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                    disabled={loading}
                  >
                    Request OTP
                  </button>
                </div>
              )}
              
              {otpStep === 'waiting' && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Requesting OTP...</p>
                </div>
              )}
              
              {otpStep === 'verifying' && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Enter the 6-digit OTP sent to your phone:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      maxLength="6"
                    />
                    <button
                      onClick={verifyOTP}
                      className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition"
                      disabled={loading || otpCode.length !== 6}
                    >
                      Verify OTP
                    </button>
                    <button
                      onClick={() => {setOtpStep('idle'); setOtpCode('');}}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Token Override */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Manual Token Override (Emergency)</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Use this option only if OTP method fails. Requires a valid reason for audit.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token</label>
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Paste token here"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                  <input
                    type="text"
                    value={manualTokenReason}
                    onChange={(e) => setManualTokenReason(e.target.value)}
                    placeholder="e.g., OTP service down"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <button
                  onClick={submitManualToken}
                  className="px-4 py-2 bg-orange-600 dark:bg-orange-500 text-white rounded hover:bg-orange-700 dark:hover:bg-orange-600 transition"
                  disabled={loading || !manualToken || !manualTokenReason}
                >
                  Override Token
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Telecel Configuration Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subscriber MSISDN
                </label>
                <input
                  type="text"
                  value={settings.subscriberMsisdn}
                  onChange={(e) => setSettings({...settings, subscriberMsisdn: e.target.value})}
                  placeholder="233509240147"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({...settings, email: e.target.value})}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={settings.password}
                  onChange={(e) => setSettings({...settings, password: e.target.value})}
                  placeholder="Leave blank to keep current"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number (for OTP)
                </label>
                <input
                  type="text"
                  value={settings.phoneNumber}
                  onChange={(e) => setSettings({...settings, phoneNumber: e.target.value})}
                  placeholder="0591234567"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Retries
                </label>
                <input
                  type="number"
                  value={settings.maxRetries}
                  onChange={(e) => setSettings({...settings, maxRetries: parseInt(e.target.value) || 3})}
                  min="1"
                  max="5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isEnabled}
                    onChange={(e) => setSettings({...settings, isEnabled: e.target.checked})}
                    className="rounded text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Service Enabled</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoRetry}
                    onChange={(e) => setSettings({...settings, autoRetry: e.target.checked})}
                    className="rounded text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Retry</span>
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <button
                onClick={updateSettings}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading}
              >
                {loading ? <ButtonLoader /> : null}
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={fetchDashboard}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading}
              >
                {loading ? <ButtonLoader /> : null}
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Transactions</h4>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTransactions || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Success Rate</h4>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.successRate || 0}%</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Volume</h4>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalVolume || 0} GB</p>
              </div>
            </div>
            
            {/* Capacity Breakdown */}
            {stats.capacityBreakdown && Object.keys(stats.capacityBreakdown).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Capacity Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.capacityBreakdown).map(([capacity, count]) => (
                    <div key={capacity} className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{capacity}GB</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log._id || Math.random()}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {log.action?.replace(/_/g, ' ') || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {log.performedByUsername || 'System'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {log.details?.reason || log.details?.action || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No audit logs available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelecelAdminDashboard;