// components/AuthGuard.js
'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [showDateVerification, setShowDateVerification] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [dateError, setDateError] = useState('');
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
    
    if (dateInput === todaysDate) {
      // Correct date entered, navigate to home
      setShowDateVerification(false);
      router.push('/');
    } else {
      // Incorrect date, logout user
      setDateError('Incorrect date. You will be logged out.');
      setTimeout(() => {
        localStorage.removeItem('igettoken');
        localStorage.removeItem('userData');
        router.push('/Signin');
      }, 2000);
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
        // Get token from localStorage
        const token = localStorage.getItem('igettoken');
        
        // If no token exists, redirect to auth page
        if (!token) {
          console.log('No token found, redirecting to login');
          router.push('/Signin');
          return;
        }
        
        // Verify token with your backend
        const response = await fetch('https://iget.onrender.com/api/dashboard/verify-token', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          // Token is invalid or expired
          console.log('Invalid token, logging out');
          localStorage.removeItem('igettoken');
          localStorage.removeItem('userData');
          router.push('/Signin');
          return;
        }
        
        // Token is valid, show date verification popup
        setLoading(false);
        setShowDateVerification(true);
        
      } catch (error) {
        console.error('Auth verification error:', error);
        // On error, show date verification popup instead of redirecting
        setLoading(false);
        setShowDateVerification(true);
      }
    };
    
    checkAuth();
  }, [router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show date verification popup
  if (showDateVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Verify You're Not a Robot</h2>
            <p className="text-gray-600 mb-6">Please enter today's date in YYYY-MM-DD format</p>
            
            <form onSubmit={handleDateSubmit}>
              <input
                type="text"
                value={dateInput}
                onChange={(e) => {
                  setDateInput(e.target.value);
                  setDateError('');
                }}
                placeholder="YYYY-MM-DD"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                maxLength="10"
                required
              />
              
              {dateError && (
                <p className="text-red-500 text-sm mb-4">{dateError}</p>
              )}
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
            

          </div>
        </div>
      </div>
    );
  }

  // If authenticated and date verified, render the protected content
  return children;
}