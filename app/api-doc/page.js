'use client'
import { useState } from 'react';
import { BookOpen, Send, Search, Copy, Check, ChevronRight } from 'lucide-react';

const BASE_URL = 'https://iget.onrender.com';

export default function ApiDocumentation() {
  const [activeTab, setActiveTab] = useState('placeOrder');
  const [copied, setCopied] = useState(null);

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs = [
    { id: 'placeOrder', label: 'Place Order', method: 'POST', icon: Send },
    { id: 'getOrderByReference', label: 'Get Order', method: 'GET', icon: Search },
  ];

  const CodeBlock = ({ code, id, lang = '' }) => (
    <div className="relative group">
      <pre className="bg-gray-950 text-gray-100 text-xs sm:text-sm rounded-lg p-4 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copyText(code, id)}
        className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-gray-800 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied === id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );

  const MethodBadge = ({ method }) => (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
      method === 'POST' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    }`}>
      {method}
    </span>
  );

  const StatusBadge = ({ status, color }) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${color}`}>{status}</span>
  );

  const ParamRow = ({ name, type, desc, required = true }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <div className="sm:w-36 shrink-0 flex items-center gap-2">
        <code className="text-xs font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{name}</code>
        {required && <span className="text-[9px] text-red-500 font-medium">required</span>}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{type}</span>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{desc}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">API Documentation</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">iGet Developer API v1</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-52 shrink-0">
            <nav className="md:sticky md:top-20 space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">Endpoints</p>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <MethodBadge method={tab.method} />
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}

              {/* Quick info */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">Base URL</p>
                <code className="block px-3 text-xs font-mono text-gray-600 dark:text-gray-400 break-all">{BASE_URL}</code>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">Auth</p>
                <code className="block px-3 text-xs font-mono text-gray-600 dark:text-gray-400">X-API-Key: your_key</code>
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-5">

            {/* ============ PLACE ORDER ============ */}
            {activeTab === 'placeOrder' && (
              <>
                {/* Endpoint */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2.5 mb-1">
                      <MethodBadge method="POST" />
                      <code className="text-sm font-mono text-gray-900 dark:text-white">/api/developer/orders/place</code>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Purchase a data bundle for any phone number. Payment is deducted from your wallet.
                    </p>
                  </div>

                  {/* Important note */}
                  <div className="mx-5 mt-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg px-4 py-3">
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      <span className="font-semibold">Important:</span> Always store the <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">orderReference</code> from the response. You'll need it to track order status.
                    </p>
                  </div>

                  {/* Request body */}
                  <div className="p-5">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Request Body</h3>
                    <CodeBlock id="req-body" code={`{
  "recipientNumber": "0201234567",
  "capacity": 1,
  "bundleType": "mtnup2u"
}`} />
                  </div>

                  {/* Parameters */}
                  <div className="px-5 pb-5">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Parameters</h3>
                    <div className="border border-gray-100 dark:border-gray-700 rounded-lg px-4">
                      <ParamRow name="recipientNumber" type="string" desc="Phone number starting with 0. Example: 0201234567" />
                      <ParamRow name="capacity" type="number" desc="Bundle size in GB. Values: 1, 2, 5, 10, 15, 20" />
                      <ParamRow name="bundleType" type="string" desc="mtnup2u, mtn-fibre, mtn-justforu, AT-ishare, Telecel-5959" />
                      <ParamRow name="reference" type="string" desc="Your own order reference (max 50 chars). Auto-generated if not provided." required={false} />
                    </div>
                  </div>
                </div>

                {/* Response */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Response <span className="text-green-600 dark:text-green-400 ml-1">201 Created</span></h3>
                  </div>
                  <div className="p-5">
                    <CodeBlock id="res-place" code={`{
  "success": true,
  "message": "Order placed successfully and payment processed",
  "data": {
    "order": {
      "id": "6074e5b5c72e3a001fc4b3a1",
      "orderReference": "ABC123",
      "recipientNumber": "0201234567",
      "bundleType": "mtnup2u",
      "capacity": 1,
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
}`} />
                  </div>
                </div>

                {/* Order statuses */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order Status Values</h3>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {[
                      { status: 'pending', desc: 'Order created, payment processed, bundle not yet delivered', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                      { status: 'processing', desc: 'Being processed by the network provider', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                      { status: 'completed', desc: 'Bundle successfully delivered to recipient', color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
                      { status: 'failed', desc: 'Could not be completed. Check failureReason for details', color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
                    ].map((s) => (
                      <div key={s.status} className="flex items-start gap-3 px-5 py-3">
                        <StatusBadge status={s.status} color={s.color} />
                        <p className="text-sm text-gray-600 dark:text-gray-300">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* cURL example */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Example Request</h3>
                  </div>
                  <div className="p-5">
                    <CodeBlock id="curl-place" code={`curl -X POST ${BASE_URL}/api/developer/orders/place \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "recipientNumber": "0201234567",
    "capacity": 1,
    "bundleType": "mtnup2u"
  }'`} />
                  </div>
                </div>

                {/* Bundle types */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Available Bundle Types</h3>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {[
                      { type: 'mtnup2u', network: 'MTN', desc: 'MTN Up2U bundles', color: 'bg-yellow-400 text-black' },
                      { type: 'mtn-justforu', network: 'MTN', desc: 'MTN Just For U bundles', color: 'bg-yellow-400 text-black' },
                      { type: 'mtn-fibre', network: 'MTN', desc: 'MTN Fibre bundles', color: 'bg-yellow-400 text-black' },
                      { type: 'AT-ishare', network: 'AT', desc: 'AirtelTigo iShare bundles', color: 'bg-[#0066B3] text-white' },
                      { type: 'Telecel-5959', network: 'TC', desc: 'Telecel enterprise bundles', color: 'bg-red-500 text-white' },
                    ].map((b) => (
                      <div key={b.type} className="flex items-center gap-3 px-5 py-3">
                        <div className={`w-7 h-7 rounded-md ${b.color} flex items-center justify-center shrink-0`}>
                          <span className="text-[9px] font-bold">{b.network}</span>
                        </div>
                        <div className="min-w-0">
                          <code className="text-xs font-mono text-gray-900 dark:text-white">{b.type}</code>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ============ GET ORDER ============ */}
            {activeTab === 'getOrderByReference' && (
              <>
                {/* Endpoint */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2.5 mb-1">
                      <MethodBadge method="GET" />
                      <code className="text-sm font-mono text-gray-900 dark:text-white">/api/developer/orders/reference/<span className="text-violet-500">:orderRef</span></code>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Retrieve order details using its unique reference. Use this to check order status after placing.
                    </p>
                  </div>

                  {/* Tip */}
                  <div className="mx-5 mt-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg px-4 py-3">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      <span className="font-semibold">Tip:</span> Store the <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">orderReference</code> in your database when placing orders for reconciliation.
                    </p>
                  </div>

                  {/* Path params */}
                  <div className="p-5">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Path Parameters</h3>
                    <div className="border border-gray-100 dark:border-gray-700 rounded-lg px-4">
                      <ParamRow name="orderRef" type="string" desc="The unique order reference returned when placing an order. Example: ABC123" />
                    </div>
                  </div>
                </div>

                {/* Response */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Response <span className="text-green-600 dark:text-green-400 ml-1">200 OK</span></h3>
                  </div>
                  <div className="p-5">
                    <CodeBlock id="res-get" code={`{
  "success": true,
  "data": {
    "order": {
      "id": "6074e5b5c72e3a001fc4b3a1",
      "orderReference": "ABC123",
      "recipientNumber": "0201234567",
      "bundleType": "mtnup2u",
      "capacity": 1,
      "price": 5.99,
      "status": "completed",
      "createdAt": "2025-03-16T12:34:56.789Z",
      "completedAt": "2025-03-16T12:36:23.456Z",
      "failureReason": null
    },
    "transaction": {
      "reference": "API-TXN-1647431696789-123",
      "amount": 5.99,
      "status": "completed"
    }
  }
}`} />
                  </div>
                </div>

                {/* Error responses */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Error Responses</h3>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {[
                      { code: '400', msg: 'Order reference is required', desc: 'Missing orderRef in path' },
                      { code: '401', msg: 'Invalid API key', desc: 'Missing or invalid X-API-Key header' },
                      { code: '404', msg: 'Order not found', desc: 'No order with that reference, or not owned by you' },
                      { code: '500', msg: 'Server error', desc: 'Unexpected server error' },
                    ].map((e) => (
                      <div key={e.code} className="flex items-start gap-3 px-5 py-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 shrink-0">{e.code}</span>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white">{e.msg}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{e.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* cURL example */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Example Request</h3>
                  </div>
                  <div className="p-5">
                    <CodeBlock id="curl-get" code={`curl -X GET ${BASE_URL}/api/developer/orders/reference/ABC123 \\
  -H "X-API-Key: your_api_key_here"`} />
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
