'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/adminWraper';

const API_BASE = 'https://iget.onrender.com/api/admin/settings';

export default function ApiSettingsPage() {
  const [settings, setSettings] = useState({
    apiIntegrations: { mtnHubnetEnabled: true, atHubnetEnabled: true },
    notifications: { smsEnabled: true, emailEnabled: true }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updating, setUpdating] = useState(null); // track which toggle is updating
  const router = useRouter();

  const getToken = useCallback(() => {
    const token = localStorage.getItem('igettoken');
    if (!token) throw new Error('Not authenticated');
    return token;
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    const user = userData ? JSON.parse(userData) : null;
    if (!user || !user.id || user.role !== 'admin') {
      router.push('/Signin');
      return;
    }
    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error(`Failed to load settings (${response.status})`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setSettings(data.data);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Check your connection.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleApi = async (type) => {
    try {
      setUpdating(type);
      setError(null);
      const token = getToken();
      const endpoint = type === 'mtn' ? 'toggle-mtn-api' : 'toggle-at-api';

      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Update failed (${response.status})`);

      const data = await response.json();
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          apiIntegrations: {
            ...prev.apiIntegrations,
            ...(type === 'mtn'
              ? { mtnHubnetEnabled: data.data.mtnHubnetEnabled }
              : { atHubnetEnabled: data.data.atHubnetEnabled })
          }
        }));
        const label = type === 'mtn' ? 'MTN Hubnet' : 'AT-ishare Hubnet';
        const enabled = type === 'mtn' ? data.data.mtnHubnetEnabled : data.data.atHubnetEnabled;
        showSuccess(`${label} API ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setUpdating(null);
    }
  };

  const updateNotification = async (type, value) => {
    try {
      setUpdating(type);
      setError(null);
      const token = getToken();

      const response = await fetch(API_BASE, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notifications: { ...settings.notifications, [type]: value }
        })
      });

      if (!response.ok) throw new Error(`Update failed (${response.status})`);

      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        const label = type === 'smsEnabled' ? 'SMS' : 'Email';
        showSuccess(`${label} notifications ${value ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setUpdating(null);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const ToggleSwitch = ({ enabled, onToggle, loading: isLoading, label }) => (
    <button
      onClick={onToggle}
      disabled={isLoading}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed ${
        enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </span>
      )}
    </button>
  );

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">System Configuration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Control API integrations and notification preferences.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-5 flex items-start gap-2.5">
            <svg className="w-4.5 h-4.5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 mb-5 flex items-center gap-2.5">
            <svg className="w-4.5 h-4.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-300 border-t-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* API Integrations */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">API Integrations</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  When disabled, orders go to pending status for manual processing.
                </p>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {/* MTN Toggle */}
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">MTN Bundle API</h3>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        settings.apiIntegrations?.mtnHubnetEnabled
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {settings.apiIntegrations?.mtnHubnetEnabled ? 'On' : 'Off'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Automatically process MTN orders through Hubnet
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.apiIntegrations?.mtnHubnetEnabled}
                    onToggle={() => toggleApi('mtn')}
                    loading={updating === 'mtn'}
                    label="Toggle MTN API"
                  />
                </div>

                {/* AT Toggle */}
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">AT-ishare Bundle API</h3>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        settings.apiIntegrations?.atHubnetEnabled
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {settings.apiIntegrations?.atHubnetEnabled ? 'On' : 'Off'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Automatically process AT-ishare orders through Hubnet
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.apiIntegrations?.atHubnetEnabled}
                    onToggle={() => toggleApi('at')}
                    loading={updating === 'at'}
                    label="Toggle AT API"
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notifications</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Control how users are notified about order updates.
                </p>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">SMS Notifications</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Send SMS alerts for order status changes
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.notifications?.smsEnabled}
                    onToggle={() => updateNotification('smsEnabled', !settings.notifications?.smsEnabled)}
                    loading={updating === 'smsEnabled'}
                    label="Toggle SMS"
                  />
                </div>

                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Send email alerts for order status changes
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={settings.notifications?.emailEnabled}
                    onToggle={() => updateNotification('emailEnabled', !settings.notifications?.emailEnabled)}
                    loading={updating === 'emailEnabled'}
                    label="Toggle Email"
                  />
                </div>
              </div>
            </div>

            {/* Last updated */}
            {settings.lastUpdatedAt && (
              <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
                Last updated {new Date(settings.lastUpdatedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
