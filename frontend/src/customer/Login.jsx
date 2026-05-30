import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, vendorLogin, addToast } = useApp();

  const [isVendorTab, setIsVendorTab] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
 
  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
 
  const from = location.state?.from?.pathname || '/customer/home';
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg('');
 
    try {
      if (isVendorTab) {
        if (!username.trim() || !password) {
          setErrorMsg('Please enter your Vendor ID and password.');
          setLoading(false);
          return;
        }
        const result = await vendorLogin(username.trim(), password);
        if (result.success) {
          navigate(`/vendor/${result.shopId}/live`);
        } else {
          setErrorMsg(result.error || 'Invalid Vendor ID or password.');
          addToast('Login Failed', result.error || 'Invalid credentials.', 'error');
        }
      } else {
        if (!email.trim() || !password) {
          setErrorMsg('Please enter your email and password.');
          setLoading(false);
          return;
        }
        const result = await login(email.trim(), password);
        if (result.success) {
          navigate(from, { replace: true });
        } else {
          setErrorMsg(result.error || 'Invalid email or password.');
          addToast('Login Failed', result.error || 'Invalid credentials.', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred during login. Please try again.');
      addToast('Error', 'An error occurred during login. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (forgotNewPassword !== forgotConfirmPassword) {
      addToast('Validation Error', 'Passwords do not match.', 'error');
      return;
    }
    if (forgotNewPassword.length < 6) {
      addToast('Validation Error', 'Password must be at least 6 characters.', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, newPassword: forgotNewPassword })
      });
      const json = await res.json();
      if (json.success) {
        addToast('Success', 'Password has been reset successfully. Please log in.', 'success');
        setShowForgotModal(false);
        setForgotEmail('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      } else {
        addToast('Reset Failed', json.error || 'Error resetting password.', 'error');
      }
    } catch (err) {
      addToast('Error', 'Unable to reset password.', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D1A] flex flex-col justify-center px-6 py-12 relative overflow-hidden font-body">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-4xl text-primary pulse-indicator" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
          <h2 className="text-3xl font-extrabold tracking-tighter text-gradient font-headline italic">
            QuickBite
          </h2>
        </div>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-medium">
          {isVendorTab ? 'Cafeteria Manager Portal' : 'Queue-Aware Predictive Food Ordering'}
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-white dark:bg-[#16213E] py-8 px-6 shadow-2xl rounded-3xl border border-slate-100 dark:border-[#2E2E5E]/40 backdrop-blur-xl">
          {/* Tab selector */}
          <div className="flex p-1 bg-slate-100 dark:bg-[#0D0D1A] rounded-2xl mb-8">
            <button
              onClick={() => { setIsVendorTab(false); setPassword(''); setErrorMsg(''); }}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${!isVendorTab ? 'bg-primary text-slate-900 font-extrabold shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'}`}
            >
              Customer
            </button>
            <button
              onClick={() => { setIsVendorTab(true); setPassword(''); setErrorMsg(''); }}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${isVendorTab ? 'bg-primary text-slate-900 font-extrabold shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'}`}
            >
              Vendor
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5 border border-red-100 dark:border-red-900/50"
              >
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </motion.div>
            )}
            {!isVendorTab ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-zinc-400 text-sm">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl pl-11 pr-4 py-3.5 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 transition-all placeholder-zinc-400"
                    placeholder="name@college.edu"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Vendor Username / ID
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-zinc-400 text-sm">storefront</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl pl-11 pr-4 py-3.5 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 transition-all placeholder-zinc-400"
                    placeholder="e.g. kukkries"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Password
                </label>
                {!isVendorTab && (
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-zinc-400 text-sm">lock</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl pl-11 pr-4 py-3.5 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 transition-all placeholder-zinc-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-primary border-slate-300 dark:border-[#2E2E5E] focus:ring-primary w-4 h-4 bg-slate-50 dark:bg-[#0D0D1A]"
                />
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-headline font-bold text-slate-900 shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                isVendorTab 
                  ? 'bg-gradient-to-br from-primary to-orange-500 hover:opacity-95 shadow-primary/20' 
                  : 'bg-primary-gradient hover:opacity-95 shadow-primary/20'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {!isVendorTab && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#2E2E5E]/20 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                New to QuickBite?{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="font-bold text-primary hover:underline"
                >
                  Create an account
                </button>
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-[#16213E] rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-[#2E2E5E]/40"
          >
            <h3 className="font-headline text-xl font-bold text-on-surface dark:text-white mb-2">
              Forgot Password
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              Enter your email and define your new password to reset it.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50"
                  placeholder="alex@quickbite.com"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-zinc-500 bg-slate-50 dark:bg-[#0D0D1A] dark:text-zinc-400 hover:bg-slate-100 active:scale-95 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-[2] py-3 rounded-xl font-bold text-white bg-primary-gradient shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Reset Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
