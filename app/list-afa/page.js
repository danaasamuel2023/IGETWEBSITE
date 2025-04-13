// pages/admin/afa-registrations.js
'use client'
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/adminWraper';
import axios from 'axios';
import { format } from 'date-fns';
import { Search, Download, Filter, ChevronDown, ChevronUp, User, Calendar, MapPin, CreditCard, Phone, FileText, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AFARegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Fetch AFA registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('igettoken');
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }
        
        const response = await axios.get('http://localhost:5000/api/afa/registrations', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setRegistrations(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch registrations');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'An error occurred');
        console.error('Error fetching AFA registrations:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRegistrations();
  }, []);
  
  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Filter and sort registrations
  const filteredAndSortedRegistrations = [...registrations]
    .filter(reg => {
      // Apply status filter
      if (filterStatus !== 'all' && reg.status !== filterStatus) {
        return false;
      }
      
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          reg.orderReference.toLowerCase().includes(searchLower) ||
          reg.phoneNumber.toLowerCase().includes(searchLower) ||
          (reg.metadata?.fullName && reg.metadata.fullName.toLowerCase().includes(searchLower)) ||
          (reg.metadata?.idNumber && reg.metadata.idNumber.toLowerCase().includes(searchLower)) ||
          (reg.metadata?.location && reg.metadata.location.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Handle sorting
      if (sortField === 'createdAt') {
        return sortDirection === 'asc'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      
      if (sortField === 'price') {
        return sortDirection === 'asc'
          ? a.price - b.price
          : b.price - a.price;
      }
      
      if (sortField === 'capacity') {
        return sortDirection === 'asc'
          ? a.capacity - b.capacity
          : b.capacity - a.capacity;
      }
      
      if (sortField === 'fullName') {
        const nameA = (a.metadata?.fullName || '').toLowerCase();
        const nameB = (b.metadata?.fullName || '').toLowerCase();
        return sortDirection === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
      
      return 0;
    });
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Export to CSV
  const exportToCSV = () => {
    // Headers for CSV
    const headers = [
      'Reference',
      'Full Name',
      'Phone Number',
      'ID Type',
      'ID Number',
      'Date of Birth',
      'Occupation',
      'Location',
      'Capacity',
      'Price',
      'Status',
      'Date'
    ].join(',');
    
    // Map registrations to CSV rows
    const csvRows = filteredAndSortedRegistrations.map(reg => {
      const dob = reg.metadata?.dateOfBirth 
        ? format(new Date(reg.metadata.dateOfBirth), 'yyyy-MM-dd')
        : 'N/A';
        
      return [
        reg.orderReference,
        reg.metadata?.fullName || 'N/A',
        reg.phoneNumber,
        reg.metadata?.idType || 'N/A',
        reg.metadata?.idNumber || 'N/A',
        dob,
        reg.metadata?.occupation || 'N/A',
        reg.metadata?.location || 'N/A',
        reg.capacity,
        reg.price,
        reg.status,
        format(new Date(reg.createdAt), 'yyyy-MM-dd HH:mm:ss')
      ].map(value => `"${value}"`).join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers, ...csvRows].join('\n');
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `afa-registrations-${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Status badge component
  const StatusBadge = ({ status }) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    
    if (status === 'completed') {
      bgColor = 'bg-green-100 text-green-800';
    } else if (status === 'pending') {
      bgColor = 'bg-yellow-100 text-yellow-800';
    } else if (status === 'failed') {
      bgColor = 'bg-red-100 text-red-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">
            AFA Registrations
          </h1>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
        
        {/* Filters and search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search by name, phone, ID, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="text-sm text-gray-500 mb-4">
              Showing {filteredAndSortedRegistrations.length} registrations
              {searchTerm && ' matching your search'}
              {filterStatus !== 'all' && ` with status: ${filterStatus}`}
            </div>
            
            {/* Table */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('fullName')}
                      >
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Customer Details
                          {sortField === 'fullName' && (
                            sortDirection === 'asc' ? 
                            <ChevronUp className="h-4 w-4 ml-1" /> : 
                            <ChevronDown className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </th>
                      
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('capacity')}
                      >
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          Registration Details
                          {sortField === 'capacity' && (
                            sortDirection === 'asc' ? 
                            <ChevronUp className="h-4 w-4 ml-1" /> : 
                            <ChevronDown className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </th>
                      
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-1" />
                          Payment
                          {sortField === 'price' && (
                            sortDirection === 'asc' ? 
                            <ChevronUp className="h-4 w-4 ml-1" /> : 
                            <ChevronDown className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </th>
                      
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Date
                          {sortField === 'createdAt' && (
                            sortDirection === 'asc' ? 
                            <ChevronUp className="h-4 w-4 ml-1" /> : 
                            <ChevronDown className="h-4 w-4 ml-1" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-sm text-gray-500">
                          No registrations found
                          {searchTerm && ' matching your search'}
                          {filterStatus !== 'all' && ` with status: ${filterStatus}`}
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {reg.metadata?.fullName || 'N/A'}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Phone className="h-4 w-4 mr-1" />
                              {reg.phoneNumber}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {reg.metadata?.location || 'N/A'}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <span className="font-medium">Order Ref:</span> {reg.orderReference}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              <span className="font-medium">ID:</span> {reg.metadata?.idType || 'N/A'} - {reg.metadata?.idNumber || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              <span className="font-medium">Capacity:</span> {reg.capacity}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              <span className="font-medium">Status:</span> <StatusBadge status={reg.status} />
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              GHS {reg.price.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Paid from wallet
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(reg.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}