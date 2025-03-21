'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';

const ApiKeyManager = () => {
  const [apiKeyData, setApiKeyData] = useState({
    hasApiKey: false,
    apiKey: '',
    loading: true,
    error: null
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApiKey = async () => {
    try {
      setApiKeyData(prev => ({ ...prev, loading: true }));
      const response = await axios.get('http://localhost:5000/api/v1/api-key', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('igettoken')}`
        }
      });
      
      setApiKeyData({
        hasApiKey: response.data.hasApiKey,
        apiKey: response.data.apiKey || '',
        loading: false,
        error: null
      });
    } catch (error) {
      setApiKeyData({
        hasApiKey: false,
        apiKey: '',
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch API key'
      });
    }
  };

  const generateApiKey = async () => {
    try {
      setActionLoading(true);
      const response = await axios.post('http://localhost:5000/api/v1/generate-api-key', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('igettoken')}`
        }
      });
      
      setApiKeyData({
        hasApiKey: true,
        apiKey: response.data.data.apiKey,
        loading: false,
        error: null
      });
      setActionLoading(false);
    } catch (error) {
      setApiKeyData(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to generate API key'
      }));
      setActionLoading(false);
    }
  };

  const revokeApiKey = async () => {
    try {
      setActionLoading(true);
      await axios.delete('http://localhost:5000/api/v1/api-key', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('igettoken')}`
        }
      });
      
      setApiKeyData({
        hasApiKey: false,
        apiKey: '',
        loading: false,
        error: null
      });
      setActionLoading(false);
    } catch (error) {
      setApiKeyData(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to revoke API key'
      }));
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKey();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">API Key Management</h2>

      {apiKeyData.loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : apiKeyData.error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {apiKeyData.error}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border-b text-left">Status</th>
                <th className="py-3 px-4 border-b text-left">API Key</th>
                <th className="py-3 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-4 px-4 border-b">
                  {apiKeyData.hasApiKey ? (
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-sm">
                      Active
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 py-1 px-3 rounded-full text-sm">
                      Not Generated
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 border-b font-mono">
                  {apiKeyData.hasApiKey ? apiKeyData.apiKey : 'No API key generated'}
                </td>
                <td className="py-4 px-4 border-b">
                  {apiKeyData.hasApiKey ? (
                    <button 
                      onClick={revokeApiKey}
                      disabled={actionLoading}
                      className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg disabled:opacity-50"
                    >
                      {actionLoading ? 'Revoking...' : 'Revoke Key'}
                    </button>
                  ) : (
                    <button 
                      onClick={generateApiKey}
                      disabled={actionLoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg disabled:opacity-50"
                    >
                      {actionLoading ? 'Generating...' : 'Generate Key'}
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Instructions for using the API key */}
      {apiKeyData.hasApiKey && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Using Your API Key</h3>
          <p className="mb-2">Include your API key in request headers:</p>
          <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
            <code>
              {`
// Example API request
fetch('https://yourapi.com/endpoint', {
  headers: {
    'x-api-key': '${apiKeyData.apiKey.replace('••••••••', '[YOUR_FULL_API_KEY]')}'
  }
})
              `}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManager;