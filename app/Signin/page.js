'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../../images/igetLogo - Copy.jpg'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const formRef = useRef(null);

  const router = useRouter();

  // Rate limiting — lock after 5 failed attempts for 60s
  useEffect(() => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const timer = setTimeout(() => setLockoutUntil(null), lockoutUntil - Date.now());
      return () => clearTimeout(timer);
    }
  }, [lockoutUntil]);

  const sanitizeInput = (value) => {
    return value.replace(/[<>]/g, '').trim();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: sanitizeInput(value) }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username) {
      errors.username = 'Username is required';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!formData.email) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Enter a valid email address';
      }
      if (!formData.phone) {
        errors.phone = 'Phone number is required';
      } else if (!/^\d{10,15}$/.test(formData.phone.replace(/[^\d]/g, ''))) {
        errors.phone = 'Enter a valid phone number (10-15 digits)';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockoutUntil && Date.now() < lockoutUntil) {
      const seconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setError(`Too many attempts. Try again in ${seconds}s`);
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin
        ? 'https://iget.onrender.com/api/login'
        : 'https://iget.onrender.com/api/register';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        if (isLogin) {
          const attempts = loginAttempts + 1;
          setLoginAttempts(attempts);
          if (attempts >= 5) {
            setLockoutUntil(Date.now() + 60000);
            setLoginAttempts(0);
            throw new Error('Too many failed attempts. Account locked for 60 seconds.');
          }
        }
        throw new Error(data.message || 'Authentication failed');
      }

      setLoginAttempts(0);
      localStorage.setItem('igettoken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      router.push('/');

    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Check your connection and try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFieldErrors({});
    setFormData({ username: '', email: '', password: '', phone: '' });
  };

  const isLocked = lockoutUntil && Date.now() < lockoutUntil;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative w-44 h-14">
            <Image
              src={logo}
              alt="iGet Logo"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
          <h1 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-1">
            {isLogin ? 'Welcome back' : 'Get started'}
          </h1>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
            {isLogin ? 'Sign in to your account' : 'Create your account to continue'}
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-5">
              {error}
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {isLogin ? 'Username or Email' : 'Full Name'}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                autoComplete={isLogin ? 'username' : 'name'}
                className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors ${
                  fieldErrors.username ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
                placeholder={isLogin ? 'Enter username or email' : 'Enter your full name'}
              />
              {fieldErrors.username && <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>}
            </div>

            {/* Email + Phone (signup only) */}
            {!isLogin && (
              <>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors ${
                      fieldErrors.email ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                    }`}
                    placeholder="you@example.com"
                  />
                  {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                </div>

                <div className="mb-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    className={`w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors ${
                      fieldErrors.phone ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                    }`}
                    placeholder="0241234567"
                  />
                  {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                </div>
              </>
            )}

            {/* Password */}
            <div className="mb-5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors ${
                    fieldErrors.password ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.05 6.05m7.875 7.875l3.875 3.875M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : isLocked ? (
                'Temporarily locked'
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </button>

            {isLogin && (
              <div className="mt-3 text-center">
                <Link href="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="ml-1.5 text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Secured with end-to-end encryption
        </p>
      </div>
    </div>
  );
}
