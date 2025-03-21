'use client'
import React, { useState } from 'react';
import Head from 'next/head';

export default function ApiDocumentation() {
  const [activeTab, setActiveTab] = useState('placeOrder');

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Iget API Documentation</title>
        <meta name="description" content="API documentation for the Thundleis platform" />
      </Head>

      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Iget API Documentation</h1>
          <p className="mt-2 text-purple-100">Bundle Management API</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="md:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow p-4 sticky top-4">
              <ul className="space-y-1">
                <li>
                  <button 
                    onClick={() => setActiveTab('placeOrder')}
                    className={`w-full text-left px-4 py-2 rounded ${activeTab === 'placeOrder' ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-gray-100'}`}
                  >
                    Place Order
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('walletBalance')}
                    className={`w-full text-left px-4 py-2 rounded ${activeTab === 'walletBalance' ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-gray-100'}`}
                  >
                    Wallet Balance
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('bundleTypes')}
                    className={`w-full text-left px-4 py-2 rounded ${activeTab === 'bundleTypes' ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-gray-100'}`}
                  >
                    Bundle Types
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('getOrders')}
                    className={`w-full text-left px-4 py-2 rounded ${activeTab === 'getOrders' ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-gray-100'}`}
                  >
                    Get Orders
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-grow">
            {activeTab === 'placeOrder' && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Place an Order</h2>
                
                <div className="mb-6 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-blue-800">
                    This endpoint allows you to purchase mobile data bundles for any phone number. 
                    Payment is automatically processed from your wallet balance.
                  </p>
                </div>
                
                <div className="mb-4">
                  <span className="bg-green-500 text-white text-sm font-bold px-2 py-1 rounded-md mr-2">POST</span>
                  <code className="font-mono bg-gray-100 px-2 py-1">/api/developer/orders/place</code>
                </div>
                
                <h3 className="text-lg font-semibold mt-6 mb-3">Authentication</h3>
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Header</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Value</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-mono text-sm">X-API-Key</td>
                        <td className="border border-gray-300 px-4 py-2 font-mono text-sm">your_api_key</td>
                        <td className="border border-gray-300 px-4 py-2">Your API key for authentication</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <h3 className="text-lg font-semibold mt-6 mb-3">Request Body</h3>
                <div className="bg-gray-100 p-4 rounded-lg mb-6">
                  <pre className="text-sm overflow-x-auto">
{`{
  "recipientNumber": "0201234567",    // Required: Phone number starting with 0
  "capacity": 100,                    // Required: Bundle capacity in MB
  "bundleType": "mtnup2u"             // Required: Bundle type (see Bundle Types section)
}`}
                  </pre>
                </div>
                
                <h4 className="font-medium text-gray-700 mb-2">Field Descriptions:</h4>
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Field</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">recipientNumber</td>
                        <td className="border border-gray-300 px-4 py-2">String</td>
                        <td className="border border-gray-300 px-4 py-2">
                          Phone number must start with 0 (local format).<br/>
                          Example: <code>0201234567</code>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">capacity</td>
                        <td className="border border-gray-300 px-4 py-2">Number</td>
                        <td className="border border-gray-300 px-4 py-2">
                          Data bundle size in megabytes (MB).<br/>
                          Common values: 100, 250, 500, 1000, 2000
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">bundleType</td>
                        <td className="border border-gray-300 px-4 py-2">String</td>
                        <td className="border border-gray-300 px-4 py-2">
                          Type of bundle to purchase.<br/>
                          Values: <code>mtnup2u</code>, <code>mtn-fibre</code>, <code>mtn-justforu</code>, <code>AT-ishare</code>, <code>Telecel-5959</code>, <code>AfA-registration</code>, <code>other</code>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <h3 className="text-lg font-semibold mt-6 mb-3">Response (201 Created)</h3>
                <div className="bg-gray-100 p-4 rounded-lg mb-6">
                  <pre className="text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "Order placed successfully and payment processed",
  "data": {
    "order": {
      "id": "6074e5b5c72e3a001fc4b3a1",
      "orderReference": "ORD-123456",
      "recipientNumber": "0201234567",
      "bundleType": "mtnup2u",
      "capacity": 100,
      "price": 5.99,
      "status": "pending",
      "createdAt": "2025-03-16T12:34:56.789Z"
    },
    "transaction": {
      "id": "6074e5b5c72e3a001fc4b3a2",
      "reference": "API-TXN-1647431696789-123",
      "amount": 5.99,
      "status": "completed"
    },
    "walletBalance": 94.01
  }
}`}
                  </pre>
                </div>
                
                <h3 className="text-lg font-semibold mt-6 mb-3">Error Responses</h3>
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Status Code</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Error Message</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">400</td>
                        <td className="border border-gray-300 px-4 py-2">Recipient number, capacity, and bundle type are all required</td>
                        <td className="border border-gray-300 px-4 py-2">Missing one or more required fields in request</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">400</td>
                        <td className="border border-gray-300 px-4 py-2">Invalid recipient phone number format</td>
                        <td className="border border-gray-300 px-4 py-2">Phone number doesn't meet the required format</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">400</td>
                        <td className="border border-gray-300 px-4 py-2">Insufficient balance in wallet</td>
                        <td className="border border-gray-300 px-4 py-2">User doesn't have enough funds to complete the purchase</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">404</td>
                        <td className="border border-gray-300 px-4 py-2">No active bundle found matching type X with capacity YMB</td>
                        <td className="border border-gray-300 px-4 py-2">The requested bundle type/capacity combination doesn't exist</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <h3 className="text-lg font-semibold mt-6 mb-3">Example Request</h3>
                <div className="bg-gray-800 text-green-400 p-3 rounded-lg overflow-x-auto">
                  <pre>
{`curl -X POST https://api.iget.com/api/developer/orders/place \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "recipientNumber": "0201234567",
    "capacity": 100,
    "bundleType": "mtnup2u"
  }'`}
                  </pre>
                </div>
              </section>
            )}
            
            {activeTab === 'walletBalance' && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Wallet Balance</h2>
                <p>Content for Wallet Balance section will be displayed here.</p>
              </section>
            )}
            
            {activeTab === 'bundleTypes' && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Bundle Types</h2>
                <p>Content for Bundle Types section will be displayed here.</p>
              </section>
            )}
            
            {activeTab === 'getOrders' && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Get Orders</h2>
                <p>Content for Get Orders section will be displayed here.</p>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}