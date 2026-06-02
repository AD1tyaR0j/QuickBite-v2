import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { motion } from 'framer-motion';

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, addToast } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      addToast('Validation Error', 'Passwords do not match.', 'error');
      return;
    }

    if (password.length < 6) {
      addToast('Validation Error', 'Password must be at least 6 characters.', 'error');
      return;
    }

    if (phone.length < 10) {
      addToast('Validation Error', 'Please enter a valid 10-digit phone number.', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(
        name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        password,
        collegeId.trim() || null
      );

      if (result.success) {
        navigate('/customer/home');
      } else {
        addToast('Registration Failed', result.error || 'Check details and try again.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error', 'Unable to connect to the server. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D1A] flex flex-col justify-center px-6 py-12 relative overflow-hidden font-body">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3 mb-4">
          <img src="/quickbite_logo.png" alt="QuickBite Logo" className="w-16 h-16 object-contain rounded-full shadow-md pulse-indicator" />
          <h2 className="text-3xl font-black tracking-tighter text-gradient font-headline italic">
            QuickBite
          </h2>
        </div>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-medium">
          Create an account and start ordering smarter.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-white dark:bg-[#16213E] py-8 px-6 shadow-2xl rounded-3xl border border-slate-100 dark:border-[#2E2E5E]/40 backdrop-blur-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-zinc-400 text-sm">person</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl pl-11 pr-4 py-3.5 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 transition-all placeholder-zinc-400"
                  placeholder="Alex Johnson"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-zinc-400 text-sm">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl pl-11 pr-4 py-3.5 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 transition-all placeholder-zinc-400"
                    placeholder="alex@college.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-zinc-400 text-sm">call</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl pl-11 pr-4 py-3.5 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 transition-all placeholder-zinc-400"
                    placeholder="9876543210"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                College ID (Optional)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-zinc-400 text-sm">badge</span>
                <input
                  type="text"
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl pl-11 pr-4 py-3.5 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 transition-all placeholder-zinc-400"
                  placeholder="COL-2026-089"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Password
                </label>
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-zinc-400 text-sm">lock</span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl pl-11 pr-4 py-3.5 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 transition-all placeholder-zinc-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary-gradient rounded-xl font-headline font-bold text-white shadow-lg shadow-primary/20 hover:opacity-95 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#2E2E5E]/20 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-bold text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
