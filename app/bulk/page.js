'use client'
import React, { useState, useEffect } from 'react';
import { AlertCircle, FileSpreadsheet, Upload, Check, ArrowRight, Layers, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const BulkPurchaseComponent = () => {
  const [bulkInput, setBulkInput] = useState('');
  const [bundleType, setBundleType] = useState('mtnup2u');
  const [bundleOptions, setBundleOptions] = useState({});
  const [availableCapacities, setAvailableCapacities] = useState([]);
  const [parsedEntries, setParsedEntries] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [networkOptions, setNetworkOptions] = useState([
    { value: 'mtnup2u', label: 'MTN Up2U' },
    { value: 'TELECEL', label: 'Telecel' }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const init = async () => {
      await fetchBundleData();
      await fetchWalletBalance();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (Object.keys(bundleOptions).length > 0) {
      const networks = Object.keys(bundleOptions).map(key => {
        let label = key;
        if (key === 'mtnup2u') label = 'MTN Up2U';
        else if (key === 'TELECEL' || key === 'telecel-5959') label = 'Telecel';
        else if (key === 'YELLO' || key === 'mtn') label = 'MTN';
        else if (key === 'AT_PREMIUM' || key === 'at') label = 'AirtelTigo Premium';
        else if (key === 'AT-ishare' || key === 'at-ishare') label = 'AirtelTigo iShare';
        else if (key === 'mtn-justforu') label = 'MTN Just For U';
        else if (key === 'mtn-fibre') label = 'MTN Fibre';
        return { value: key, label };
      });
      if (networks.length > 0) {
        setNetworkOptions(networks);
        setBundleType(networks[0].value);
      }
    }
  }, [bundleOptions]);

  useEffect(() => {
    if (bulkInput.trim() === '') {
      setParsedEntries([]);
      setTotalCost(0);
      return;
    }
    try {
      const lines = bulkInput.trim().split('\n');
      const entries = [];
      let calculatedTotal = 0;
      if (!bundleOptions[bundleType]) throw new Error(`No pricing for ${bundleType}`);
      const networkPrices = bundleOptions[bundleType];
      lines.forEach((line, index) => {
        const parts = line.trim().split(' ');
        if (parts.length >= 2) {
          const recipient = parts[0].trim();
          const capacity = parts[1].trim();
          if (!/^0\d{9}$/.test(recipient))
            throw new Error(`Line ${index + 1}: Invalid phone number. Must be 10 digits starting with 0`);
          if (!networkPrices[capacity])
            throw new Error(`Line ${index + 1}: Invalid capacity. Options: ${Object.keys(networkPrices).join(', ')}`);
          const price = networkPrices[capacity];
          calculatedTotal += parseFloat(price);
          entries.push({ recipient, capacity, price, lineNumber: index + 1 });
        } else {
          throw new Error(`Line ${index + 1}: Format must be: phone_number capacity`);
        }
      });
      setParsedEntries(entries);
      setTotalCost(calculatedTotal);
      setError('');
    } catch (err) {
      setError(err.message);
      setParsedEntries([]);
      setTotalCost(0);
    }
  }, [bulkInput, bundleType, bundleOptions]);

  const fetchBundleData = async () => {
    try {
      const token = localStorage.getItem('igettoken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch('https://iget.onrender.com/api/iget/bundle', { headers });
      if (!response.ok) throw new Error('Failed to fetch bundle data');
      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) throw new Error('Invalid bundle data format');
      const bundlePricing = {};
      const capacities = new Set();
      data.data.forEach(bundle => {
        const type = bundle.type;
        const capacity = bundle.capacity.toString();
        const price = bundle.userPrice !== undefined ? bundle.userPrice : bundle.price;
        if (!bundlePricing[type]) bundlePricing[type] = {};
        bundlePricing[type][capacity] = price;
        capacities.add(capacity);
      });
      setBundleOptions(bundlePricing);
      setAvailableCapacities(Array.from(capacities).sort((a, b) => parseFloat(a) - parseFloat(b)));
    } catch (error) {
      console.error('Error fetching bundle data:', error);
      setError('Failed to load bundle prices. Please try again.');
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('igettoken');
      if (!token) return;
      const response = await fetch('https://iget.onrender.com/api/iget/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch wallet balance');
      const data = await response.json();
      if (data.success) setWalletBalance(data.data.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parsedEntries.length === 0) { setError('No valid entries to process'); return; }
    if (totalCost > walletBalance) { setError('Insufficient wallet balance'); return; }
    setIsProcessing(true);
    setError('');
    try {
      const token = localStorage.getItem('igettoken');
      if (!token) { setError('You need to be logged in'); setIsProcessing(false); return; }
      const response = await fetch('https://iget.onrender.com/api/orders/bulk-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          networkKey: bundleType,
          orders: parsedEntries.map(e => ({ recipient: e.recipient, capacity: e.capacity }))
        })
      });
      const data = await response.json();
      if (response.ok) {
        setResults(data);
        setBulkInput('');
        fetchWalletBalance();
      } else {
        setError(data.message || 'Failed to process bulk purchase');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Only Excel files (.xlsx or .xls) are supported');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const formatted = jsonData
          .filter(row => Array.isArray(row) && row.length >= 2)
          .map(row => `${row[0]?.toString().trim()} ${row[1]?.toString().trim()}`)
          .filter(line => line.split(' ').length === 2);
        setBulkInput(formatted.join('\n'));
      } catch (error) {
        setError('Failed to parse Excel file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadExcelTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const caps = availableCapacities.length > 0
      ? [availableCapacities[0], availableCapacities[Math.min(2, availableCapacities.length - 1)], availableCapacities[Math.min(4, availableCapacities.length - 1)]]
      : ['1', '5', '10'];
    const templateData = [['Phone Number', 'Capacity (GB)'], ['0241234567', caps[0]], ['0201234567', caps[1]], ['0551234567', caps[2]]];
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    worksheet['!cols'] = [{ wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bulk Purchase');
    XLSX.writeFile(workbook, 'bulk_purchase_template.xlsx');
  };

  // Get the network icon color for the selected network
  const getNetworkColor = (type) => {
    if (type.includes('mtn') || type === 'YELLO') return { ring: 'ring-yellow-400', bg: 'bg-yellow-400', text: '#000' };
    if (type.includes('at') || type.includes('AT')) return { ring: 'ring-blue-500', bg: 'bg-blue-500', text: '#fff' };
    if (type.includes('telecel') || type.includes('TELECEL')) return { ring: 'ring-red-500', bg: 'bg-red-500', text: '#fff' };
    return { ring: 'ring-gray-400', bg: 'bg-gray-400', text: '#fff' };
  };

  const NetworkLogo = ({ type, size = 32 }) => {
    const t = type.toLowerCase();
    if (t.includes('mtn')) return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="#FFCC00"/><ellipse cx="50" cy="50" rx="38" ry="26" stroke="#000" strokeWidth="4" fill="none"/><text x="50" y="57" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="20" fontWeight="900" fill="#000">MTN</text></svg>
    );
    if (t.includes('at') || t.includes('ishare')) return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="#0066B3"/><circle cx="35" cy="40" r="6" fill="#FFF"/><circle cx="65" cy="40" r="6" fill="#FFF"/><path d="M30 55 Q50 75 70 55" stroke="#FFF" strokeWidth="6" fill="none" strokeLinecap="round"/></svg>
    );
    if (t.includes('telecel')) return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="16" fill="#FFF"/><circle cx="50" cy="50" r="42" fill="#E30613"/><text x="50" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="50" fontWeight="600" fill="#FFF">t</text></svg>
    );
    return (
      <div className="rounded-lg bg-gray-500 flex items-center justify-center" style={{ width: size, height: size }}>
        <Layers size={size * 0.5} className="text-white" />
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-500"></div>
        <p className="text-sm text-gray-400">Loading bundle data...</p>
      </div>
    </div>
  );

  const insufficientBalance = totalCost > walletBalance;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Layers className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk Purchase</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Send data to multiple numbers at once</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Balance bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Wallet Balance</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{walletBalance.toFixed(2)} GHS</p>
          </div>
          {totalCost > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Order Total</p>
              <p className={`text-lg font-semibold ${insufficientBalance ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                {totalCost.toFixed(2)} GHS
              </p>
            </div>
          )}
        </div>

        {insufficientBalance && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">Insufficient balance. Please add funds to continue.</p>
          </div>
        )}

        {/* Main form card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Network selector */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Network</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <NetworkLogo type={bundleType} size={22} />
                </div>
                <select
                  value={bundleType}
                  onChange={(e) => setBundleType(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 appearance-none transition-colors"
                >
                  {networkOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
            </div>

            {/* Instructions + actions */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Data</label>
                <div className="flex gap-3">
                  <button type="button" onClick={downloadExcelTemplate} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Template
                  </button>
                  <label className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Excel
                    <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>

              {/* Format hint */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  One order per line: <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-[11px]">phone capacity</code>
                </p>
                <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 leading-relaxed">
{availableCapacities.length > 0
  ? `0241234567 ${availableCapacities[Math.min(2, availableCapacities.length - 1)]}\n0201234567 ${availableCapacities[Math.min(4, availableCapacities.length - 1)]}\n0551234567 ${availableCapacities[0]}`
  : `0241234567 5\n0201234567 10\n0551234567 1`}
                </pre>
              </div>

              {/* Textarea */}
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={8}
                placeholder="0241234567 5&#10;0201234567 10&#10;0551234567 1"
                className="w-full px-3.5 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mx-4 sm:mx-5 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Preview table */}
            {parsedEntries.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                  <span className="ml-1.5 text-xs font-normal text-gray-400">({parsedEntries.length} orders)</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">#</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">Recipient</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">GB</th>
                        <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {parsedEntries.slice(0, 5).map((entry, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                          <td className="px-3 py-2 text-gray-400">{entry.lineNumber}</td>
                          <td className="px-3 py-2 font-mono text-gray-900 dark:text-white">{entry.recipient}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{entry.capacity}</td>
                          <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{parseFloat(entry.price).toFixed(2)}</td>
                        </tr>
                      ))}
                      {parsedEntries.length > 5 && (
                        <tr>
                          <td colSpan="4" className="px-3 py-2 text-center text-xs text-gray-400">
                            + {parsedEntries.length - 5} more entries
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <td colSpan="3" className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Total</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">{totalCost.toFixed(2)} GHS</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-700">
              <button
                type="submit"
                disabled={isProcessing || parsedEntries.length === 0 || insufficientBalance}
                className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Processing {parsedEntries.length} orders...
                  </>
                ) : (
                  <>
                    Submit Bulk Purchase
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  Purchase Complete
                </h3>
                <button onClick={() => setResults(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-700">
              {[
                { label: 'Total', value: results.data.totalOrders },
                { label: 'Successful', value: results.data.successful, color: 'text-green-600 dark:text-green-400' },
                { label: 'Failed', value: results.data.failed, color: 'text-red-500' },
                { label: 'Balance', value: `${results.data.newBalance.toFixed(2)}`, suffix: ' GHS' },
              ].map((stat, i) => (
                <div key={i} className="p-3 sm:p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">{stat.label}</p>
                  <p className={`text-base font-semibold ${stat.color || 'text-gray-900 dark:text-white'}`}>
                    {stat.value}{stat.suffix || ''}
                  </p>
                </div>
              ))}
            </div>

            {/* Order details */}
            {results.data.orders && results.data.orders.length > 0 && (
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2">Recipient</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2">GB</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {results.data.orders.map((order, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-2 font-mono text-gray-900 dark:text-white">{order.recipient}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{order.capacity}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            order.status === 'processing' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            order.status === 'failed' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs font-mono text-gray-400">{order.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkPurchaseComponent;
