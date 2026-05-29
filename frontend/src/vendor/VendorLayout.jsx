import React from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';

// ── Vendor Layout with 4-tab Bottom Nav ───────────────────────
// Tabs: Live / Orders / Menu / Profile
export default function VendorLayout() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: 'live', icon: 'bolt', label: 'Live' },
    { path: 'orders', icon: 'receipt_long', label: 'Orders' },
    { path: 'menu', icon: 'menu_book', label: 'Menu' },
    { path: 'profile', icon: 'settings', label: 'Settings' },
  ];

  const isActive = (tab) => location.pathname.endsWith(`/${tab.path}`);

  return (
    <div className="min-h-screen bg-surface dark:bg-dark-bg font-body text-on-surface">
      <Outlet />

      {/* ── Vendor Bottom Nav (4 tabs) ─────────────────────── */}
      <nav className="fixed bottom-0 md:bottom-4 left-0 right-0 max-w-md mx-auto w-full h-20 flex justify-around items-center px-4 pb-safe bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl z-50 rounded-t-3xl md:rounded-2xl shadow-[0_-4px_20px_0_rgba(0,0,0,0.05)] md:shadow-[0_10px_30px_rgba(0,0,0,0.15)] md:border md:border-slate-100 dark:md:border-slate-800">
        {tabs.map(tab => {
          const active = isActive(tab);
          return (
            <button
              key={tab.path}
              id={`vendor-nav-${tab.path}`}
              onClick={() => navigate(`/vendor/${shopId}/${tab.path}`)}
              className={`flex flex-col items-center justify-center px-5 py-2 rounded-2xl transition-all duration-200 active:scale-95 ${
                active
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {tab.icon}
              </span>
              <span className="font-['Inter'] text-[10px] font-medium tracking-wide uppercase mt-1">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
