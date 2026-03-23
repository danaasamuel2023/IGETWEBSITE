'use client'
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import logo from '../images/igetLogo - Copy.jpg'

const Navigation = () => {
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
   const [mounted, setMounted] = useState(false);
   const { theme, setTheme, resolvedTheme } = useTheme();

   // Avoid hydration mismatch
   useEffect(() => setMounted(true), []);
   const [user, setUser] = useState(null);
   const [balance, setBalance] = useState(null);
   const router = useRouter();

   // Create refs for dropdown containers to detect outside clicks
   const servicesDropdownRef = useRef(null);
   const mobileMenuRef = useRef(null);

   // Helper function to check if user has admin privileges
   const isAdmin = (userRole) => {
     const adminRoles = ['admin', 'credit_admin', 'debit_admin', 'wallet_admin', 'Editor'];
     return adminRoles.includes(userRole);
   };

   // Helper function to get role display name
   const getRoleDisplayName = (role) => {
     switch(role) {
       case 'admin': return 'Full Admin';
       case 'credit_admin': return 'Credit Admin';
       case 'debit_admin': return 'Debit Admin';
       case 'wallet_admin': return 'Wallet Admin';
       case 'agent': return 'Agent';
       case 'Editor': return 'Editor';
       case 'Business': return 'Business';
       case 'Dealers': return 'Dealers';
       case 'Enterprise': return 'Enterprise';
       default: return 'User';
     }
   };

   // Helper function to get role badge color
   const getRoleBadgeColor = (role) => {
     switch(role) {
       case 'admin': return 'bg-purple-500';
       case 'credit_admin': return 'bg-green-500';
       case 'debit_admin': return 'bg-red-500';
       case 'wallet_admin': return 'bg-blue-500';
       case 'agent': return 'bg-cyan-500';
       case 'Editor': return 'bg-orange-500';
       case 'Business': return 'bg-indigo-500';
       case 'Dealers': return 'bg-teal-500';
       case 'Enterprise': return 'bg-amber-500';
       default: return 'bg-gray-500';
     }
   };

   // Helper function to get admin navigation based on role
   const getAdminNavigation = (role) => {
     switch(role) {
       case 'Editor':
         return {
           mainLink: '/admin-orders',
           mainLabel: 'Orders Management',
           description: 'Manage and update order statuses'
         };
       case 'wallet_admin':
         return {
           mainLink: '/admin-users',
           mainLabel: 'Wallet Operations',
           description: 'Credit and debit user wallets'
         };
       case 'admin':
         return {
           mainLink: '/admin-users',
           mainLabel: 'Admin Panel',
           description: 'Full administrative access'
         };
       default:
         return {
           mainLink: '/admin-users',
           mainLabel: 'Admin Panel',
           description: 'Administrative access'
         };
     }
   };

   // Check for authentication token on component mount and window focus
   useEffect(() => {
     const checkAuth = () => {
       try {
         const token = localStorage.getItem('igettoken');
         const userData = localStorage.getItem('userData');

         if (token && userData) {
           setUser(JSON.parse(userData));
           fetchUserBalance(token);
           // Fetch fresh user data to get updated role
           fetchUserData(token);
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

     checkAuth();
     window.addEventListener('focus', checkAuth);

     return () => {
       window.removeEventListener('focus', checkAuth);
     };
   }, []);

   // Handle click outside to close menus
   useEffect(() => {
     const handleClickOutside = (event) => {
       // Close services dropdown if click is outside
       if (
         servicesDropdownRef.current && 
         !servicesDropdownRef.current.contains(event.target)
       ) {
         setIsServicesDropdownOpen(false);
       }
     };

     document.addEventListener('mousedown', handleClickOutside);

     return () => {
       document.removeEventListener('mousedown', handleClickOutside);
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

   // Fetch fresh user data from API to get updated role
   const fetchUserData = async (token) => {
     try {
       const response = await fetch('https://iget.onrender.com/api/user', {
         method: 'GET',
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json'
         }
       });

       if (!response.ok) {
         throw new Error('Failed to fetch user data');
       }

       const data = await response.json();

       if (data.success && data.user) {
         // Update localStorage with fresh user data
         localStorage.setItem('userData', JSON.stringify(data.user));
         setUser(data.user);
       }
     } catch (error) {
       console.error('Error fetching fresh user data:', error);
     }
   };

   // Toggle mobile menu
   const toggleMenu = () => {
     setIsMenuOpen(!isMenuOpen);
     // Close services dropdown when main menu is toggled
     setIsServicesDropdownOpen(false);
   };

   // Toggle services dropdown (only used for desktop view now)
   const toggleServicesDropdown = (e) => {
     e.preventDefault();
     e.stopPropagation();
     setIsServicesDropdownOpen(!isServicesDropdownOpen);
   };

   // Handle logout
   const handleLogout = () => {
     localStorage.removeItem('igettoken');
     localStorage.removeItem('userData');
     setUser(null);
     setBalance(null);
     router.push('/Signin');
     // Close menu after logout
     setIsMenuOpen(false);
   };

   // Improved navigation handler for service links - fix for mobile view
   const navigateToService = (service) => {
     // Close menus first
     setIsMenuOpen(false);
     setIsServicesDropdownOpen(false);
     
     // Then navigate programmatically
     router.push(`/${service}`);
   };

   // Handle regular link click to close menus
   const handleLinkClick = () => {
     // Close both menus
     setIsMenuOpen(false);
     setIsServicesDropdownOpen(false);
   };

   // Service types with carrier branding
   const serviceTypes = [
     { key: 'mtn', label: 'MTN', color: '#FFCC00', textColor: '#000' },
     { key: 'at-ishare', label: 'AirtelTigo', color: '#E4002B', textColor: '#fff' },
     { key: 'telecel', label: 'Telecel', color: '#0033A0', textColor: '#fff' },
     { key: 'AfA-registration', label: 'AfA Registration', color: '#6B7280', textColor: '#fff' },
   ];

   // Carrier logo components using official-style SVGs
   const CarrierLogo = ({ service, size = 24 }) => {
     const s = size;
     switch (service.key) {
       case 'mtn':
         return (
           <div className="shrink-0" style={{ width: s, height: s }}>
             <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
               <rect width="100" height="100" rx="16" fill="#FFCC00" />
               <ellipse cx="50" cy="50" rx="38" ry="26" stroke="#000" strokeWidth="4" fill="none" />
               <text x="50" y="57" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="20" fontWeight="900" fill="#000">MTN</text>
             </svg>
           </div>
         );
       case 'at-ishare':
         return (
           <div className="shrink-0" style={{ width: s, height: s }}>
             <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
               <circle cx="50" cy="50" r="48" fill="#0066B3" />
               <circle cx="35" cy="40" r="6" fill="#FFF" />
               <circle cx="65" cy="40" r="6" fill="#FFF" />
               <path d="M30 55 Q50 75 70 55" stroke="#FFF" strokeWidth="6" fill="none" strokeLinecap="round" />
             </svg>
           </div>
         );
       case 'telecel':
         return (
           <div className="shrink-0" style={{ width: s, height: s }}>
             <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
               <rect width="100" height="100" rx="16" fill="#FFF" />
               <circle cx="50" cy="50" r="42" fill="#E30613" />
               <text x="50" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="50" fontWeight="600" fill="#FFF">t</text>
             </svg>
           </div>
         );
       default:
         return (
           <div className="shrink-0 flex items-center justify-center rounded-lg bg-green-500" style={{ width: s, height: s }}>
             <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
               <path d="M21 10.5V19a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h12.5" />
               <path d="M9 11l3 3L22 4" />
             </svg>
           </div>
         );
     }
   };

   return (
     <nav className="bg-gradient-to-r from-gray-900 to-black text-white shadow-2xl sticky top-0 z-50">
       <div className="container mx-auto px-4 lg:px-6">
         <div className="flex justify-between items-center h-16">
           {/* Logo */}
           <div className="flex items-center flex-shrink-0">
             <Link 
               href="/" 
               onClick={handleLinkClick}
               className="flex items-center hover:opacity-80 transition-opacity"
             >
               <div className="relative h-10 w-10 overflow-hidden rounded-lg shadow-md">
                 <Image
                   src={logo}
                   alt="iGet Logo"
                   layout="fill"
                   objectFit="cover"
                   className="rounded-lg"
                   priority
                 />
               </div>
               <span className="ml-3 font-bold text-xl tracking-wide">iGet</span>
             </Link>
           </div>

           {/* Desktop Navigation */}
           <div className="hidden lg:flex items-center space-x-8">
             <Link
               href="/"
               className="hover:text-blue-400 transition-colors duration-200 font-medium"
               onClick={handleLinkClick}
             >
               Home
             </Link>

             {user ? (
               <>
                 <Link
                   href="/api-key"
                   className="hover:text-blue-400 transition-colors duration-200 font-medium"
                   onClick={handleLinkClick}
                 >
                   API Keys
                 </Link>

                 {/* Services Dropdown — only for logged in users */}
                 <div className="relative" ref={servicesDropdownRef}>
                   <button
                     onClick={toggleServicesDropdown}
                     className="flex items-center hover:text-blue-400 transition-colors duration-200 font-medium"
                   >
                     Services
                     <svg
                       className={`w-4 h-4 ml-1 transition-transform duration-200 ${isServicesDropdownOpen ? 'rotate-180' : ''}`}
                       fill="none"
                       stroke="currentColor"
                       viewBox="0 0 24 24"
                     >
                       <path
                         strokeLinecap="round"
                         strokeLinejoin="round"
                         strokeWidth="2"
                         d="M19 9l-7 7-7-7"
                       />
                     </svg>
                   </button>

                   {isServicesDropdownOpen && (
                     <div className="absolute left-0 mt-2 w-56 bg-gray-800 rounded-xl shadow-xl py-1.5 z-20 border border-gray-700">
                       {serviceTypes.map((service, index) => (
                         <button
                           key={index}
                           className="flex items-center gap-3 w-full text-left px-3.5 py-2.5 hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
                           onClick={() => navigateToService(service.key)}
                         >
                           <CarrierLogo service={service} size={18} />
                           {service.label}
                         </button>
                       ))}
                     </div>
                   )}
                 </div>

                 <Link
                   href="/bulk"
                   className="hover:text-blue-400 transition-colors duration-200 font-medium"
                   onClick={handleLinkClick}
                 >
                   Bulk Purchase
                 </Link>
                 <Link 
                   href="/orders" 
                   className="hover:text-blue-400 transition-colors duration-200 font-medium"
                   onClick={handleLinkClick}
                 >
                   My Orders
                 </Link>
                 <Link 
                   href="/api-doc" 
                   className="hover:text-blue-400 transition-colors duration-200 font-medium"
                   onClick={handleLinkClick}
                 >
                   API Docs
                 </Link>

                 {/* Enhanced Admin Access with role-based navigation */}
                 {isAdmin(user.role) && (
                   <div className="flex items-center">
                     <Link 
                       href={getAdminNavigation(user.role).mainLink}
                       className="hover:text-blue-400 transition-colors duration-200 flex items-center font-medium"
                       onClick={handleLinkClick}
                     >
                       <span>{getAdminNavigation(user.role).mainLabel}</span>
                       <span className={`ml-2 px-3 py-1 text-xs rounded-full text-white font-semibold ${getRoleBadgeColor(user.role)} shadow-md`}>
                         {getRoleDisplayName(user.role)}
                       </span>
                     </Link>
                   </div>
                 )}

                 {/* Theme toggle */}
                 {mounted && (
                   <button
                     onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                     className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                     aria-label="Toggle theme"
                   >
                     {resolvedTheme === 'dark' ? (
                       <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                     ) : (
                       <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                     )}
                   </button>
                 )}

                 {/* User Profile Dropdown */}
                 <div className="relative">
                   <button
                     className="flex items-center bg-gray-800 rounded-xl px-4 py-2 hover:bg-gray-700 transition-colors duration-200 border border-gray-600"
                     onClick={toggleMenu}
                   >
                     <div className="flex flex-col items-start mr-3">
                       <span className="max-w-[120px] truncate text-sm font-medium" title={user.username}>
                         {user.username && user.username.includes('@') 
                           ? user.username.split('@')[0] 
                           : user.username}
                       </span>
                       {/* Show role badge under username for admin users */}
                       {isAdmin(user.role) && (
                         <span className={`text-xs px-2 py-0.5 rounded-full text-white mt-1 ${getRoleBadgeColor(user.role)} font-semibold`}>
                           {getRoleDisplayName(user.role)}
                         </span>
                       )}
                     </div>
                     {balance ? (
                       <span className="text-xs bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full px-3 py-1 font-semibold shadow-md">
                         {balance.balance.toFixed(2)} {balance.currency}
                       </span>
                     ) : (
                       <span className="text-xs bg-gray-600 text-white rounded-full px-3 py-1 animate-pulse">
                         Loading...
                       </span>
                     )}
                   </button>

                   {isMenuOpen && (
                     <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl py-2 z-20 border border-gray-700">
                       <Link 
                         href="/api-key" 
                         className="block px-4 py-3 hover:bg-gray-700 transition-colors duration-200 text-sm"
                         onClick={handleLinkClick}
                       >
                         <div className="flex items-center">
                           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                           </svg>
                           API Keys
                         </div>
                       </Link>
                       <hr className="border-gray-700 my-1" />
                       <button 
                         onClick={handleLogout} 
                         className="block w-full text-left px-4 py-3 hover:bg-red-600 transition-colors duration-200 text-sm text-red-400 hover:text-white"
                       >
                         <div className="flex items-center">
                           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                           </svg>
                           Logout
                         </div>
                       </button>
                     </div>
                   )}
                 </div>
               </>
             ) : (
               <div className="flex items-center space-x-4">
                 {/* Theme toggle for guests */}
                 {mounted && (
                   <button
                     onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                     className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                     aria-label="Toggle theme"
                   >
                     {resolvedTheme === 'dark' ? (
                       <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                     ) : (
                       <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                     )}
                   </button>
                 )}
                 <Link
                   href="/Signin"
                   className="hover:text-blue-400 transition-colors duration-200 font-medium"
                   onClick={handleLinkClick}
                 >
                   Login
                 </Link>
                 <Link
                   href="/Signin"
                   className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg"
                   onClick={handleLinkClick}
                 >
                   Register
                 </Link>
               </div>
             )}
           </div>

           {/* Mobile menu button */}
           <div className="lg:hidden">
             <button 
               onClick={toggleMenu} 
               className="text-white focus:outline-none p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
               aria-label="Toggle mobile menu"
             >
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

         {/* Mobile Navigation - slide-in panel */}
         {isMenuOpen && (
           <div className="lg:hidden fixed inset-0 z-50">
             {/* Backdrop */}
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleMenu} />

             {/* Panel */}
             <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-gray-900 shadow-2xl overflow-y-auto">
               {/* Header */}
               <div className="flex items-center justify-between px-5 h-16 border-b border-gray-800">
                 <div className="flex items-center gap-2.5">
                   <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                     <Image src={logo} alt="iGet" fill style={{ objectFit: 'cover' }} />
                   </div>
                   <span className="font-semibold text-white">iGet</span>
                 </div>
                 <div className="flex items-center gap-1">
                   {/* Mobile theme toggle */}
                   {mounted && (
                     <button
                       onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                       className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                       aria-label="Toggle theme"
                     >
                       {resolvedTheme === 'dark' ? (
                         <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                       ) : (
                         <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                       )}
                     </button>
                   )}
                   <button
                     onClick={toggleMenu}
                     className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                     aria-label="Close menu"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 </div>
               </div>

               {/* User card */}
               {user && (
                 <div className="mx-4 mt-4 p-4 rounded-xl bg-gray-800/70 border border-gray-700/50">
                   <div className="flex items-center justify-between">
                     <div className="min-w-0">
                       <p className="text-white font-medium text-sm truncate">{user.username}</p>
                       <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] rounded-full text-white font-medium ${getRoleBadgeColor(user.role)}`}>
                         {getRoleDisplayName(user.role)}
                       </span>
                     </div>
                     {balance && (
                       <div className="text-right shrink-0 ml-3">
                         <p className="text-[10px] text-gray-500 uppercase tracking-wide">Balance</p>
                         <p className="text-green-400 font-semibold text-sm">{balance.balance.toFixed(2)} {balance.currency}</p>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Links */}
               <div className="px-3 pt-4 pb-8">
                 {/* Home — always visible */}
                 <Link
                   href="/"
                   className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                   onClick={handleLinkClick}
                 >
                   <svg className="w-[18px] h-[18px] shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                   </svg>
                   Home
                 </Link>

                 {user ? (
                   <>
                     {/* Services */}
                     <div className="mt-3 mb-1 px-3">
                       <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Services</p>
                     </div>
                     <div className="space-y-0.5">
                       {serviceTypes.map((service, index) => (
                         <button
                           key={index}
                           className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                           onClick={() => navigateToService(service.key)}
                         >
                           <CarrierLogo service={service} size={20} />
                           {service.label}
                         </button>
                       ))}
                     </div>

                     {/* Main nav */}
                     <div className="mt-4 mb-1 px-3">
                       <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Account</p>
                     </div>
                     <div className="space-y-0.5">
                       <Link
                         href="/bulk"
                         className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                         onClick={handleLinkClick}
                       >
                         <svg className="w-[18px] h-[18px] shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                         </svg>
                         Bulk Purchase
                       </Link>

                       <Link
                         href="/orders"
                         className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                         onClick={handleLinkClick}
                       >
                         <svg className="w-[18px] h-[18px] shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                         </svg>
                         My Orders
                       </Link>

                       <Link
                         href="/api-key"
                         className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                         onClick={handleLinkClick}
                       >
                         <svg className="w-[18px] h-[18px] shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                         </svg>
                         API Keys
                       </Link>

                       <Link
                         href="/api-doc"
                         className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                         onClick={handleLinkClick}
                       >
                         <svg className="w-[18px] h-[18px] shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                         </svg>
                         API Docs
                       </Link>
                     </div>

                     {/* Admin section */}
                     {isAdmin(user.role) && (
                       <>
                         <div className="mt-4 mb-1 px-3">
                           <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Admin</p>
                         </div>
                         <Link
                           href={getAdminNavigation(user.role).mainLink}
                           className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                           onClick={handleLinkClick}
                         >
                           <div className="flex items-center gap-3">
                             <svg className="w-[18px] h-[18px] shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                             </svg>
                             {getAdminNavigation(user.role).mainLabel}
                           </div>
                           <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                           </svg>
                         </Link>
                       </>
                     )}

                     {/* Logout */}
                     <div className="mt-6 pt-4 border-t border-gray-800">
                       <button
                         onClick={handleLogout}
                         className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                       >
                         <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                         </svg>
                         Sign out
                       </button>
                     </div>
                   </>
                 ) : (
                   /* Not logged in */
                   <div className="mt-6 space-y-2.5 px-1">
                     <Link
                       href="/Signin"
                       className="flex items-center justify-center py-3 rounded-lg text-sm font-medium text-white border border-gray-700 hover:bg-gray-800 transition-colors"
                       onClick={handleLinkClick}
                     >
                       Sign in
                     </Link>
                     <Link
                       href="/Signin"
                       className="flex items-center justify-center py-3 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                       onClick={handleLinkClick}
                     >
                       Create account
                     </Link>
                   </div>
                 )}
               </div>
             </div>
           </div>
         )}
       </div>
     </nav>
   );
};

export default Navigation;