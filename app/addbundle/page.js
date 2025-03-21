'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddBundlePage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    price: '',
    type: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  // Bundle types from schema
  const bundleTypes = [
    'mtnup2u', 
    'mtn-fibre', 
    'mtn-justforu', 
    'AT-ishare', 
    'Telecel-5959', 
    'AfA-registration', 
    'other'
  ];

  // Check system preference for dark mode
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      // Get token from local storage
      const token = localStorage.getItem('igettoken');
      
      if (!token) {
        setMessage({ text: 'Authentication required. Please login.', isError: true });
        setLoading(false);
        return;
      }

      // Send request to create bundle
      const response = await axios.post(
        'http://localhost:5000/api/iget/addbundle',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Success - clear form and show message
      setFormData({
        name: '',
        capacity: '',
        price: '',
        type: ''
      });
      setMessage({ text: 'Bundle added successfully!', isError: false });
    } catch (error) {
      // Handle error
      setMessage({ 
        text: error.response?.data?.message || 'Failed to add bundle. Please try again.', 
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className={`flex justify-between items-center mb-6`}>
          <h1 className="text-2xl font-bold">Add New Bundle</h1>
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
        </div>

        <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {message.text && (
            <div className={`p-4 mb-4 rounded ${message.isError ? 'bg-red-500/20 text-red-700' : 'bg-green-500/20 text-green-700'}`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2" htmlFor="name">Bundle Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2" htmlFor="capacity">Capacity (MB)</label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2" htmlFor="price">Price</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2" htmlFor="type">Bundle Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              >
                <option value="">Select Bundle Type</option>
                {bundleTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full p-2 rounded font-bold ${darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'} 
                disabled:opacity-50`}
            >
              {loading ? 'Adding...' : 'Add Bundle'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBundlePage;