'use client'
import React, { useState, useEffect, useRef } from 'react';
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

   // Create refs for dropdown containers to detect outside clicks
   const servicesDropdownRef = useRef(null);
   const mobileMenuRef = useRef(null);

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
           <Link 
             href="/" 
             onClick={handleLinkClick}
           >
             <Image
               src={logo}
               alt="iGet Logo"
               width={100}
               height={90}
               className="mr-5"
             />
           </Link>
         </div>

         {/* Desktop Navigation */}
         <div className="hidden md:flex space-x-6 items-center">
           <Link 
             href="/" 
             className="hover:text-gray-300 transition-colors"
             onClick={handleLinkClick}
           >
             Home
           </Link>
           <Link 
             href="/api-key" 
             className="hover:text-gray-300 transition-colors"
             onClick={handleLinkClick}
           >
             API Keys
           </Link>

           {/* Services Dropdown */}
           <div className="relative" ref={servicesDropdownRef}>
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
                   <button
                     key={index}
                     className="block w-full text-left px-4 py-2 hover:bg-gray-700 capitalize"
                     onClick={() => navigateToService(service)}
                   >
                     {service}
                   </button>
                 ))}
               </div>
             )}
           </div>

           {user ? (
             <>
               <Link 
                 href="/orders" 
                 className="hover:text-gray-300 transition-colors"
                 onClick={handleLinkClick}
               >
                 My Orders
               </Link>
               <Link 
                 href="/api-doc" 
                 className="hover:text-gray-300 transition-colors"
                 onClick={handleLinkClick}
               >
                 API Documentation
               </Link>

               {user.role === 'admin' && (
                 <>
                   <Link 
                     href="/admin-users" 
                     className="hover:text-gray-300 transition-colors"
                     onClick={handleLinkClick}
                   >
                     Admin
                   </Link>
                   <Link 
                     href="/admin-orders" 
                     className="hover:text-gray-300 transition-colors"
                     onClick={handleLinkClick}
                   >
                     Transactions
                   </Link>
                 </>
               )}

               <div className="relative">
                 <button
                   className="flex items-center bg-gray-800 rounded-full px-4 py-2 hover:bg-gray-700"
                   onClick={toggleMenu}
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
                     <Link 
                       href="/api-key" 
                       className="block px-4 py-2 hover:bg-gray-700"
                       onClick={handleLinkClick}
                     >
                       API Keys
                     </Link>
                     <button 
                       onClick={handleLogout} 
                       className="block w-full text-left px-4 py-2 hover:bg-gray-700"
                     >
                       Logout
                     </button>
                   </div>
                 )}
               </div>
             </>
           ) : (
             <>
               <Link 
                 href="/Signin" 
                 className="hover:text-gray-300 transition-colors"
                 onClick={handleLinkClick}
               >
                 Login
               </Link>
               <Link 
                 href="/Signin" 
                 className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
                 onClick={handleLinkClick}
               >
                 Register
               </Link>
             </>
           )}
         </div>

         {/* Mobile menu button */}
         <div className="md:hidden">
           <button 
             onClick={toggleMenu} 
             className="text-white focus:outline-none"
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

         {/* Mobile Navigation */}
         {isMenuOpen && (
           <div 
             ref={mobileMenuRef}
             className="fixed inset-0 bg-black z-50 md:hidden"
           >
             <div className="p-4">
               {/* Close button */}
               <button 
                 onClick={toggleMenu}
                 className="absolute top-4 right-4 text-white"
                 aria-label="Close mobile menu"
               >
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>

               {/* Mobile Menu Content */}
               <div className="space-y-4 mt-12">
                 <Link 
                   href="/" 
                   className="block px-4 py-2 text-white hover:bg-gray-800"
                   onClick={handleLinkClick}
                 >
                   Home
                 </Link>

                 {/* Services Section for Mobile - Always visible */}
                 <div>
                   <div className="px-4 py-2 text-white font-medium border-b border-gray-700 mb-2">
                     Services
                   </div>
                   <div className="pl-4 space-y-2">
                     {serviceTypes.map((service, index) => (
                       <button
                         key={index}
                         className="block w-full text-left px-4 py-2 text-white hover:bg-gray-800 capitalize"
                         onClick={() => navigateToService(service)}
                       >
                         {service}
                       </button>
                     ))}
                   </div>
                 </div>

                 {user ? (
                   <>
                     <Link 
                       href="/orders" 
                       className="block px-4 py-2 text-white hover:bg-gray-800"
                       onClick={handleLinkClick}
                     >
                       My Orders
                     </Link>
                     <Link 
                       href="/api-doc" 
                       className="block px-4 py-2 text-white hover:bg-gray-800"
                       onClick={handleLinkClick}
                     >
                       API Documentation
                     </Link>

                     {user.role === 'admin' && (
                       <>
                         <Link 
                           href="/admin-users" 
                           className="block px-4 py-2 text-white hover:bg-gray-800"
                           onClick={handleLinkClick}
                         >
                           Admin
                         </Link>
                         <Link 
                           href="/admin-orders" 
                           className="block px-4 py-2 text-white hover:bg-gray-800"
                           onClick={handleLinkClick}
                         >
                           Transactions
                         </Link>
                       </>
                     )}

                     {balance && (
                       <div className="px-4 py-2 text-white">
                         Balance: {balance.balance.toFixed(2)} {balance.currency}
                       </div>
                     )}

                     <Link 
                       href="/api-key" 
                       className="block px-4 py-2 text-white hover:bg-gray-800"
                       onClick={handleLinkClick}
                     >
                       API Keys
                     </Link>

                     <button 
                       onClick={handleLogout} 
                       className="w-full text-left px-4 py-2 text-white hover:bg-gray-800"
                     >
                       Logout
                     </button>
                   </>
                 ) : (
                   <>
                     <Link 
                       href="/Signin" 
                       className="block px-4 py-2 text-white hover:bg-gray-800"
                       onClick={handleLinkClick}
                     >
                       Login
                     </Link>
                     <Link 
                       href="/Signin" 
                       className="block px-4 py-2 text-white bg-blue-600 hover:bg-blue-700"
                       onClick={handleLinkClick}
                     >
                       Register
                     </Link>
                   </>
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