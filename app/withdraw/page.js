// pages/wallet/withdraw.js
'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';
import { 
  FaUniversity, 
  FaWallet, 
  FaHistory, 
  FaArrowLeft, 
  FaCheck, 
  FaExclamationTriangle,
  FaSpinner,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

// Quick withdrawal amounts
const AMOUNT_OPTIONS = [10, 20, 50, 100, 200, 500];

export default function Withdraw() {
  const router = useRouter();
  
  // Form states
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verifiedAccountName, setVerifiedAccountName] = useState('');
  const [reason, setReason] = useState('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  
  // Data states
  const [walletBalance, setWalletBalance] = useState(0);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [banks, setBanks] = useState([]);
  const [withdrawalFee, setWithdrawalFee] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Check for dark mode preference
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
    
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkModeChange = (e) => setDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
    };
  }, []);
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('igettoken');
      const storedUserData = localStorage.getItem('userData');
      
      if (storedToken && storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setToken(storedToken);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Error parsing user data:', err);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setAuthChecked(true);
    };
    
    checkAuth();
  }, []);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push('/Signin?callbackUrl=/wallet/withdraw');
    }
  }, [authChecked, isAuthenticated, router]);
  
  // Fetch initial data when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchWalletBalance();
      fetchSupportedBanks();
    }
  }, [isAuthenticated, token]);
  
  // Calculate withdrawal fee and net amount when amount changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const amountValue = parseFloat(amount);
      const feePercentage = 2.5 / 100;
      const calculatedFee = Math.max(amountValue * feePercentage, 1); // Minimum 1 GHS fee
      const calculatedNetAmount = amountValue - calculatedFee;
      
      setWithdrawalFee(calculatedFee);
      setNetAmount(Math.max(calculatedNetAmount, 0));
    } else {
      setWithdrawalFee(0);
      setNetAmount(0);
    }
  }, [amount]);
  
  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/iget/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setWalletBalance(data.data.balance);
      }
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
    }
  };
  
  const fetchSupportedBanks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/depsoite/banks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch banks');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBanks(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch banks:', err);
      setError('Failed to load supported banks');
    }
  };
  
  const handleAmountSelect = (value) => {
    setAmount(value);
    setCustomAmount('');
  };
  
  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    setAmount(value);
  };
  
  const verifyBankAccount = async () => {
    if (!accountNumber || !bankCode) {
      setError('Please enter account number and select a bank');
      return;
    }
    
    setIsVerifyingAccount(true);
    setError('');
    setVerifiedAccountName('');
    
    try {
      const response = await fetch('http://localhost:5000/api/depsoite/verify-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountNumber,
          bankCode
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVerifiedAccountName(data.data.accountName);
        setAccountName(data.data.accountName);
        setSuccess('Account verified successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to verify account');
      }
    } catch (err) {
      setError('Failed to verify account. Please check your details.');
      console.error('Account verification error:', err);
    } finally {
      setIsVerifyingAccount(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) > walletBalance) {
      setError('Insufficient wallet balance');
      return;
    }
    
    if (!accountNumber || !bankCode) {
      setError('Please provide account details');
      return;
    }
    
    if (!verifiedAccountName) {
      setError('Please verify your account details first');
      return;
    }
    
    if (netAmount <= 0) {
      setError('Amount too small after deducting withdrawal fee');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/depsoite/withdraw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          accountNumber,
          bankCode,
          accountName: verifiedAccountName,
          reason: reason || 'Wallet withdrawal'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store withdrawal reference for tracking
        localStorage.setItem('withdrawal_reference', data.data.reference);
        
        // Show success message and redirect to status page
        setSuccess('Withdrawal initiated successfully!');
        
        // Update wallet balance
        setWalletBalance(data.data.newWalletBalance);
        
        // Reset form
        setAmount('');
        setCustomAmount('');
        setAccountNumber('');
        setBankCode('');
        setAccountName('');
        setVerifiedAccountName('');
        setReason('');
        
        // Redirect to transaction history after 2 seconds
        setTimeout(() => {
          router.push(`/wallet/transactions?ref=${data.data.reference}`);
        }, 2000);
        
      } else {
        setError(data.message || 'Failed to initiate withdrawal');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Withdrawal error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!authChecked) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`w-16 h-16 border-4 ${darkMode ? 'border-blue-400 border-t-gray-900' : 'border-blue-500 border-t-transparent'} rounded-full animate-spin`}></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Withdraw Funds - I-Get Bundle Services</title>
        <meta name="description" content="Withdraw funds from your wallet to your bank account" />
      </Head>
      
      <div className={`min-h-screen ${darkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-gradient-to-b from-blue-50 to-white text-gray-800'}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link 
              href="/wallet"
              className={`inline-flex items-center gap-2 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
            >
              <FaArrowLeft /> Back to Wallet
            </Link>
          </div>
          
          <div className={`${darkMode 
            ? 'bg-gray-800 shadow-xl' 
            : 'bg-white shadow-lg'} rounded-xl overflow-hidden`}>
            {/* Header */}
            <div className={`${darkMode 
              ? 'bg-green-800' 
              : 'bg-green-600'} text-white px-6 py-4`}>
              <h1 className="text-2xl font-bold">Withdraw Funds</h1>
              <p className="opacity-90">Transfer money from your wallet to your bank account</p>
            </div>
            
            <div className="p-6">
              {/* Wallet Balance Card */}
              <div className={`${darkMode 
                ? 'bg-gradient-to-r from-green-800 to-green-900' 
                : 'bg-gradient-to-r from-green-500 to-green-700'} rounded-lg text-white p-4 mb-8`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white/20 p-3 rounded-full mr-4">
                      <FaWallet className="text-2xl" />
                    </div>
                    <div>
                      <p className="text-sm opacity-90">Available Balance</p>
                      <h2 className="text-2xl font-bold">GHS {walletBalance.toFixed(2)}</h2>
                    </div>
                  </div>
                  <Link 
                    href="/wallet/transactions"
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FaHistory /> History
                  </Link>
                </div>
              </div>
              
              {/* Success Message */}
              {success && (
                <div className={`${darkMode 
                  ? 'bg-green-900/20 border-green-800 text-green-400' 
                  : 'bg-green-50 border-green-200 text-green-700'} border px-4 py-3 rounded mb-6 flex items-center gap-2`}>
                  <FaCheck /> {success}
                </div>
              )}
              
              {/* Error Message */}
              {error && (
                <div className={`${darkMode 
                  ? 'bg-red-900/20 border-red-800 text-red-400' 
                  : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded mb-6 flex items-center gap-2`}>
                  <FaExclamationTriangle /> {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                {/* Amount Selection */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Withdrawal Amount (GHS)
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {AMOUNT_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        disabled={option > walletBalance}
                        className={`py-3 rounded-lg border ${
                          amount === String(option)
                            ? darkMode 
                              ? 'bg-green-900/50 border-green-700 text-green-300' 
                              : 'bg-green-100 border-green-500 text-green-700'
                            : option > walletBalance
                              ? darkMode
                                ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
                                : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                              : darkMode 
                                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                        } font-medium transition`}
                        onClick={() => handleAmountSelect(String(option))}
                      >
                        GHS {option.toFixed(2)}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Amount Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>GHS</span>
                    </div>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      min="1"
                      max={walletBalance}
                      step="0.01"
                      placeholder="Enter custom amount"
                      className={`block w-full pl-12 pr-4 py-3 border ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700 text-white focus:ring-green-500 focus:border-green-500' 
                          : 'bg-white border-gray-300 focus:ring-green-500 focus:border-green-500'
                      } rounded-lg`}
                    />
                  </div>
                </div>
                
                {/* Fee Calculation Display */}
                {amount && parseFloat(amount) > 0 && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 mb-6`}>
                    <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Transaction Summary</h3>
                    <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div className="flex justify-between">
                        <span>Withdrawal Amount:</span>
                        <span>GHS {parseFloat(amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Fee (2.5%, min GHS 1):</span>
                        <span>GHS {withdrawalFee.toFixed(2)}</span>
                      </div>
                      <div className={`flex justify-between font-medium ${darkMode ? 'text-white' : 'text-gray-800'} border-t pt-2`}>
                        <span>Amount to Receive:</span>
                        <span>GHS {netAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Bank Selection */}
                <div className="mb-6">
                  <label htmlFor="bankCode" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Select Bank
                  </label>
                  <select
                    id="bankCode"
                    value={bankCode}
                    onChange={(e) => {
                      setBankCode(e.target.value);
                      setVerifiedAccountName(''); // Reset verification when bank changes
                    }}
                    className={`block w-full py-3 px-4 border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white focus:ring-green-500 focus:border-green-500' 
                        : 'bg-white border-gray-300 focus:ring-green-500 focus:border-green-500'
                    } rounded-lg`}
                    required
                  >
                    <option value="">Choose your bank</option>
                    {banks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Account Number */}
                <div className="mb-6">
                  <label htmlFor="accountNumber" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Account Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="accountNumber"
                      value={accountNumber}
                      onChange={(e) => {
                        setAccountNumber(e.target.value);
                        setVerifiedAccountName(''); // Reset verification when account number changes
                      }}
                      placeholder="Enter your account number"
                      className={`flex-1 py-3 px-4 border ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700 text-white focus:ring-green-500 focus:border-green-500' 
                          : 'bg-white border-gray-300 focus:ring-green-500 focus:border-green-500'
                      } rounded-lg`}
                      required
                    />
                    <button
                      type="button"
                      onClick={verifyBankAccount}
                      disabled={!accountNumber || !bankCode || isVerifyingAccount}
                      className={`px-4 py-3 rounded-lg font-medium text-white ${
                        !accountNumber || !bankCode || isVerifyingAccount
                          ? darkMode ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-400 cursor-not-allowed'
                          : darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'
                      } transition-colors flex items-center gap-2`}
                    >
                      {isVerifyingAccount ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <FaCheck />
                          Verify
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Verified Account Name Display */}
                {verifiedAccountName && (
                  <div className={`${darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} border rounded-lg p-4 mb-6`}>
                    <div className="flex items-center gap-2">
                      <FaCheck className={darkMode ? 'text-green-400' : 'text-green-600'} />
                      <span className={`font-medium ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                        Account Verified
                      </span>
                    </div>
                    <p className={`mt-1 ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                      Account Name: <strong>{verifiedAccountName}</strong>
                    </p>
                  </div>
                )}
                
                {/* Withdrawal Reason (Optional) */}
                <div className="mb-8">
                  <label htmlFor="reason" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Reason for Withdrawal (Optional)
                  </label>
                  <input
                    type="text"
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Personal expenses, Business payment"
                    className={`block w-full py-3 px-4 border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white focus:ring-green-500 focus:border-green-500' 
                        : 'bg-white border-gray-300 focus:ring-green-500 focus:border-green-500'
                    } rounded-lg`}
                  />
                </div>
                
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !amount || !verifiedAccountName || netAmount <= 0}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-white ${
                    isLoading || !amount || !verifiedAccountName || netAmount <= 0
                      ? darkMode ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-400 cursor-not-allowed'
                      : darkMode ? 'bg-green-700 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'
                  } transition-colors`}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Processing Withdrawal...
                    </>
                  ) : (
                    <>
                      <FaUniversity />
                      Withdraw GHS {netAmount.toFixed(2)}
                    </>
                  )}
                </button>
              </form>
              
              {/* Important Information */}
              <div className={`mt-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`}>
                <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Important Information</h3>
                <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Withdrawals are processed within 1-3 business days
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    A processing fee of 2.5% (minimum GHS 1) applies to all withdrawals
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Ensure your bank account details are correct to avoid delays
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    You can track your withdrawal status in the transaction history
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    For any issues, please contact our support team
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}