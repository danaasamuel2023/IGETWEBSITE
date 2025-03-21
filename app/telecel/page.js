'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TelecelBundleCards = () => {
  const [bundles, setBundles] = useState([]);
  const [filteredBundles, setFilteredBundles] = useState([]);
  const [selectedBundleIndex, setSelectedBundleIndex] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [processingOrder, setProcessingOrder] = useState(false);

  // Fetch bundles from API
  useEffect(() => {
    const fetchBundles = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:5000/api/iget/bundle');
        // Filter for Telecel bundles only
        const telecelBundles = response.data.data.filter(bundle => 
          bundle.network === 'telecel' || bundle.type === 'Telecel-5959');
        setBundles(telecelBundles);
        setFilteredBundles(telecelBundles);
      } catch (err) {
        console.error('Failed to fetch bundles:', err);
        setMessage({ text: 'Failed to load bundles. Please try again later.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBundles();
  }, []);

  // Telecel Logo SVG
  const TelecelLogo = () => (
    <svg width="80" height="80" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="85" fill="#e30613" stroke="#fff" strokeWidth="2"/>
      <text x="100" y="115" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="24" fill="white">TELECEL</text>
      <text x="100" y="140" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="20" fill="white">5959</text>
    </svg>
  );

  const handleSelectBundle = (index) => {
    setSelectedBundleIndex(index === selectedBundleIndex ? null : index);
    setPhoneNumber('');
    setMessage({ text: '', type: '' });
  };

  const validatePhoneNumber = (number) => {
    // Basic Telecel Ghana number validation (starts with 027, 057, or 026)
    const pattern = /^(027|057|026)\d{7}$/;
    return pattern.test(number);
  };

  const handlePurchase = async (bundle) => {
    // Reset message state
    setMessage({ text: '', type: '' });
    
    // Validate phone number
    if (!phoneNumber) {
      setMessage({ text: 'Please enter a phone number', type: 'error' });
      return;
    }
    
    // if (!validatePhoneNumber(phoneNumber)) {
    //   setMessage({ text: 'Please enter a valid Telecel phone number', type: 'error' });
    //   return;
    // }

    // Get token from localStorage
    const token = localStorage.getItem('igettoken')
    if (!token) {
      setMessage({ text: 'Please login to purchase data bundles', type: 'error' });
      return;
    }

    setProcessingOrder(true);

    try {
      // Call the placeorder endpoint (same as in the MTN and AT components)
      const response = await axios.post(
        'http://localhost:5000/api/orders/placeorder',
        {
          recipientNumber: phoneNumber,
          capacity: bundle.capacity,
          price: parseFloat(bundle.price),
          bundleType: bundle.type || 'Telecel-5959'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setMessage({ 
          text: `${(bundle.capacity / 1000).toFixed(bundle.capacity % 1000 === 0 ? 0 : 1)}GB data bundle purchased successfully for ${phoneNumber}`,
          type: 'success',
          orderDetails: response.data.data
        });
        setSelectedBundleIndex(null);
        setPhoneNumber('');
      } else {
        setMessage({ 
          text: response.data.message || 'Failed to process order', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setMessage({ 
        text: error.response?.data?.message || error.message || 'Failed to purchase data bundle', 
        type: 'error' 
      });
    } finally {
      setProcessingOrder(false);
    }
  };

  if (isLoading && bundles.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center mb-6">
        <TelecelLogo />
        <h1 className="text-3xl font-bold ml-4">Telecel 5959 Bundles</h1>
      </div>
      
      {message.text && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
          {message.type === 'success' && message.orderDetails && (
            <div className="mt-2 text-sm">
              <p><strong>Order Reference:</strong> {message.orderDetails.order.orderReference}</p>
              <p><strong>Transaction Ref:</strong> {message.orderDetails.transaction.reference}</p>
              <p><strong>New Balance:</strong> GH₵ {message.orderDetails.walletBalance.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}

      {filteredBundles.length === 0 && !isLoading ? (
        <div className="bg-red-100 p-10 text-center rounded-lg border border-red-400">
          <p className="text-lg text-red-800">No Telecel bundles available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBundles.map((bundle, index) => (
            <div key={index} className="flex flex-col">
              <div 
                className={`flex flex-col bg-red-600 overflow-hidden shadow-md cursor-pointer transition-transform duration-300 hover:translate-y-[-5px] ${selectedBundleIndex === index ? 'rounded-t-lg' : 'rounded-lg'}`}
                onClick={() => handleSelectBundle(index)}
              >
                <div className="flex flex-col items-center justify-center p-5 space-y-3">
                  <div className="w-20 h-20 flex justify-center items-center">
                    <TelecelLogo />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {(bundle.capacity / 1000).toFixed(bundle.capacity % 1000 === 0 ? 0 : 1)} GB
                  </h3>
                </div>
                <div className="grid grid-cols-2 text-white bg-black"
                     style={{ borderRadius: selectedBundleIndex === index ? '0' : '0 0 0.5rem 0.5rem' }}>
                  <div className="flex flex-col items-center justify-center p-3 text-center border-r border-r-gray-600">
                    <p className="text-lg">GH₵ {parseFloat(bundle.price).toFixed(2)}</p>
                    <p className="text-sm font-bold">Price</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 text-center">
                    <p className="text-lg">{bundle.validity || "30 Days"}</p>
                    <p className="text-sm font-bold">Duration</p>
                  </div>
                </div>
              </div>
              
              {selectedBundleIndex === index && (
                <div className="bg-red-600 p-4 rounded-b-lg shadow-md">
                  <div className="mb-4">
                    <input
                      type="tel"
                      className="w-full px-4 py-2 rounded bg-red-500 text-white placeholder-red-200 border border-red-400 focus:outline-none focus:border-red-300"
                      placeholder="Enter recipient number (e.g., 0271234567)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => handlePurchase(bundle)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
                    disabled={processingOrder}
                  >
                    {processingOrder ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TelecelBundleCards;