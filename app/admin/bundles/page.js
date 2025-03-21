'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import AdminLayout from '@/components/adminWraper';
const BundleManagement = () => {
  const router = useRouter();
  const [bundles, setBundles] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Track which bundle is being edited
  const [editingBundle, setEditingBundle] = useState(null);
  
  // Form states
  const [bulkUpdateData, setBulkUpdateData] = useState({
    price: '',
    capacity: ''
  });
  
  const [newBundle, setNewBundle] = useState({
    type: '',
    price: '',
    capacity: ''
  });
  
  // State for individual bundle edits
  const [bundleEdit, setBundleEdit] = useState({
    price: '',
    capacity: ''
  });
  
  const bundleTypes = [
    'mtnup2u',
    'mtn-fibre',
    'mtn-justforu',
    'AT-ishare',
    'Telecel-5959',
    'AfA-registration',
    'other'
  ];

  // Fetch bundles by type
  const fetchBundles = async (type) => {
    if (!type) return;
    
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('igettoken');
      const response = await axios.get(`http://localhost:5000/api/iget/bundle/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBundles(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bundles');
    } finally {
      setLoading(false);
    }
  };

  // Handle type selection
  const handleTypeChange = (e) => {
    const type = e.target.value;
    setSelectedType(type);
    setEditingBundle(null); // Reset editing state when changing type
    if (type) {
      fetchBundles(type);
    } else {
      setBundles([]);
    }
  };

  // Handle bulk update form changes
  const handleBulkUpdateChange = (e) => {
    const { name, value } = e.target;
    setBulkUpdateData({
      ...bulkUpdateData,
      [name]: value
    });
  };

  // Handle new bundle form changes
  const handleNewBundleChange = (e) => {
    const { name, value } = e.target;
    setNewBundle({
      ...newBundle,
      [name]: value
    });
  };
  
  // Handle individual bundle edit form changes
  const handleBundleEditChange = (e) => {
    const { name, value } = e.target;
    setBundleEdit({
      ...bundleEdit,
      [name]: value
    });
  };
  
  // Start editing a specific bundle
  const startEditing = (bundle) => {
    setEditingBundle(bundle._id);
    setBundleEdit({
      price: bundle.price,
      capacity: bundle.capacity
    });
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingBundle(null);
    setBundleEdit({
      price: '',
      capacity: ''
    });
  };
  
  // Save individual bundle edit
  const saveBundle = async (id) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('igettoken');
      await axios.put(`http://localhost:5000/api/iget/${id}`, bundleEdit, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Bundle updated successfully');
      fetchBundles(selectedType); // Refresh the list
      setEditingBundle(null); // Exit edit mode
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update bundle');
    } finally {
      setLoading(false);
    }
  };

  // Submit bulk update
  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    if (!selectedType) {
      setError('Please select a bundle type');
      return;
    }

    // Filter out empty fields
    const updateData = Object.keys(bulkUpdateData).reduce((acc, key) => {
      if (bulkUpdateData[key] !== '') {
        acc[key] = bulkUpdateData[key];
      }
      return acc;
    }, {});

    if (Object.keys(updateData).length === 0) {
      setError('Please provide at least one field to update');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('igettoken');
      const response = await axios.put(`http://localhost:5000/api/iget/type/${selectedType}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`Successfully updated ${response.data.modifiedCount} bundles`);
      fetchBundles(selectedType); // Refresh the list
      setBulkUpdateData({ price: '', capacity: '' }); // Reset form
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update bundles');
    } finally {
      setLoading(false);
    }
  };

  // Submit new bundle
  const handleAddBundle = async (e) => {
    e.preventDefault();
    
    if (!newBundle.type || !newBundle.price || !newBundle.capacity) {
      setError('All fields are required for a new bundle');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('igettoken');
      await axios.post('http://localhost:5000/api/iget/addbundle', newBundle, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Bundle added successfully');
      if (newBundle.type === selectedType) {
        fetchBundles(selectedType); // Refresh if we're on the same type
      }
      setNewBundle({ type: '', price: '', capacity: '' }); // Reset form
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add bundle');
    } finally {
      setLoading(false);
    }
  };

  // Delete/deactivate bundle
  const handleDeactivateBundle = async (id) => {
    if (!confirm('Are you sure you want to deactivate this bundle?')) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('igettoken');
      await axios.delete(`http://localhost:5000/api/iget/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Bundle deactivated successfully');
      fetchBundles(selectedType); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate bundle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Bundle Management</h1>
      
      {/* Alert Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div>
          {/* Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Bundle Type
            </label>
            <select
              value={selectedType}
              onChange={handleTypeChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Select a type</option>
              {bundleTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Bulk Update Form */}
          <div className="bg-white shadow-md rounded p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Bulk Update {selectedType} Bundles</h2>
            <form onSubmit={handleBulkUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (leave empty to keep current)
                </label>
                <input
                  type="number"
                  name="price"
                  value={bulkUpdateData.price}
                  onChange={handleBulkUpdateChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (leave empty to keep current)
                </label>
                <input
                  type="text"
                  name="capacity"
                  value={bulkUpdateData.capacity}
                  onChange={handleBulkUpdateChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="e.g. 5GB"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !selectedType}
                className={`w-full py-2 px-4 rounded font-medium ${
                  loading || !selectedType
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Processing...' : 'Update All Bundles'}
              </button>
            </form>
          </div>
          
          {/* Add New Bundle Form */}
          <div className="bg-white shadow-md rounded p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Bundle</h2>
            <form onSubmit={handleAddBundle}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bundle Type
                </label>
                <select
                  name="type"
                  value={newBundle.type}
                  onChange={handleNewBundleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select a type</option>
                  {bundleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  name="price"
                  value={newBundle.price}
                  onChange={handleNewBundleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="text"
                  name="capacity"
                  value={newBundle.capacity}
                  onChange={handleNewBundleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="e.g. 5GB"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded font-medium ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? 'Processing...' : 'Add Bundle'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Right Column - Bundle List */}
        <div>
          <div className="bg-white shadow-md rounded p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedType ? `${selectedType} Bundles` : 'Select a bundle type'}
            </h2>
            
            {loading && <p className="text-gray-500">Loading bundles...</p>}
            
            {!loading && bundles.length === 0 && selectedType && (
              <p className="text-gray-500">No active bundles found for this type.</p>
            )}
            
            {!loading && bundles.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Capacity</th>
                      <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left">Price</th>
                      <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundles.map((bundle) => (
                      <tr key={bundle._id}>
                        {editingBundle === bundle._id ? (
                          // Edit mod
                          <>
                            <td className="py-2 px-4 border-b border-gray-200">
                              <input
                                type="text"
                                name="capacity"
                                value={bundleEdit.capacity}
                                onChange={handleBundleEditChange}
                                className="w-full border border-gray-300 rounded px-2 py-1"
                                placeholder="e.g. 5GB"
                              />
                            </td>
                            <td className="py-2 px-4 border-b border-gray-200">
                              <input
                                type="number"
                                name="price"
                                value={bundleEdit.price}
                                onChange={handleBundleEditChange}
                                className="w-full border border-gray-300 rounded px-2 py-1"
                                step="0.01"
                                min="0"
                              />
                            </td>
                            <td className="py-2 px-4 border-b border-gray-200 text-center">
                              <button
                                onClick={() => saveBundle(bundle._id)}
                                className="text-green-600 hover:text-green-800 mr-2"
                                disabled={loading}
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="text-gray-600 hover:text-gray-800"
                                disabled={loading}
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          // Display mode
                          <>
                            <td className="py-2 px-4 border-b border-gray-200">{bundle.capacity}</td>
                            <td className="py-2 px-4 border-b border-gray-200">{bundle.price}</td>
                            <td className="py-2 px-4 border-b border-gray-200 text-center">
                              <button
                                onClick={() => startEditing(bundle)}
                                className="text-blue-600 hover:text-blue-800 mr-2"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeactivateBundle(bundle._id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Deactivat
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};


export default BundleManagement;