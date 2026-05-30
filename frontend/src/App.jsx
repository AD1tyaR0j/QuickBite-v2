import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { toasts, removeToast } = useApp();

  return (
    <BrowserRouter>
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
        </Route>

        {/* Customer flow routes — full-screen, no bottom nav from layout */}
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
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

// Dummy page component for vendor redirect
function OutletDummy() {
  const { vendorUser } = useApp();
  return <Navigate to={`/vendor/${vendorUser?.shopId || 'kitchen-kukkries'}/live`} replace />;
}
