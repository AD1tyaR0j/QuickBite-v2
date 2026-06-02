import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

// Customer screens
import CustomerLayout from './customer/CustomerLayout.jsx';
import Dashboard from './customer/Dashboard.jsx';
import Menu from './customer/Menu.jsx';
import OrderConfirmation from './customer/OrderConfirmation.jsx';
import OrderTracking from './customer/OrderTracking.jsx';
import CustomerProfile from './customer/CustomerProfile.jsx';
import CustomerOrderHistory from './customer/CustomerOrderHistory.jsx';
import AboutQuickBite from './customer/AboutQuickBite.jsx';
import Login from './customer/Login.jsx';
import SignUp from './customer/SignUp.jsx';
import PaymentScreen from './customer/PaymentScreen.jsx';
import MultiCart from './customer/MultiCart.jsx';

// Vendor screens
import VendorLayout from './vendor/VendorLayout.jsx';
import LiveDashboard from './vendor/LiveDashboard.jsx';
import VendorOrders from './vendor/VendorOrders.jsx';
import MenuManagement from './vendor/MenuManagement.jsx';
import VendorProfile from './vendor/VendorProfile.jsx';

// Customer Protected Route Wrapper
function CustomerProtectedRoute({ children }) {
  const { token, currentUser, authLoading } = useApp();
  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface dark:bg-dark-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!token || !currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Vendor Protected Route Wrapper
function VendorProtectedRoute({ children }) {
  const { token, vendorUser, authLoading } = useApp();
  const { shopId } = useParams();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface dark:bg-dark-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || !vendorUser) {
    return <Navigate to="/login" replace />;
  }

  // Prevent accessing other vendors' shops - automatic redirect
  if (vendorUser.shopId !== shopId) {
    return <Navigate to={`/vendor/${vendorUser.shopId}/live`} replace />;
  }

  return children;
}

