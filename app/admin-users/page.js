// pages/admin/users/index.js
'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '@/components/adminWraper';

// Authentication wrapper component

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newRole, setNewRole] = useState('user');
  
  const router = useRouter();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('igettoken')}`
        }
      });
      
      // Log the response to inspect its structure
      console.log('API Response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Is array:', Array.isArray(response.data));
      
      // Check if response.data itself is an array
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } 
      // Check if response.data has a users property that is an array
      else if (response.data && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      }
      // Check if response.data has a data property that is an array (common API pattern)
      else if (response.data && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      }
      // If we can't determine the structure, set an empty array
      else {
        console.error('Unexpected API response format:', response.data);
        setUsers([]);
      }
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
      setUsers([]); // Ensure users is an array even in error case
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, user) => {
    setSelectedUser(user);
    setModalType(type);
    setShowModal(true);
    
    if (type === 'changeRole') {
      setNewRole(user.role);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setDepositAmount('');
    setDepositDescription('');
    setModalType('');
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${selectedUser._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('igettoken')}`
        }
      });
      setUsers(users.filter(user => user._id !== selectedUser._id));
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  const handleToggleUserStatus = async () => {
    try {
      const response = await axios.patch(`http://localhost:5000/api/admin/users/${selectedUser._id}/status`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('igettoken')}`
        }
      });
      
      setUsers(users.map(user => 
        user._id === selectedUser._id ? { ...user, isActive: !user.isActive } : user
      ));
      
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status');
      console.error('Error updating user status:', err);
    }
  };

  const handleDeleteApiKey = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${selectedUser._id}/api-key`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('igettoken')}`
        }
      });
      
      setUsers(users.map(user => 
        user._id === selectedUser._id ? { ...user, apiKey: undefined } : user
      ));
      
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete API key');
      console.error('Error deleting API key:', err);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    
    if (!depositAmount || isNaN(depositAmount) || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      const response = await axios.post(`http://localhost:5000/api/admin/users/${selectedUser._id}/wallet/deposit`, {
        amount: parseFloat(depositAmount),
        description: depositDescription
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('igettoken')}`
        }
      });
      
      // Update the user's wallet balance in the UI
      setUsers(users.map(user => 
        user._id === selectedUser._id 
          ? { ...user, wallet: { ...user.wallet, balance: user.wallet.balance + parseFloat(depositAmount) } } 
          : user
      ));
      
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add funds');
      console.error('Error adding funds:', err);
    }
  };

  const handleChangeRole = async () => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/users/${selectedUser._id}/role`, {
        role: newRole
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('igettoken')}`
        }
      });
      
      setUsers(users.map(user => 
        user._id === selectedUser._id ? { ...user, role: newRole } : user
      ));
      
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change user role');
      console.error('Error changing role:', err);
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      (user.phone && user.phone.toLowerCase().includes(query))
    );
  });

  return (
    <AdminLayout>
      <Head>
        <title>User Management | Admin Dashboard</title>
      </Head>
      
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 sm:mb-0">User Management</h1>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-4 py-2 border rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'agent' ? 'bg-green-100 text-green-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.wallet?.balance.toFixed(2)} {user.wallet?.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button 
                            onClick={() => handleOpenModal('deposit', user)}
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded">
                            Add Funds
                          </button>
                          <button 
                            onClick={() => handleOpenModal('changeRole', user)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded">
                            Change Role
                          </button>
                          <button 
                            onClick={() => handleOpenModal('toggleStatus', user)}
                            className={`${user.isActive ? 'text-orange-600 hover:text-orange-900 bg-orange-50' : 'text-green-600 hover:text-green-900 bg-green-50'} px-2 py-1 rounded`}>
                            {user.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button 
                            onClick={() => handleOpenModal('deleteApiKey', user)}
                            className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 px-2 py-1 rounded">
                            Delete API Key
                          </button>
                          <button 
                            onClick={() => handleOpenModal('deleteUser', user)}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  {modalType === 'deleteUser' && (
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Delete User</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete the user "{selectedUser.username}"? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  )}

                  {modalType === 'toggleStatus' && (
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {selectedUser.isActive ? 'Disable' : 'Enable'} User
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to {selectedUser.isActive ? 'disable' : 'enable'} the user "{selectedUser.username}"?
                        </p>
                      </div>
                    </div>
                  )}

{modalType === 'deleteApiKey' && (
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Delete API Key</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete the API key for user "{selectedUser.username}"? This will revoke API access.
                        </p>
                      </div>
                    </div>
                  )}

                  {modalType === 'deposit' && (
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Add Funds to Wallet</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4">
                          Add funds to {selectedUser.username}'s wallet.
                        </p>
                        <form onSubmit={handleDeposit}>
                          <div className="mb-4">
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount ({selectedUser.wallet?.currency})</label>
                            <input
                              type="number"
                              step="0.01"
                              id="amount"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="0.00"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              required
                            />
                          </div>
                          <div className="mb-4">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                            <input
                              type="text"
                              id="description"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="Funds added by admin"
                              value={depositDescription}
                              onChange={(e) => setDepositDescription(e.target.value)}
                            />
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {modalType === 'changeRole' && (
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Change User Role</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4">
                          Change role for user "{selectedUser.username}".
                        </p>
                        <div className="mb-4">
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                          <select
                            id="role"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="agent">Agent</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {modalType === 'deleteUser' && (
                  <>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleDeleteUser}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {modalType === 'toggleStatus' && (
                  <>
                    <button
                      type="button"
                      className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${selectedUser.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm`}
                      onClick={handleToggleUserStatus}
                    >
                      {selectedUser.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {modalType === 'deleteApiKey' && (
                  <>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleDeleteApiKey}
                    >
                      Delete API Key
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {modalType === 'deposit' && (
                  <>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleDeposit}
                    >
                      Add Funds
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {modalType === 'changeRole' && (
                  <>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleChangeRole}
                    >
                      Change Role
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}