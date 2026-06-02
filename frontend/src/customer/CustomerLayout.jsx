import React, { useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';

// ── Customer Bottom Navigation (4 tabs: Explore / Cart / Orders / Profile) ──
export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeOrder, cartByShop } = useApp();

  const totalCartCount = useMemo(() => {
    return Object.values(cartByShop).reduce((sum, shopCart) => {
      const entries = shopCart && shopCart.items ? Object.values(shopCart.items) : [];
      return sum + entries.reduce((s, it) => s + (it.qty || 0), 0);
    }, 0);
  }, [cartByShop]);

  const tabs = [
    { to: '/customer/home', icon: 'explore', label: 'Explore' },
    { to: '/customer/cart', icon: 'shopping_basket', label: 'Cart', badge: totalCartCount },
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
    <div className="flex flex-col min-h-screen bg-surface dark:bg-dark-bg font-body text-on-background">
      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 md:bottom-4 left-0 right-0 max-w-5xl mx-auto w-full z-50 flex justify-around items-center px-4 pb-6 md:pb-3 pt-3 bg-white/95 dark:bg-[#101f42]/95 backdrop-blur-xl shadow-[0_-4px_30px_rgba(0,0,0,0.1)] md:shadow-[0_10px_30px_rgba(0,0,0,0.15)] rounded-t-3xl md:rounded-2xl border-t md:border border-slate-200/50 dark:border-[#2e4374]/40">
        {tabs.map(tab => {
          const active = isActive(tab);
          return (
            <button
              key={tab.label}
              id={`nav-${tab.label.toLowerCase()}`}
              onClick={() => navigate(tab.to)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-200 active:scale-90 ${
                active
                  ? 'bg-primary/20 dark:bg-primary/10 text-orange-600 dark:text-primary font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-orange-500'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className="material-symbols-outlined"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {tab.icon}
                </span>
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
                    {tab.badge}
                  </span>
                )}
              </div>
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
