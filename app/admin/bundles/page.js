'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/adminWraper';

const BundleManagement = () => {
  const [bundles, setBundles] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingBundle, setEditingBundle] = useState(null);
  
  // Form states
  const [bundleForm, setBundleForm] = useState({
    type: '',
    price: '',
    capacity: ''
  });
  
  const bundleTypes = [
    'mtnup2u',
    'mtn-justforu',
    'AT-ishare',
    'Telecel-5959',
    'AfA-registration',
  ];

  // Fetch bundles by type
  const fetchBundles = async (type) => {
    if (!type) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('igettoken');
      const response = await axios.get(`https://iget.onrender.com/api/iget/bundle/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBundles(response.data.data);
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to fetch bundles');
    } finally {
      setLoading(false);
    }
  };

  // Handle type selection
  const handleTypeChange = (e) => {
    const type = e.target.value;
    setSelectedType(type);
    setEditingBundle(null);
    setBundleForm({ ...bundleForm, type });
    if (type) {
      fetchBundles(type);
    } else {
      setBundles([]);
    }
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setBundleForm({
      ...bundleForm,
      [name]: value
    });
  };
  
  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };
  
  // Start editing a bundle
  const startEditing = (bundle) => {
    setEditingBundle(bundle._id);
    setBundleForm({
      type: selectedType,
      price: bundle.price,
      capacity: bundle.capacity
    });
  };
  
  // Save bundle (new or edit)
  const saveBundle = async (e) => {
    e.preventDefault();
    
    if (!bundleForm.type || !bundleForm.price || !bundleForm.capacity) {
      showMessage('error', 'All fields are required');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('igettoken');
      
      if (editingBundle) {
        // Update existing bundle
        await axios.put(`https://iget.onrender.com/api/iget/${editingBundle}`, {
          price: bundleForm.price,
          capacity: bundleForm.capacity
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showMessage('success', 'Bundle updated successfully');
      } else {
        // Add new bundle
        await axios.post('https://iget.onrender.com/api/iget/addbundle', bundleForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showMessage('success', 'Bundle added successfully');
      }
      
      // Reset and refresh
      setEditingBundle(null);
      setBundleForm({ type: selectedType, price: '', capacity: '' });
      fetchBundles(selectedType);
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Delete bundle
  const deleteBundle = async (id) => {
    if (!confirm('Are you sure you want to deactivate this bundle?')) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('igettoken');
      await axios.delete(`https://iget.onrender.com/api/iget/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showMessage('success', 'Bundle deactivated successfully');
      fetchBundles(selectedType);
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to deactivate bundle');
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel editing
  const cancelEdit = () => {
    setEditingBundle(null);
    setBundleForm({ type: selectedType, price: '', capacity: '' });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Bundle Management</h1>
        
        {/* Alert Message */}
        {message.text && (
          <div className={`p-3 mb-4 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Bundle Form */}
          <div className="bg-white p-4 rounded shadow">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Bundle Type</label>
              <select
                value={selectedType}
                onChange={handleTypeChange}
                className="w-full border rounded p-2"
              >
                <option value="">Select a type</option>
                {bundleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <form onSubmit={saveBundle} className="mt-4">
              <h2 className="text-lg font-medium mb-3">
                {editingBundle ? 'Edit Bundle' : 'Add New Bundle'}
              </h2>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  name="price"
                  value={bundleForm.price}
                  onChange={handleFormChange}
                  className="w-full border rounded p-2"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input
                  type="text"
                  name="capacity"
                  value={bundleForm.capacity}
                  onChange={handleFormChange}
                  className="w-full border rounded p-2"
                  placeholder="e.g. 5000MB"
                  required
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading || !selectedType}
                  className={`px-4 py-2 rounded ${loading || !selectedType ? 'bg-gray-300' : 'bg-blue-600 text-white'}`}
                >
                  {loading ? 'Processing...' : editingBundle ? 'Update Bundle' : 'Add Bundle'}
                </button>
                
                {editingBundle && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          
          {/* Right Column - Bundle List */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-medium mb-3">
              {selectedType ? `${selectedType} Bundles` : 'Select a bundle type'}
            </h2>
            
            {loading && <p className="text-gray-500">Loading...</p>}
            
            {!loading && bundles.length === 0 && selectedType && (
              <p className="text-gray-500">No active bundles found.</p>
            )}
            
            {!loading && bundles.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 text-left">Capacity</th>
                      <th className="p-2 text-left">Price</th>
                      <th className="p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundles.map((bundle) => (
                      <tr key={bundle._id} className="border-t">
                        <td className="p-2">{bundle.capacity}</td>
                        <td className="p-2">{bundle.price}</td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => startEditing(bundle)}
                            className="text-blue-600 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteBundle(bundle._id)}
                            className="text-red-600"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BundleManagement;