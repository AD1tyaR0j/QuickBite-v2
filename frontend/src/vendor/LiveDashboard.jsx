import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getFoodImage } from '../foodImageMap.js';
import { useApp } from '../store/AppContext.jsx';

// ── Vendor Live Dashboard ─────────────────────────────────────
// Route: /vendor/:shopId/live
// Shows: Active orders (Preparing + Ready), Add Offline Order form, stats
export default function LiveDashboard() {
  const { shopId } = useParams();
  const { fetchApi } = useApp();
  const [orders, setOrders] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [offlineQty, setOfflineQty] = useState(1);
  const [addingOffline, setAddingOffline] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const [ordersRes, shopRes, menuRes] = await Promise.all([
        fetchApi(`/api/orders?shopId=${shopId}`),
        fetchApi(`/api/shops/${shopId}`),
        fetchApi(`/api/shops/${shopId}/menu`),
      ]);
      const ordersJson = await ordersRes.json();
      const shopJson = await shopRes.json();
      const menuJson = await menuRes.json();
      if (ordersJson.success) setOrders(ordersJson.data);
      if (shopJson.success) setShop(shopJson.data);
      if (menuJson.success) setMenu(menuJson.data);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
    }
  }, [shopId, fetchApi]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = async (orderId, status) => {
    try {
      await fetchApi(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await fetchOrders();
      showToast(`Order updated to ${status}`);
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleAddOfflineOrder = async () => {
    if (!selectedMenuId || offlineQty < 1) return;
    setAddingOffline(true);
    try {
      const res = await fetchApi('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ shopId, menuItemId: selectedMenuId, qty: offlineQty }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedMenuId('');
        setOfflineQty(1);
        showToast('Offline order added to queue!');
        await fetchOrders();
      }
    } catch (e) {
      console.error('Failed to add offline order:', e);
    } finally {
      setAddingOffline(false);
    }
  };

  const relativeTime = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff === 1) return '1 min ago';
    return `${diff} mins ago`;
  };

  const activeOrders = orders.filter(o => ['Pending', 'Preparing', 'Almost Ready'].includes(o.status));
  const readyOrders = orders.filter(o => o.status === 'Ready');
  const completedToday = orders.filter(o => o.status === 'Completed').length;
  const preparingCount = orders.filter(o => o.status === 'Preparing' || o.status === 'Almost Ready').length;

  return (
    <div className="min-h-screen bg-surface dark:bg-dark-bg font-body text-on-surface">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 max-w-7xl mx-auto w-full z-50 flex justify-between items-center px-6 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">restaurant</span>
          <span className="text-xl font-extrabold text-yellow-600 dark:text-yellow-400 font-['Plus_Jakarta_Sans']">
            QuickBite Vendor
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 cursor-pointer hover:opacity-80">
            notifications
          </span>
          <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=100&q=80"
              alt="Vendor"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
        {/* ── Dashboard Header ──────────────────────────────── */}
        <header className="mb-8 flex flex-col justify-between gap-6">
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-background dark:text-dark-text mb-1">
              Live Kitchen
            </h1>
            <p className="text-on-surface-variant font-medium">
              {shop?.name || 'Loading...'} · {activeOrders.length} active orders
            </p>
          </div>

          {/* ── Add Offline Order Form ────────────────────── */}
          <div className="bg-surface-container-lowest dark:bg-dark-card p-4 rounded-xl premium-shadow border border-outline-variant/15 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Select Item
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-surface-container-low border-none rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-white flex justify-between items-center text-left hover:opacity-90 transition-opacity"
                >
                  <span className="truncate pr-2">
                    {selectedMenuId ? menu.find(m => m.id === selectedMenuId)?.name : 'Choose item...'}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    {isDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 min-w-[220px] max-h-[220px] overflow-y-auto bg-surface-container-lowest dark:bg-dark-card border border-outline-variant/10 rounded-xl shadow-2xl z-[70] py-1 flex flex-col">
                      {menu.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedMenuId(item.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors ${selectedMenuId === item.id ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface dark:text-dark-text'}`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 w-[70px]">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Qty
              </label>
              <input
                type="number"
                min="1"
                value={offlineQty}
                onChange={e => setOfflineQty(parseInt(e.target.value) || 1)}
                className="w-full bg-surface-container-low border-none rounded-lg px-2 py-2 focus:ring-2 focus:ring-primary-container text-sm dark:bg-slate-700 dark:text-white text-center"
              />
            </div>
            <button
              onClick={handleAddOfflineOrder}
              disabled={addingOffline || !selectedMenuId}
              className="bg-gradient-to-br from-primary to-primary-fixed text-on-primary px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-1 shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-10"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add</span>
            </button>
          </div>
        </header>

        {/* ── Stats Row ────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: 'In Progress', value: preparingCount, color: '' },
            { label: 'Ready to Pick', value: readyOrders.length, color: 'text-tertiary' },
            { label: 'Completed', value: completedToday, color: '' },
            { label: 'Total Orders', value: orders.length, color: '' },
          ].map(stat => (
            <div key={stat.label} className="bg-surface-container-low dark:bg-dark-surface p-4 rounded-xl flex flex-col gap-1">
              <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
              <span className={`text-2xl font-headline font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 gap-6">
            {/* ── Preparing Column ─────────────────────────── */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-headline font-bold text-xl flex items-center gap-2 text-on-surface dark:text-dark-text">
                  Preparing
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {activeOrders.length}
                  </span>
                </h2>
              </div>

              {activeOrders.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl block mb-3">restaurant</span>
                  <p className="font-medium">No active orders</p>
                  <p className="text-sm">New orders will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeOrders.map(order => (
                    <OrderCard key={order.id} order={order} onAction={updateStatus} relativeTime={relativeTime} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Ready Column ─────────────────────────────── */}
            <div className="space-y-4">
              <h2 className="font-headline font-bold text-xl flex items-center gap-2 text-on-surface dark:text-dark-text">
                Ready to Collect
                <span className="bg-secondary-container text-on-secondary-container text-xs px-2 py-0.5 rounded-full">
                  {readyOrders.length}
                </span>
              </h2>

              {readyOrders.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl block mb-2">check_circle</span>
                  <p className="text-sm">No orders ready yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {readyOrders.map(order => (
                    <div key={order.id} className="bg-surface-container-low dark:bg-dark-surface p-4 rounded-xl flex items-center justify-between border-l-4 border-on-secondary-container">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-on-secondary-container/10 flex items-center justify-center text-on-secondary-container">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-on-surface dark:text-dark-text">{order.displayId}</p>
                          <p className="text-xs text-on-surface-variant truncate max-w-[120px]">{order.itemName}</p>
                          <p className="text-xs text-on-surface-variant">{relativeTime(order.createdAt)}</p>
                        </div>
                      </div>
                      <button
                        id={`complete-btn-${order.id}`}
                        onClick={() => updateStatus(order.id, 'Completed')}
                        className="text-primary font-bold text-xs uppercase hover:underline active:scale-90 transition-transform"
                      >
                        Complete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Kitchen Load Card */}
              {shop && (
                <div className="mt-6 bg-on-tertiary-fixed text-on-tertiary p-5 rounded-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="font-headline font-bold text-base mb-1">Kitchen Load</h4>
                    <p className="text-on-tertiary/70 text-xs mb-3">
                      {activeOrders.length} orders in queue · {shop.cookCount} cooks active
                    </p>
                    <div className="w-full bg-on-tertiary-fixed-variant h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary shadow-[0_0_12px_rgba(255,165,0,0.5)] transition-all duration-500"
                        style={{ width: `${Math.min((activeOrders.length / 10) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] font-bold uppercase tracking-widest text-on-tertiary/60">
                      <span>Low</span>
                      <span>High Capacity</span>
                    </div>
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-tertiary-dim/20 rounded-full blur-3xl" />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Toast Notification ───────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-24 right-4 left-4 md:left-auto md:w-80 bg-inverse-surface text-on-primary-fixed p-4 rounded-xl shadow-2xl flex items-center justify-between z-[60] animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-fixed">check_circle</span>
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Order Card Component ──────────────────────────────────────
function OrderCard({ order, onAction, relativeTime }) {
  const getActionButton = () => {
    if (order.status === 'Pending') {
      return { label: 'Start Prep', nextStatus: 'Preparing', icon: 'play_arrow' };
    }
    if (order.status === 'Preparing') {
      return { label: 'Mark as Ready', nextStatus: 'Ready', icon: 'check_circle' };
    }
    if (order.status === 'Almost Ready') {
      return { label: 'Mark as Ready', nextStatus: 'Ready', icon: 'check_circle' };
    }
    return null;
  };

  const action = getActionButton();

  return (
    <div className="bg-surface-container-lowest dark:bg-dark-card rounded-xl p-5 premium-shadow border border-outline-variant/10 relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-on-surface dark:text-dark-text">{order.displayId}</h3>
          <p className="text-sm text-on-surface-variant">{order.itemName}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-tighter">
            {relativeTime(order.createdAt)}
          </span>
          {order.status === 'Pending' && (
            <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2.5 py-1 rounded-full border border-yellow-500/20 shadow-sm mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-wider">Awaiting Acceptance</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-3 py-2 border-b border-surface-container text-sm">
          {order.imageUrl ? (
            <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
              <img src={getFoodImage(order.itemName, order.imageUrl)} alt={order.itemName} className="w-full h-full object-cover" />
            </div>
          ) : (
             <div className="w-10 h-10 rounded-md bg-surface-container-high flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-outline-variant">fastfood</span>
             </div>
          )}
          <div className="flex-1">
            <span className="font-medium text-on-surface dark:text-dark-text block">{order.qty}x {order.itemName}</span>
            <span className="text-on-surface-variant text-xs">{order.ept} min prep</span>
          </div>
        </div>
      </div>

      {action && (
        <button
          id={`action-btn-${order.id}`}
          onClick={() => onAction(order.id, action.nextStatus)}
          className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-sm shadow-md hover:bg-primary-dim transition-colors flex items-center justify-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">{action.icon}</span>
          {action.label}
        </button>
      )}
    </div>
  );
}