function AppContent() {
  const { toasts, removeToast, darkMode } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Connection error states
  const [showConnectionError, setShowConnectionError] = useState(false);
  const [failedUrl, setFailedUrl] = useState('');
  const [apiInput, setApiInput] = useState(() => localStorage.getItem('quickbite-api-base-url') || 'https://79c42791aa6526.lhr.life');

  useEffect(() => {
    const handleFailed = (e) => {
      setFailedUrl(e.detail.url);
      setShowConnectionError(true);
    };
    window.addEventListener('quickbite-connection-failed', handleFailed);
    return () => window.removeEventListener('quickbite-connection-failed', handleFailed);
  }, []);

  // Dynamic Status Bar Style & Colors depending on Dark Mode state
  useEffect(() => {
    if (window.Capacitor) {
      StatusBar.setStyle({
        style: darkMode ? Style.Dark : Style.Light
      }).catch(console.error);

      StatusBar.setBackgroundColor({
        color: darkMode ? '#0a1128' : '#f0f5fa'
      }).catch(console.error);
    }
  }, [darkMode]);

  // Handle hardware Android back button
  useEffect(() => {
    if (window.Capacitor) {
      const backListener = CapApp.addListener('backButton', () => {
        const rootPaths = ['/customer/home', '/login', '/signup', '/vendor/'];
        const currentPath = location.pathname;

        // If on home/landing or login pages, exit the app. Otherwise, pop history
        if (
          rootPaths.some(p => currentPath === p || (p === '/vendor/' && currentPath.includes('/live'))) ||
          currentPath === '/'
        ) {
          CapApp.exitApp();
        } else {
          navigate(-1);
        }
      });

      return () => {
        backListener.then(h => h.remove());
      };
    }
  }, [navigate, location]);

  return (
    <>
      {/* ── Global Animated Toasts Container ─────────────────── */}
      <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, y: -10, transition: { duration: 0.2 } }}
              layout
              onClick={() => removeToast(toast.id)}
              className={`p-4 rounded-2xl shadow-xl border cursor-pointer pointer-events-auto flex items-start gap-3.5 backdrop-blur-md transition-all active:scale-[0.98] ${
                toast.type === 'success'
                  ? 'bg-green-500/90 text-white border-green-400/50 shadow-green-500/10'
                  : toast.type === 'error'
                  ? 'bg-red-500/90 text-white border-red-400/50 shadow-red-500/10'
                  : 'bg-white/95 dark:bg-[#1a2542]/95 text-slate-800 dark:text-white border-slate-100 dark:border-[#2e4374]/60 shadow-slate-900/10'
              }`}
            >
              <span className={`material-symbols-outlined shrink-0 ${toast.type === 'success' || toast.type === 'error' ? 'text-white' : 'text-orange-500'}`}>
                {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'warning' : 'info'}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-headline font-bold text-xs tracking-tight">{toast.title}</h4>
                <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed font-medium">{toast.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/customer/home" replace />} />

        {/* Customer routes — has persistent bottom nav */}
        <Route path="/customer" element={<CustomerLayout />}>
          <Route path="home" element={<Dashboard />} />
          <Route path="orders" element={
            <CustomerProtectedRoute>
              <OrderTracking />
            </CustomerProtectedRoute>
          } />
          <Route path="profile" element={
            <CustomerProtectedRoute>
              <CustomerProfile />
            </CustomerProtectedRoute>
          } />
          <Route path="cart" element={
            <CustomerProtectedRoute>
              <MultiCart />
            </CustomerProtectedRoute>
          } />
        </Route>

        {/* Customer flow routes — has full-screen, no bottom nav from layout */}
        <Route path="/customer/menu/:shopId" element={<Menu />} />
        <Route path="/customer/confirm/:shopId/:itemId" element={
          <CustomerProtectedRoute>
            <OrderConfirmation />
          </CustomerProtectedRoute>
        } />
        <Route path="/customer/payment/:shopId/:itemId" element={
          <CustomerProtectedRoute>
            <PaymentScreen />
          </CustomerProtectedRoute>
        } />
        <Route path="/customer/track/:orderId" element={
          <CustomerProtectedRoute>
            <OrderTracking />
          </CustomerProtectedRoute>
        } />
        <Route path="/orders/history" element={
          <CustomerProtectedRoute>
            <CustomerOrderHistory />
          </CustomerProtectedRoute>
        } />
        <Route path="/about" element={<AboutQuickBite />} />

        {/* Vendor default redirect */}
        <Route path="/vendor" element={
          <VendorProtectedRoute>
            <OutletDummy />
          </VendorProtectedRoute>
        } />

        {/* Vendor routes — has persistent vendor bottom nav */}
        <Route path="/vendor/:shopId" element={
          <VendorProtectedRoute>
            <VendorLayout />
          </VendorProtectedRoute>
        }>
          <Route path="live" element={<LiveDashboard />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="profile" element={<VendorProfile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/customer/home" replace />} />
      </Routes>

      {/* ── Universal Connection Error Dialog ───────────────── */}
      <AnimatePresence>
        {showConnectionError && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-fade-in">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#16213E] rounded-3xl p-6 w-full max-w-md relative z-10 border border-slate-100 dark:border-slate-800/40 shadow-2xl flex flex-col gap-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 text-red-500 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl animate-pulse">wifi_off</span>
              </div>
              <div>
                <h3 className="font-headline font-black text-xl text-on-surface dark:text-white">Connection Failed</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Unable to connect to the backend server. The public proxy tunnel address may have changed.
                </p>
              </div>

              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Backend API URL
                  </label>
                  <input
                    type="url"
                    value={apiInput}
                    onChange={(e) => setApiInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                    placeholder="https://your-tunnel.lhr.life"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    localStorage.setItem('quickbite-api-base-url', apiInput.trim());
                    window.location.reload();
                  }}
                  className="flex-1 bg-primary-gradient text-slate-900 font-headline font-black py-3.5 rounded-xl shadow-md active:scale-95 transition-all text-xs"
                >
                  Save & Reconnect
                </button>
                <button
                  onClick={() => setShowConnectionError(false)}
                  className="px-4 bg-slate-100 dark:bg-slate-800 text-zinc-500 dark:text-zinc-300 font-bold rounded-xl text-xs active:scale-95 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}

// Dummy page component for vendor redirect
function OutletDummy() {
  const { vendorUser } = useApp();
  return <Navigate to={`/vendor/${vendorUser?.shopId || 'kitchen-kukkries'}/live`} replace />;
}
