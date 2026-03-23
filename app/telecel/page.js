'use client'
import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, AlertTriangle } from 'lucide-react';

const TelecelLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="16" fill="#FFF" />
    <circle cx="50" cy="50" r="42" fill="#E30613" />
    <text x="50" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="50" fontWeight="600" fill="#FFF">t</text>
  </svg>
);

const TelecelBundleCards = () => {
  const [bundles, setBundles] = useState([]);
  const [filteredBundles, setFilteredBundles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const [recipientNumber, setRecipientNumber] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [outOfStockBundle, setOutOfStockBundle] = useState(null);

  useEffect(() => {
    const fetchBundles = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('igettoken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch('https://iget.onrender.com/api/iget/bundle', { headers });
        const data = await response.json();
        if (data.userRole) setUserRole(data.userRole);
        const telecelBundles = data.data.filter(b => b.network === 'telecel' || b.type === 'Telecel-5959');
        setBundles(telecelBundles);
        setFilteredBundles(telecelBundles);
      } catch (err) {
        setError('Failed to load bundles. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBundles();
  }, []);

  const isBundleInStock = (bundle) => {
    if (bundle.stockInfo?.isOutOfStock === true) return false;
    if (bundle.isInStock === false) return false;
    if (bundle.stockStatus?.isOutOfStock === true) return false;
    if (bundle.stockUnits?.available === 0) return false;
    return true;
  };

  const getAvailableUnits = (bundle) => bundle.stockUnits?.available || 0;

  const getPrice = (bundle) => bundle.userPrice !== undefined ? bundle.userPrice : bundle.price;
  const fmtPrice = (p) => `GH\u20B5 ${parseFloat(p).toFixed(2)}`;
  const fmtCapacity = (c) => `${c % 1 === 0 ? c : c.toFixed(1)} GB`;

  const handleBundleClick = (bundle) => {
    if (!isBundleInStock(bundle)) {
      setOutOfStockBundle(bundle);
      setShowOutOfStockModal(true);
    } else {
      setSelectedBundle(bundle);
      setIsModalOpen(true);
      setPurchaseStatus(null);
      setRecipientNumber('');
    }
  };

  const closePurchaseModal = () => {
    setIsModalOpen(false);
    setSelectedBundle(null);
    setRecipientNumber('');
    setPurchaseStatus(null);
  };

  const handlePurchase = async () => {
    if (!recipientNumber || !/^0\d{9}$/.test(recipientNumber)) {
      setPurchaseStatus({ success: false, message: 'Enter a valid 10-digit phone number starting with 0' });
      return;
    }
    setProcessingOrder(true);
    try {
      const token = localStorage.getItem('igettoken');
      if (!token) { setPurchaseStatus({ success: false, message: 'Please sign in to purchase' }); setProcessingOrder(false); return; }
      if (!isBundleInStock(selectedBundle)) { setPurchaseStatus({ success: false, message: 'This bundle is out of stock' }); setProcessingOrder(false); return; }
      const response = await fetch('https://iget.onrender.com/api/orders/placeorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          recipientNumber,
          capacity: selectedBundle.capacity,
          price: getPrice(selectedBundle),
          bundleType: selectedBundle.type || 'Telecel-5959'
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Purchase failed');
      setPurchaseStatus({ success: true, message: 'Bundle purchased successfully!', orderDetails: data.data });
    } catch (err) {
      setPurchaseStatus({ success: false, message: err.message || 'Purchase failed. Please try again.' });
    } finally {
      setProcessingOrder(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-red-500"></div>
        <p className="text-sm text-gray-400">Loading bundles...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-4 max-w-md w-full text-center">
        <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <TelecelLogo size={36} />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Telecel Data Bundles</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Enterprise data - 60 Days validity</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Role badge */}
        {userRole && userRole !== 'user' && (
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Viewing as <span className="capitalize font-semibold">{userRole}</span> prices
            </span>
          </div>
        )}

        {/* Bundles grid */}
        {filteredBundles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredBundles.map((bundle) => {
              const price = getPrice(bundle);
              const inStock = isBundleInStock(bundle);
              const units = getAvailableUnits(bundle);

              return (
                <button
                  key={bundle._id}
                  onClick={() => handleBundleClick(bundle)}
                  className={`rounded-xl overflow-hidden shadow-md transition-all text-left group ${
                    inStock ? 'hover:shadow-xl hover:scale-[1.03]' : 'opacity-60 cursor-not-allowed'
                  }`}
                  disabled={!inStock}
                >
                  {/* Red top — capacity */}
                  <div className={`px-4 py-4 flex flex-col items-center ${inStock ? 'bg-red-600' : 'bg-gray-400'}`}>
                    <TelecelLogo size={28} />
                    <p className="text-2xl font-black text-white mt-2">
                      {fmtCapacity(bundle.capacity)}
                    </p>
                    {!inStock && (
                      <span className="mt-1 px-2 py-0.5 bg-black/30 rounded-full text-[10px] text-white font-medium">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Dark bottom — price + validity */}
                  <div className="bg-gray-900 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold text-white">{fmtPrice(price)}</p>
                        <p className="text-[10px] text-gray-400">60 Days</p>
                      </div>
                      {inStock ? (
                        <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center group-hover:bg-red-400 transition-colors">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500">{units} left</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl p-10 text-center flex flex-col items-center">
            <TelecelLogo size={48} />
            <p className="text-sm text-gray-400 mt-3">No Telecel bundles available.</p>
          </div>
        )}
      </div>

      {/* Out of Stock Modal */}
      {showOutOfStockModal && outOfStockBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOutOfStockModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Out of Stock</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span className="font-semibold">{fmtCapacity(outOfStockBundle.capacity)}</span> bundle is currently unavailable.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Please check back later or try a different bundle.</p>
            </div>
            <div className="px-6 pb-5">
              <button onClick={() => setShowOutOfStockModal(false)} className="w-full py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {isModalOpen && selectedBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closePurchaseModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2.5">
                <TelecelLogo size={28} />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Purchase Bundle</h2>
              </div>
              <button onClick={closePurchaseModal} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Bundle info */}
            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtCapacity(selectedBundle.capacity)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">60 Days validity</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{fmtPrice(getPrice(selectedBundle))}</p>
                  <p className="text-[10px] text-gray-400">{getAvailableUnits(selectedBundle)} units left</p>
                </div>
              </div>
            </div>

            {/* Form / Status */}
            <div className="px-5 py-4">
              {purchaseStatus?.success ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{purchaseStatus.message}</p>
                  </div>
                  {purchaseStatus.orderDetails && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Reference</span>
                        <span className="font-mono text-gray-900 dark:text-white text-xs">{purchaseStatus.orderDetails.order.orderReference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">New Balance</span>
                        <span className="font-semibold text-gray-900 dark:text-white">GH₵ {purchaseStatus.orderDetails.walletBalance.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  <button onClick={closePurchaseModal} className="w-full py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    Done
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Recipient Number</label>
                  <input
                    type="tel"
                    value={recipientNumber}
                    onChange={(e) => { setRecipientNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 10)); setPurchaseStatus(null); }}
                    placeholder="0551234567"
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 font-mono text-center tracking-widest transition-colors"
                  />

                  {purchaseStatus && !purchaseStatus.success && (
                    <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-700 dark:text-red-300">{purchaseStatus.message}</p>
                    </div>
                  )}

                  <button
                    onClick={handlePurchase}
                    disabled={processingOrder || recipientNumber.length < 10}
                    className="w-full mt-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
                  >
                    {processingOrder ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Processing...
                      </span>
                    ) : (
                      `Pay ${fmtPrice(getPrice(selectedBundle))}`
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelecelBundleCards;
