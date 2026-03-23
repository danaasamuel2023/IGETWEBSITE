// components/AuthGuard.js
'use client'
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [showDateVerification, setShowDateVerification] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [dateError, setDateError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();

  const getTodaysDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSubmit = (e) => {
    e.preventDefault();
    const todaysDate = getTodaysDate();

    if (dateInput.trim() === todaysDate) {
      setShowDateVerification(false);
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 3) {
        setDateError('Too many failed attempts. Logging out...');
        setTimeout(() => {
          localStorage.removeItem('igettoken');
          localStorage.removeItem('userData');
          router.push('/Signin');
        }, 1200);
      } else {
        setDateError(`Incorrect date. ${3 - newAttempts} attempt${3 - newAttempts === 1 ? '' : 's'} remaining.`);
        setDateInput('');
        inputRef.current?.focus();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('igettoken');
    localStorage.removeItem('userData');
    router.push('/Signin');
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('igettoken');

        if (!token) {
          router.push('/Signin');
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('https://iget.onrender.com/api/dashboard/verify-token', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          localStorage.removeItem('igettoken');
          localStorage.removeItem('userData');
          router.push('/Signin');
          return;
        }

        setLoading(false);
        setShowDateVerification(true);

      } catch (error) {
        if (error.name === 'AbortError') {
          // Timeout — still show verification so user isn't stuck
          setLoading(false);
          setShowDateVerification(true);
        } else {
          setLoading(false);
          setShowDateVerification(true);
        }
      }
    };

    checkAuth();
  }, [router]);

  // Focus input when modal shows
  useEffect(() => {
    if (showDateVerification && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showDateVerification]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-500"></div>
          <p className="text-sm text-gray-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (showDateVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-2">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Security check
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter today's date to continue
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleDateSubmit} className="px-6 pb-6 pt-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={dateInput}
                  onChange={(e) => {
                    setDateInput(e.target.value);
                    setDateError('');
                  }}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-center font-mono tracking-widest transition-colors"
                  maxLength="10"
                  autoComplete="off"
                  required
                />
              </div>

              {dateError && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-2 text-center">{dateError}</p>
              )}

              <div className="flex gap-2.5 mt-4">
                <button
                  type="submit"
                  disabled={attempts >= 3}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
