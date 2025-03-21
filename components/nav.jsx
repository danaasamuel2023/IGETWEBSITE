'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logo from '../images/IgetLogo.jpg'

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);
  const router = useRouter();
  
  // Check for authentication token on component mount and window focus
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('igettoken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          setUser(JSON.parse(userData));
          fetchUserBalance(token);
        } else {
          setUser(null);
          setBalance(null);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null);
        setBalance(null);
      }
    };

    // Check auth on initial load
    checkAuth();
    
    // Also check auth when window regains focus (in case user logged out in another tab)
    window.addEventListener('focus', checkAuth);
    
    return () => {
      window.removeEventListener('focus', checkAuth);
    };
  }, []);
  
  // Fetch user balance from API
  const fetchUserBalance = async (token) => {
    try {
      const response = await fetch('https://iget.onrender.com/api/iget/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.data);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };
  
  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  // Toggle services dropdown
  const toggleServicesDropdown = () => {
    setIsServicesDropdownOpen(!isServicesDropdownOpen);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('igettoken');
    localStorage.removeItem('userData');
    setUser(null);
    setBalance(null);
    router.push('/Signin');
  };

  // Bundle service types from schema
  const serviceTypes = [
   
    'AfA-registration',
    'mtn',  
    'at-ishare', 
    'telecel'
   
  ];
  
  return (
    <nav className="bg-black text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Image 
            src={logo}
            alt="iGet Logo" 
            width={45}
            height={40}
            className="h-15 mr-5" 
          />
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
          <Link href="/api-key" className="block px-4 py-2 hover:bg-gray-700">API Keys</Link>

          {/* <Link href="/bundles" className="hover:text-gray-300 transition-colors">Bundles</Link> */}
          
          {/* Services Dropdown */}
          <div className="relative">
            <button 
              onClick={toggleServicesDropdown}
              className="flex items-center hover:text-gray-300 transition-colors"
            >
              Services
              <svg 
                className="w-4 h-4 ml-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d={isServicesDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                />
              </svg>
            </button>
            
            {isServicesDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
                {serviceTypes.map((service, index) => (
                  <Link 
                    key={index}
                    href={`/${service}`} 
                    className="block px-4 py-2 hover:bg-gray-700 capitalize"
                  >
                    {service}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {user ? (
            <>
              <Link href="/orders" className="hover:text-gray-300 transition-colors">My Orders</Link>
              <Link href="/api-doc" className="hover:text-gray-300 transition-colors">ApI-Doc</Link>
              
              {user.role === 'admin' && (
                <>
                  <Link href="/admin-users" className="hover:text-gray-300 transition-colors">Users</Link>
                  <Link href="/admin-orders" className="hover:text-gray-300 transition-colors">Transactions</Link>
                  {/* <Link href="/admin/settings" className="hover:text-gray-300 transition-colors">Settings</Link> */}
                </>
              )}
              
              <div className="relative ml-4">
                <button 
                  className="flex items-center bg-gray-800 rounded-full px-4 py-2 hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <span className="mr-2">{user.username}</span>
                  {balance ? (
                    <span className="text-xs bg-green-500 text-black rounded-full px-2 py-1">
                      {balance.balance.toFixed(2)} {balance.currency}
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-600 text-white rounded-full px-2 py-1">
                      Loading...
                    </span>
                  )}
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
                    {/* <Link href="/profile" className="block px-4 py-2 hover:bg-gray-700">Profile</Link> */}
                    <Link href="/api-key" className="block px-4 py-2 hover:bg-gray-700">API Keys</Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-700">Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/Signin" className="hover:text-gray-300 transition-colors">Login</Link>
              <Link href="/Signin" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors">Register</Link>
            </>
          )}
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button onClick={toggleMenu} className="text-white focus:outline-none">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden px-2 pt-2 pb-4 space-y-1 bg-gray-900 mt-2">
          <Link href="/" className="block px-3 py-2 rounded-md hover:bg-gray-800">Home</Link>
          {/* <Link href="/bundles" className="block px-3 py-2 rounded-md hover:bg-gray-800">Bundles</Link> */}
          
          {/* Mobile Services Dropdown */}
          <div className="block px-3 py-2">
            <button 
              onClick={toggleServicesDropdown}
              className="flex items-center w-full text-left rounded-md hover:bg-gray-800 px-3 py-2"
            >
              Services
              <svg 
                className="w-4 h-4 ml-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d={isServicesDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                />
              </svg>
            </button>
            
            {isServicesDropdownOpen && (
              <div className="pl-4 mt-1 space-y-1">
                {serviceTypes.map((service, index) => (
                  <Link 
                    key={index}
                    href={`/${service}`} 
                    className="block px-3 py-2 rounded-md hover:bg-gray-800 capitalize"
                  >
                    {service}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {user ? (
            <>
              <Link href="/orders" className="block px-3 py-2 rounded-md hover:bg-gray-800">My Orders</Link>
              <Link href="/api-doc" className="block px-3 py-2 rounded-md hover:bg-gray-800">ApI-Doc</Link>
              {balance && (
                <div className="px-3 py-2">
                  <span className="text-xs bg-green-500 text-black rounded-full px-2 py-1">
                    Balance: {balance.balance.toFixed(2)} {balance.currency}
                  </span>
                </div>
              )}
              
              {user.role === 'admin' && (
                <>
                  <Link href="/admin-users" className="block px-3 py-2 rounded-md hover:bg-gray-800">Users</Link>
                  <Link href="/admin-orders" className="block px-3 py-2 rounded-md hover:bg-gray-800">Transactions</Link>
                  {/* <Link href="/admin/settings" className="block px-3 py-2 rounded-md hover:bg-gray-800">Settings</Link> */}
                </>
              )}
              
              <Link href="/api-keys" className="block px-3 py-2 rounded-md hover:bg-gray-800">API Keys</Link>
              <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-800">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="block px-3 py-2 rounded-md hover:bg-gray-800">Login</Link>
              <Link href="/register" className="block px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navigation;