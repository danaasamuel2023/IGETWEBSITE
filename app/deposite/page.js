// pages/verify-payment.js
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Loading component for Suspense fallback
function PaymentVerificationLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-700">Verifying your payment...</p>
    </div>
  );
}

// The main verification component that will be wrapped in Suspense
function PaymentVerifier({ reference }) {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Verifying your payment...');
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    // Only proceed if we have a reference
    if (reference) {
      verifyPayment(reference);
    }
  }, [reference]);

  const verifyPayment = async (paymentRef) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet/verify-payment?reference=${paymentRef}`);
      const data = await response.json();

      if (response.ok && data.success) {
        // Payment successful
        setStatus('success');
        setMessage('Payment completed successfully!');
        setBalance(data.balance);
        
        // Update user data in localStorage with new balance
        try {
          const userData = JSON.parse(localStorage.getItem('userData'));
          if (userData) {
            userData.wallet = { ...userData.wallet, balance: data.balance };
            localStorage.setItem('userData', JSON.stringify(userData));
          }
        } catch (err) {
          console.error('Error updating localStorage:', err);
        }
      } else {
        // Payment failed
        setStatus('failed');
        setMessage(data.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('failed');
      setMessage('An error occurred while verifying your payment');
    }
  };

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-700">{message}</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="py-8">
        <div className="mb-4 text-green-500">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-green-700 mb-2">Payment Successful!</h2>
        <p className="text-gray-700 mb-4">{message}</p>
        {balance !== null && (
          <p className="text-gray-700 mb-6">
            Your new wallet balance: <span className="font-bold">{balance} GHS</span>
          </p>
        )}
        <div className="flex justify-center space-x-4">
          <Link href="/wallet" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Go to Wallet
          </Link>
          <Link href="/dashboard" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="py-8">
        <div className="mb-4 text-red-500">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-red-700 mb-2">Payment Failed</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
          <Link href="/wallet/deposit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Try Again
          </Link>
          <Link href="/wallet" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Go to Wallet
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export default function VerifyPayment() {
  const router = useRouter();
  const { reference } = router.query;
  const [isClient, setIsClient] = useState(false);

  // Use a useEffect to determine if we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <>
      <Head>
        <title>Payment Verification | IGet</title>
      </Head>
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md my-10 text-center">
        <h1 className="text-2xl font-bold mb-6">Payment Verification</h1>
        
        {!isClient ? (
          <PaymentVerificationLoading />
        ) : (
          <Suspense fallback={<PaymentVerificationLoading />}>
            <PaymentVerifier reference={reference} />
          </Suspense>
        )}
        
        {reference && isClient && (
          <div className="mt-6 text-sm text-gray-500">
            Transaction Reference: {reference}
          </div>
        )}
      </div>
    </>
  );
}