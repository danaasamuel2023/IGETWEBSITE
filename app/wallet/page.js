// pages/wallet/index.js
// pages/wallet/index.js
'use client'
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [token, setToken] = useState('');
  const [depositStatus, setDepositStatus] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const storedToken = localStorage.getItem('igettoken');
    if (!storedToken) {
      router.push('/login?redirect=/wallet');
      return;
    }
    
    setToken(storedToken);
    
    // Check for status in URL parameters (for redirect from payment gateway)
    const status = searchParams.get('status');
    const reference = searchParams.get('reference');
    
    if (status) {
      setDepositStatus({ status, reference });
      // Clear URL parameters after reading them
      router.replace('/wallet');
    }
    
    fetchWalletData(storedToken);
  }, [router, searchParams]);

  const fetchWalletData = async (authToken) => {
    setLoading(true);
    try {
      // Fetch balance
      const balanceResponse = await fetch('http://localhost:5000/api/wallet/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!balanceResponse.ok) {
        throw new Error(`Failed to fetch balance: ${balanceResponse.status}`);
      }

      const balanceData = await balanceResponse.json();
      
      if (balanceData.success) {
        setBalance(balanceData.balance);
      }
      
      // Fetch recent transactions
      const transactionsResponse = await fetch('http://localhost:5000/api/wallet/transactions?limit=5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!transactionsResponse.ok) {
        throw new Error(`Failed to fetch transactions: ${transactionsResponse.status}`);
      }

      const transactionsData = await transactionsResponse.json();
      
      if (transactionsData.success) {
        setTransactions(transactionsData.transactions);
      }
    } catch (err) {
      setError(`Failed to load wallet data: ${err.message}`);
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format transaction status with color
  const getStatusBadge = (status) => {
    const statusColors = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>My Wallet</title>
        <meta name="description" content="Manage your wallet" />
      </Head>

      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Wallet</h1>

        {depositStatus && (
          <div className={`mb-6 p-4 rounded-md ${
            depositStatus.status === 'success' 
              ? 'bg-green-100 border border-green-300 text-green-700' 
              : 'bg-red-100 border border-red-300 text-red-700'
          }`}>
            {depositStatus.status === 'success' 
              ? `Your deposit was successful! Reference: ${depositStatus.reference}` 
              : `Your deposit was not completed. Reference: ${depositStatus.reference}`
            }
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading wallet data...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600">Current Balance</p>
                  <p className="text-3xl font-bold">${balance !== null ? balance.toFixed(2) : '0.00'}</p>
                </div>
                <Link 
                  href="/wallet/deposit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  Deposit Funds
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
              </div>
              
              {transactions.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <div key={transaction._id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                          <p className="text-xs text-gray-400">Ref: {transaction.reference}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </p>
                          <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No transactions yet.
                </div>
              )}
              
              <div className="p-4 border-t border-gray-200">
                <Link 
                  href="/wallet/transactions" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All Transactions →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}