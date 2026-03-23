'use client'
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'https://iget.onrender.com/api/v1';

const ApiKeyManager = () => {
  const [apiKeyData, setApiKeyData] = useState({
    hasApiKey: false,
    apiKey: '',
    loading: true,
    error: null
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [newlyGenerated, setNewlyGenerated] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('igettoken');
    if (!token) throw new Error('Not authenticated');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchApiKey = useCallback(async () => {
    try {
      setApiKeyData(prev => ({ ...prev, loading: true, error: null }));
      const response = await axios.get(`${API_BASE}/api-key`, {
        headers: getAuthHeaders(),
        timeout: 10000
      });

      setApiKeyData({
        hasApiKey: response.data.hasApiKey,
        apiKey: response.data.apiKey || '',
        loading: false,
        error: null
      });
    } catch (error) {
      const msg = error.response?.status === 401
        ? 'Session expired. Please sign in again.'
        : error.response?.data?.message || 'Could not load API key. Try again.';
      setApiKeyData({ hasApiKey: false, apiKey: '', loading: false, error: msg });
    }
  }, [getAuthHeaders]);

  const generateApiKey = async () => {
    try {
      setActionLoading(true);
      const response = await axios.post(`${API_BASE}/generate-api-key`, {}, {
        headers: getAuthHeaders(),
        timeout: 10000
      });

      const key = response.data.data.apiKey;
      setNewlyGenerated(key);
      setApiKeyData({
        hasApiKey: true,
        apiKey: response.data.data.apiKey ? '••••••••' + key.slice(-4) : key,
        loading: false,
        error: null
      });
    } catch (error) {
      setApiKeyData(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to generate key'
      }));
    } finally {
      setActionLoading(false);
    }
  };

  const revokeApiKey = async () => {
    try {
      setActionLoading(true);
      await axios.delete(`${API_BASE}/api-key`, {
        headers: getAuthHeaders(),
        timeout: 10000
      });

      setApiKeyData({ hasApiKey: false, apiKey: '', loading: false, error: null });
      setShowRevokeConfirm(false);
      setNewlyGenerated(null);
    } catch (error) {
      setApiKeyData(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to revoke key'
      }));
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    fetchApiKey();
  }, [fetchApiKey]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">API Key</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your API key for programmatic access to iGet services.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {apiKeyData.loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-300 border-t-blue-500"></div>
            </div>
          ) : apiKeyData.error ? (
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">{apiKeyData.error}</p>
                  <button onClick={fetchApiKey} className="text-sm text-red-600 dark:text-red-400 font-medium mt-1 hover:underline">
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : apiKeyData.hasApiKey ? (
            <div className="p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                </div>
                <button
                  onClick={() => setShowRevokeConfirm(true)}
                  disabled={actionLoading}
                  className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50"
                >
                  Revoke key
                </button>
              </div>

              {/* Key display */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                  <code className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate">
                    {apiKeyData.apiKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(apiKeyData.apiKey)}
                    className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Copy"
                  >
                    {copied ? (
                      <svg className="w-4.5 h-4.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Newly generated key warning */}
              {newlyGenerated && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                    Save your key now — you won't see the full key again.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded break-all">
                      {newlyGenerated}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newlyGenerated)}
                      className="shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Revoke confirmation */}
              {showRevokeConfirm && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                    Revoking your key will immediately break any integrations using it. This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={revokeApiKey}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium disabled:opacity-50 transition-colors"
                    >
                      {actionLoading ? 'Revoking...' : 'Yes, revoke'}
                    </button>
                    <button
                      onClick={() => setShowRevokeConfirm(false)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* No key state */
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No API key yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Generate a key to start using the iGet API programmatically.
              </p>
              <button
                onClick={generateApiKey}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Generating...
                  </>
                ) : (
                  'Generate API key'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Usage guide */}
        {apiKeyData.hasApiKey && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick start</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Include your API key in the <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">X-API-Key</code> header:
            </p>
            <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 text-xs rounded-lg p-4 overflow-x-auto">
              <code>{`curl -X POST https://iget.onrender.com/api/v1/orders/place \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"recipientNumber":"0241234567","capacity":1,"bundleType":"mtnup2u"}'`}</code>
            </pre>
          </div>
        )}

        {/* Security note */}
        <div className="mt-4 flex items-start gap-2 px-1">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Never share your API key or commit it to source control. Treat it like a password.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
