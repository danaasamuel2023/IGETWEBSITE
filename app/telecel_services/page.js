'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/adminWraper';

const API = 'https://iget.onrender.com/api/admin/telecel-portal';

const card = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden';
const cardHead = 'px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3';
const input = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40';
const btn = 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed';
const btnPrimary = `${btn} bg-blue-600 hover:bg-blue-700 text-white`;
const btnSecondary = `${btn} border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700`;

const SESSION_BADGE = {
  active: ['Logged in', 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'],
  expired: ['Expired', 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'],
  rejected: ['Ended by portal', 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'],
  no_token: ['Not logged in', 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300']
};

const PACK_BADGE = {
  active: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  suspended: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  exhausted: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  expired: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
};

const ORDER_STATE = {
  queued: ['Waiting', 'text-gray-500 dark:text-gray-400'],
  sending: ['Sending…', 'text-blue-600 dark:text-blue-400'],
  sent: ['Delivered', 'text-green-600 dark:text-green-400'],
  failed: ['Rejected', 'text-red-600 dark:text-red-400'],
  unknown: ['Unclear', 'text-amber-600 dark:text-amber-400']
};

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');
const fmtMins = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
const gbOf = (o) => {
  const cap = Number(o.capacity) || 0;
  return (cap >= 100 ? cap / 1000 : cap) * (Number(o.metadata?.quantity) || 1);
};

export default function TelecelPortalPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [pasteToken, setPasteToken] = useState('');
  const [showAccount, setShowAccount] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', phoneNumber: '', subscriberMsisdn: '', sharerLines: '', alertPhone: '' });

  const call = useCallback(async (method, path, body) => {
    const token = localStorage.getItem('igettoken');
    if (!token) throw new Error('Not signed in');
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) throw new Error(json.message || `Request failed (${res.status})`);
    return json;
  }, []);

  const load = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const [status, recent] = await Promise.all([call('GET', '/status'), call('GET', '/orders?limit=20')]);
      setData(status.data);
      setOrders(recent.data || []);
      if (!quiet) {
        const c = status.data.config;
        setForm(f => ({ ...f, email: c.email || '', phoneNumber: c.phoneNumber || '', subscriberMsisdn: c.subscriberMsisdn || '', sharerLines: (c.sharerLines || []).join(', '), alertPhone: c.alertPhone || '' }));
        if (!c.configured) setShowAccount(true);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userData') || 'null');
    if (!user || !(user.id || user._id) || user.role !== 'admin') {
      router.push('/Signin');
      return;
    }
    load();
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, [router, load]);

  const run = async (key, fn, okMessage) => {
    setBusy(key);
    setError(null);
    try {
      const r = await fn();
      setSuccess(okMessage || r?.message || 'Done');
      setTimeout(() => setSuccess(null), 5000);
      await load(true);
      return r;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const sendCode = () => run('otp', async () => {
    const r = await call('POST', '/otp');
    setOtpSent(true);
    return r;
  });
  const login = () => run('login', async () => {
    const r = await call('POST', '/login', { otp });
    setOtp('');
    setOtpSent(false);
    return r;
  });
  const savePasted = () => run('paste', async () => {
    const r = await call('POST', '/token', { token: pasteToken });
    setPasteToken('');
    setShowPaste(false);
    return r;
  });
  const saveAccount = (e) => {
    e.preventDefault();
    run('account', async () => {
      const body = { ...form };
      if (!body.password) delete body.password;
      const r = await call('PUT', '/config', body);
      setForm(f => ({ ...f, password: '' }));
      return r;
    });
  };
  const syncNow = () => run('sync', () => call('POST', '/sync'));
  const setPackStatus = (packId, status) => run(`pack-${packId}`, () => call('PATCH', `/packs/${encodeURIComponent(packId)}`, { status }));

  const session = data?.session;
  const config = data?.config;
  const [badgeText, badgeClass] = SESSION_BADGE[session?.status] || SESSION_BADGE.no_token;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Telecel Portal</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Deliver Telecel orders from iGet&apos;s own Telecel Bundle Sharer account.
            </p>
          </div>
          {data && (
            <a href="/admin-settings" className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
              data.laneEnabled ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              <span className={`h-2 w-2 rounded-full ${data.laneEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              {data.laneEnabled ? 'Delivery is ON' : 'Delivery is OFF — turn on in API Configure'}
            </a>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-300 flex justify-between gap-3">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700" aria-label="Dismiss">✕</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-700 dark:text-green-300">
            {success}
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-300 border-t-blue-500" />
          </div>
        ) : data && (
          <>
            {/* Login */}
            <section className={card}>
              <div className={cardHead}>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Portal login</h2>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${badgeClass}`}>{badgeText}</span>
                </div>
                {session?.status === 'active' && (
                  <span className={`text-sm ${session.minutesLeft < 60 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    Ends in {fmtMins(session.minutesLeft)}
                  </span>
                )}
              </div>
              <div className="px-5 py-4 space-y-4">
                {session?.status === 'active' ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Logged in {fmtDate(session.loggedInAt)}{session.loggedInBy ? ` by ${session.loggedInBy}` : ''}.
                    {' '}Sends this login: {session.sends.succeeded}/{session.sends.attempted} delivered.
                    {session.minutesLeft < 60 && ' Log in again soon so Telecel orders keep moving.'}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {session?.message}. While logged out, paid Telecel orders <b>wait</b> — none are failed — and go out once you log in.
                  </p>
                )}
                {!config.alertPhone && !config.alertPhoneFromEnv && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    No alert phone set, so nobody is texted when the login is ending.{' '}
                    <button onClick={() => setShowAccount(true)} className="underline">Add one</button>
                  </p>
                )}
                {session?.lastError && (
                  <p className="text-xs text-red-600 dark:text-red-400">Last problem: {session.lastError.message}</p>
                )}

                {!config.configured ? (
                  <p className="text-sm text-amber-700 dark:text-amber-400">Fill in the account details below before logging in.</p>
                ) : (
                  <div className="flex flex-wrap items-end gap-3">
                    <button onClick={sendCode} disabled={busy === 'otp'} className={otpSent ? btnSecondary : btnPrimary}>
                      {busy === 'otp' ? 'Sending…' : otpSent ? 'Send a new code' : 'Send login code'}
                    </button>
                    {otpSent && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Code sent to {config.phoneNumber}</label>
                          <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} inputMode="numeric"
                            maxLength={8} placeholder="123456" className={`${input} w-36 tracking-widest`} />
                        </div>
                        <button onClick={login} disabled={busy === 'login' || otp.length < 4} className={btnPrimary}>
                          {busy === 'login' ? 'Logging in…' : 'Log in'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <button onClick={() => setShowPaste(v => !v)} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
                    {showPaste ? 'Hide' : 'Emergency: paste a session token from a logged-in browser'}
                  </button>
                  {showPaste && (
                    <div className="mt-2 flex flex-col sm:flex-row gap-2">
                      <input value={pasteToken} onChange={e => setPasteToken(e.target.value.trim())} placeholder="eyJhbGciOi..." className={`${input} font-mono text-xs`} />
                      <button onClick={savePasted} disabled={busy === 'paste' || !pasteToken} className={btnSecondary}>Save token</button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Queue */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Waiting to send', data.queue.waiting, 'text-gray-900 dark:text-white'],
                ['Delivered (24h)', data.queue.sent24h, 'text-green-600 dark:text-green-400'],
                ['Rejected', data.queue.failed, data.queue.failed ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'],
                ['Unclear', data.queue.unknown, data.queue.unknown ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white']
              ].map(([label, value, color]) => (
                <div key={label} className={`${card} px-4 py-3`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
                </div>
              ))}
            </section>
            {(data.queue.failed > 0 || data.queue.unknown > 0) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3">
                Rejected and unclear orders stay pending. Retry or refund them on the <a href="/admin-orders" className="text-blue-600 dark:text-blue-400 hover:underline">Orders</a> page. For unclear ones, check the portal&apos;s beneficiary list first — the customer may already have the data.
              </p>
            )}

            {/* Packs */}
            <section className={card}>
              <div className={cardHead}>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Data packs</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {data.totals.activePacks} active · {data.totals.gbRemaining} GB left · {data.totals.slotsRemaining} new-customer slots left
                    {config.lastSyncAt && ` · synced ${fmtDate(config.lastSyncAt)}`}
                  </p>
                </div>
                <button onClick={syncNow} disabled={busy === 'sync' || session?.status !== 'active'} className={btnSecondary}
                  title={session?.status !== 'active' ? 'Log in first' : 'Refresh packs from the portal'}>
                  {busy === 'sync' ? 'Syncing…' : 'Sync now'}
                </button>
              </div>
              {config.lastSyncResult?.startsWith('Failed') && (
                <p className="px-5 pt-3 text-xs text-red-600 dark:text-red-400">{config.lastSyncResult}</p>
              )}
              {data.packs.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400">
                  No packs yet. Buy a Bundle Sharer pack on the Telecel portal, then log in here and press Sync now.
                  Checkout shows Telecel as out of stock until a pack has data.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/40 text-xs text-gray-500 dark:text-gray-400 text-left">
                      <tr>
                        {['Plan', 'Line', 'Data left', 'Customers', 'Expires', 'Status', ''].map(h => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {data.packs.map(p => {
                        const pct = p.gbTotal ? Math.round((p.gbRemaining / p.gbTotal) * 100) : 0;
                        return (
                          <tr key={p.packId} className="text-gray-700 dark:text-gray-200">
                            <td className="px-4 py-3">{p.plan}</td>
                            <td className="px-4 py-3 font-mono text-xs">{p.leadMsisdn?.replace(/^233/, '0')}</td>
                            <td className="px-4 py-3 min-w-[140px]">
                              <div className="flex justify-between text-xs"><span>{p.gbRemaining} / {p.gbTotal} GB</span><span>{pct}%</span></div>
                              <div className="mt-1 h-1.5 rounded bg-gray-100 dark:bg-gray-700"><div className={`h-1.5 rounded ${pct < 15 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>
                            </td>
                            <td className="px-4 py-3">{p.slotsUsed} / {p.slotsTotal || '—'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{new Date(p.expiresAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3"><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PACK_BADGE[p.status] || ''}`}>{p.status}</span></td>
                            <td className="px-4 py-3 text-right">
                              {p.status === 'active' && (
                                <button onClick={() => setPackStatus(p.packId, 'suspended')} disabled={busy === `pack-${p.packId}`} className="text-xs text-amber-700 dark:text-amber-400 hover:underline">Pause</button>
                              )}
                              {p.status === 'suspended' && (
                                <button onClick={() => setPackStatus(p.packId, 'active')} disabled={busy === `pack-${p.packId}`} className="text-xs text-green-700 dark:text-green-400 hover:underline">Resume</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Recent orders */}
            <section className={card}>
              <div className={cardHead}>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent portal orders</h2>
                <button onClick={() => load(true)} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">Refresh</button>
              </div>
              {orders.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400">No orders have gone through the portal yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/40 text-xs text-gray-500 dark:text-gray-400 text-left">
                      <tr>{['Ref', 'Number', 'Size', 'Portal', 'Order', 'Placed'].map(h => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {orders.map(o => {
                        const [label, color] = ORDER_STATE[o.portalSubmission?.state] || [o.portalSubmission?.state, ''];
                        return (
                          <tr key={o._id} className="text-gray-700 dark:text-gray-200 align-top">
                            <td className="px-4 py-3 font-mono text-xs">{o.orderReference}</td>
                            <td className="px-4 py-3 font-mono text-xs">{o.recipientNumber}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{gbOf(o)} GB</td>
                            <td className="px-4 py-3 max-w-xs">
                              <span className={`text-xs font-medium ${color}`}>{label}</span>
                              {o.portalSubmission?.lastError && o.portalSubmission.state !== 'sent' && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 break-words">{o.portalSubmission.lastError}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs capitalize">{o.status}</td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Account */}
            <section className={card}>
              <div className={cardHead}>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Portal account</h2>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${config.configured ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {config.configured ? 'Set up' : `Missing: ${config.missing.join(', ')}`}
                  </span>
                </div>
                <button onClick={() => setShowAccount(v => !v)} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">{showAccount ? 'Hide' : 'Edit'}</button>
              </div>
              {config.passwordError && <p className="px-5 pt-3 text-xs text-red-600 dark:text-red-400">{config.passwordError}</p>}
              {showAccount && (
                <form onSubmit={saveAccount} className="px-5 py-4 grid sm:grid-cols-2 gap-4">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Portal email
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={`${input} mt-1`} />
                  </label>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Portal password {config.passwordSet && '(leave blank to keep)'}
                    <input type="password" autoComplete="new-password" required={!config.passwordSet} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={`${input} mt-1`} />
                  </label>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Phone that receives the login code
                    <input required value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} placeholder="0241234567" className={`${input} mt-1`} />
                  </label>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Sharer line (the number data is shared from)
                    <input required value={form.subscriberMsisdn} onChange={e => setForm({ ...form, subscriberMsisdn: e.target.value })} placeholder="0501234567" className={`${input} mt-1`} />
                  </label>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Extra sharer lines on the same account (optional, comma separated)
                    <input value={form.sharerLines} onChange={e => setForm({ ...form, sharerLines: e.target.value })} placeholder="0501234568, 0501234569" className={`${input} mt-1`} />
                  </label>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Alert phone — texted when the login is about to end or has ended
                    <input value={form.alertPhone} onChange={e => setForm({ ...form, alertPhone: e.target.value })} placeholder="0241234567" className={`${input} mt-1`} />
                  </label>
                  <div className="sm:col-span-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">The password is stored encrypted and is never shown again. Changing the email or line logs you out.</p>
                    <button type="submit" disabled={busy === 'account'} className={btnPrimary}>{busy === 'account' ? 'Saving…' : 'Save'}</button>
                  </div>
                </form>
              )}
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
