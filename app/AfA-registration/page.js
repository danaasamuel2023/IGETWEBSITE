// pages/register.js
'use client'
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Check, Moon, Sun, CreditCard, User, Phone, Calendar, Briefcase, MapPin, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    idType: '',
    idNumber: '',
    dateOfBirth: '',
    occupation: '',
    location: '',
    price: 1
  });
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('igettoken');
    if (!token) {
      setError('You need to login first');
      return;
    }
    
    // Get user data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Check for dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    setDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: name === 'price' ? parseFloat(value) : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(null);
    
    try {
      const token = localStorage.getItem('igettoken');
      if (!token) {
        setError('Authentication token not found');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/afa/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('igettoken')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.data);
        
        // Update user data in localStorage without showing balance
        if (user) {
          const updatedUser = {...user};
          if (updatedUser.wallet) {
            updatedUser.wallet.balance = data.data.walletBalance;
          }
          localStorage.setItem('userData', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setSuccess(null);
    setFormData({
      fullName: '',
      phoneNumber: '',
      idType: '',
      idNumber: '',
      dateOfBirth: '',
      occupation: '',
      location: '',
      price: 20
    });
  };
  
  return (
    <div className={darkMode ? 'dark' : ''}>
      <Head>
        <title>AFA Registration</title>
        <meta name="description" content="AFA Registration Form" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="container mx-auto px-4 py-8">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">AFA Registration</h1>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </header>

          {!success ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6">New AFA Registration</h2>
              
              {error && (
                <div className="mb-6 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block mb-2 font-medium">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        id="fullName" 
                        name="fullName" 
                        className="pl-10 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600" 
                        value={formData.fullName}
                        onChange={handleChange}
                        required 
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phoneNumber" className="block mb-2 font-medium">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input 
                        type="tel" 
                        id="phoneNumber" 
                        name="phoneNumber" 
                        className="pl-10 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600" 
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required 
                        placeholder="e.g. 0200000000"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="idType" className="block mb-2 font-medium">
                      ID Type
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <select 
                        id="idType" 
                        name="idType" 
                        className="pl-10 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600" 
                        value={formData.idType}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select ID Type</option>
                        <option value="Ghana Card">Ghana Card</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Passport">Passport</option>
                        <option value="Driver License">Driver License</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="idNumber" className="block mb-2 font-medium">
                      ID Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        id="idNumber" 
                        name="idNumber" 
                        className="pl-10 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600" 
                        value={formData.idNumber}
                        onChange={handleChange}
                        required 
                        placeholder="Enter ID number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="dateOfBirth" className="block mb-2 font-medium">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input 
                        type="date" 
                        id="dateOfBirth" 
                        name="dateOfBirth" 
                        className="pl-10 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600" 
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="occupation" className="block mb-2 font-medium">
                      Occupation
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        id="occupation" 
                        name="occupation" 
                        className="pl-10 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600" 
                        value={formData.occupation}
                        onChange={handleChange}
                        required 
                        placeholder="Enter occupation"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block mb-2 font-medium">
                      Location
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        id="location" 
                        name="location" 
                        className="pl-10 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600" 
                        value={formData.location}
                        onChange={handleChange}
                        required 
                        placeholder="Enter location"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block mb-2 font-medium">
                      Price (GHS)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <input 
                        type="number" 
                        id="price" 
                        name="price" 
                        className="pl-10 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-600" 
                        value={formData.price}
                        onChange={handleChange}
                        required 
                        min="1" 
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full mt-8 px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors duration-200 flex justify-center items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Submit Registration'
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Registration Successful!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Your AFA registration has been completed successfully.</p>
                
                <div className="w-full max-w-md bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-medium mb-4 text-left">Registration Details</h3>
                  <div className="grid grid-cols-2 gap-y-3">
                    <div className="text-left text-gray-600 dark:text-gray-400">Full Name:</div>
                    <div className="text-right font-medium">{success.registration.fullName}</div>
                    
                    <div className="text-left text-gray-600 dark:text-gray-400">Phone Number:</div>
                    <div className="text-right font-medium">{success.order.recipientNumber}</div>
                    
                    <div className="text-left text-gray-600 dark:text-gray-400">Capacity:</div>
                    <div className="text-right font-medium">{success.registration.capacity}</div>
                    
                    <div className="text-left text-gray-600 dark:text-gray-400">Amount Paid:</div>
                    <div className="text-right font-medium">GHS {success.order.price.toFixed(2)}</div>
                    
                    <div className="text-left text-gray-600 dark:text-gray-400">Reference:</div>
                    <div className="text-right font-medium text-sm">{success.order.orderReference}</div>
                  </div>
                </div>
                
                <button 
                  onClick={resetForm} 
                  className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  New Registration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}