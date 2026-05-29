import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';

// ── Customer Bottom Navigation (3 tabs: Explore / Orders / Profile) ──
export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeOrder } = useApp();

  const tabs = [
    { to: '/customer/home', icon: 'explore', label: 'Explore' },
    { to: activeOrder ? `/customer/track/${activeOrder.id}` : '/customer/orders', icon: 'receipt_long', label: 'Orders' },
    { to: '/customer/profile', icon: 'person', label: 'Profile' },
  ];

  // Check which tab is active
  const isActive = (tab) => {
    if (tab.label === 'Orders') {
      return location.pathname.startsWith('/customer/orders') || location.pathname.startsWith('/customer/track');
    }
    return location.pathname === tab.to;
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-dark-bg font-body text-on-background">
      {/* Page content */}
      <Outlet />

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 md:bottom-4 left-0 right-0 max-w-md mx-auto w-full z-50 flex justify-around items-center px-4 pb-6 md:pb-3 pt-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[0_-4px_30px_rgba(0,0,0,0.1)] md:shadow-[0_10px_30px_rgba(0,0,0,0.15)] rounded-t-3xl md:rounded-2xl border-t md:border border-slate-100 dark:border-slate-800">
        {tabs.map(tab => {
          const active = isActive(tab);
          return (
            <button
              key={tab.label}
              id={`nav-${tab.label.toLowerCase()}`}
              onClick={() => navigate(tab.to)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-200 active:scale-90 ${
                active
                  ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-orange-500'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {tab.icon}
              </span>
              <span className="text-[10px] font-medium font-['Inter'] tracking-wider uppercase mt-1">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
