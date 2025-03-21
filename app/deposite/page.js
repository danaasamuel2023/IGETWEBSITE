// pages/wallet/deposit.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function WalletDeposit() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const storedUserData = localStorage.getItem('userData');
    const token = localStorage.getItem('igettoken');
    
    if (!storedUserData || !token) {
      router.push('/login?redirect=/wallet/deposit');
      return;
    }
    
    setUserData(JSON.parse(storedUserData));
  }, [router]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('igettoken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`http://localhost:5000/api/depsoite/wallet/add-funds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(amount) })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }
      
      // Redirect to Paystack payment page
      window.location.href = data.authorizationUrl;
    } catch (error) {
      console.error('Error initiating deposit:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Deposit Funds | IGet</title>
      </Head>
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md my-10">
        <h1 className="text-2xl font-bold mb-6 text-center">Add Funds to Your Wallet</h1>
        
        {userData && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <p className="text-gray-700">
              <span className="font-medium">Account:</span> {userData.username}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Current Balance:</span> {userData.wallet?.balance || 0} GHS
            </p>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleDeposit}>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-gray-700 font-medium mb-2">
              Amount (GHS)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              min="1"
              step="0.01"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md font-medium text-white ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : 'Deposit Funds'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Payments are securely processed via Paystack</p>
        </div>
      </div>
    </>
  );
}