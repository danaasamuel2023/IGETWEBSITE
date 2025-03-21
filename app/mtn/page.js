'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';

const BundleFilter = () => {
  const [bundles, setBundles] = useState([]);
  const [filteredBundles, setFilteredBundles] = useState([]);
  const [selectedType, setSelectedType] = useState('mtnup2u');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const [recipientNumber, setRecipientNumber] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);

  const bundleTypes = [
    { id: 'mtnup2u', label: 'MTN Up2U' },
    { id: 'mtn-fibre', label: 'MTN Fibre' },
    { id: 'mtn-justforu', label: 'MTN Just For U' }
  ];

  // MTN Logo SVG
  const MTNLogo = () => (
    <svg width="80" height="80" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="85" fill="#ffcc00" stroke="#000" strokeWidth="2"/>
      <path d="M50 80 L80 140 L100 80 L120 140 L150 80" stroke="#000" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="100" y="170" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28">MTN</text>
    </svg>
  );

  useEffect(() => {
    const fetchBundles = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://iget.onrender.com/api/iget/bundle');
        setBundles(response.data.data);
        setFilteredBundles(response.data.data.filter(bundle => bundle.type === selectedType));
        setLoading(false);
      } catch (err) {
        setError('Failed to load bundles. Please try again later.');
        setLoading(false);
      }
    };

    fetchBundles();
  }, []);

  useEffect(() => {
    setFilteredBundles(bundles.filter(bundle => bundle.type === selectedType));
  }, [selectedType, bundles]);

  const handleTypeChange = (type) => {
    setSelectedType(type);
  };
  
  const openPurchaseModal = (bundle) => {
    setSelectedBundle(bundle);
    setIsModalOpen(true);
    setPurchaseStatus(null);
  };
  
  const closePurchaseModal = () => {
    setIsModalOpen(false);
    setSelectedBundle(null);
    setRecipientNumber('');
    setPurchaseStatus(null);
  };
  
  const validatePhone = (phone) => {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone);
  };
  
  const handlePurchase = async () => {
   
    
    setProcessingOrder(true);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('igettoken')
      
      if (!token) {
        setPurchaseStatus({
          success: false,
          message: 'You need to be logged in to make a purchase'
        });
        setProcessingOrder(false);
        return;
      }
      
      const response = await axios.post(
        'http://localhost:5000/api/orders/placeorder',
        {
          recipientNumber,
          capacity: selectedBundle.capacity,
          price: selectedBundle.price,
          bundleType: selectedBundle.type
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setPurchaseStatus({
        success: true,
        message: 'Bundle purchased successfully!',
        orderDetails: response.data.data
      });
      
    } catch (err) {
      setPurchaseStatus({
        success: false,
        message: err.response?.data?.message || 'Failed to process your purchase. Please try again.'
      });
    } finally {
      setProcessingOrder(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-400"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center my-10">
      {error}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center mb-6">
        <MTNLogo />
        <h1 className="text-3xl font-bold ml-4">MTN Data Bundles</h1>
      </div>
      
      {/* Bundle Type Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-center gap-3">
          {bundleTypes.map((type) => (
            <button
              key={type.id}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedType === type.id
                  ? 'bg-black text-yellow-400 border-2 border-yellow-400'
                  : 'bg-yellow-400 text-black hover:bg-yellow-500'
              }`}
              onClick={() => handleTypeChange(type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bundles Display */}
      {filteredBundles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBundles.map((bundle) => (
            <div
              key={bundle._id}
              className="flex flex-col overflow-hidden shadow-md transition-transform duration-300 hover:translate-y-[-5px]"
            >
              <div className="flex flex-col items-center justify-center p-5 space-y-3 bg-yellow-400">
                <div className="w-16 h-16 flex justify-center items-center">
                  <MTNLogo />
                </div>
                <h3 className="text-xl font-bold">
                  {(bundle.capacity / 1000).toFixed(bundle.capacity % 1000 === 0 ? 0 : 1)} GB
                </h3>
              </div>
              <div className="grid grid-cols-2 text-white bg-black rounded-b-lg">
                <div className="flex flex-col items-center justify-center p-3 text-center border-r border-r-gray-600">
                  <p className="text-lg">GH₵ {bundle.price.toFixed(2)}</p>
                  <p className="text-sm font-bold">Price</p>
                </div>
                <div className="flex flex-col items-center justify-center p-3 text-center">
                  <p className="text-lg">{bundle.validity || "30 Days"}</p>
                  <p className="text-sm font-bold">Duration</p>
                </div>
              </div>
              <button 
                className="w-full px-4 py-2 bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                onClick={() => openPurchaseModal(bundle)}
              >
                Purchase Bundle
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-100 p-10 text-center rounded-lg border border-yellow-400">
          <p className="text-lg text-yellow-800">No bundles found for the selected type.</p>
        </div>
      )}
      
      {/* Purchase Modal */}
      {isModalOpen && selectedBundle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Purchase Bundle</h2>
              <button 
                onClick={closePurchaseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Bundle:</span>
                <span>{(selectedBundle.capacity / 1000).toFixed(selectedBundle.capacity % 1000 === 0 ? 0 : 1)} GB</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Price:</span>
                <span>GH₵ {selectedBundle.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Validity:</span>
                <span>{selectedBundle.validity || "30 Days"}</span>
              </div>
            </div>
            
            {!purchaseStatus?.success && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Recipient Phone Number
                </label>
                <input
                  type="tel"
                  value={recipientNumber}
                  onChange={(e) => setRecipientNumber(e.target.value)}
                  placeholder="e.g. +233123456789"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            )}
            
            {purchaseStatus && (
              <div className={`p-3 mb-4 rounded ${
                purchaseStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <p>{purchaseStatus.message}</p>
                {purchaseStatus.success && purchaseStatus.orderDetails && (
                  <div className="mt-2 text-sm">
                    <p><strong>Order Reference:</strong> {purchaseStatus.orderDetails.order.orderReference}</p>
                    <p><strong>Transaction Ref:</strong> {purchaseStatus.orderDetails.transaction.reference}</p>
                    <p><strong>New Balance:</strong> GH₵ {purchaseStatus.orderDetails.walletBalance.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}
            
            {!purchaseStatus?.success && (
              <button
                onClick={handlePurchase}
                disabled={processingOrder || !recipientNumber}
                className={`w-full py-2 px-4 rounded font-bold text-white ${
                  processingOrder || !recipientNumber
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {processingOrder ? 'Processing...' : 'Confirm Purchase'}
              </button>
            )}
            
            {purchaseStatus?.success && (
              <button
                onClick={closePurchaseModal}
                className="w-full py-2 px-4 rounded font-bold text-white bg-gray-600 hover:bg-gray-700"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BundleFilter;