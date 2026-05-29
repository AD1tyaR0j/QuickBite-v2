import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';

export default function VendorOrders() {
  const { shopId } = useParams();
  const { fetchApi } = useApp();

  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    revenue: 0,
    peakHours: 'N/A',
    popularItem: 'N/A',
    averageEpt: 10
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Today'); // 'Today' | 'This Week' | 'All Time'

  // Map Tab names to API period values
  const tabToPeriod = {
    'Today': 'daily',
    'This Week': 'weekly',
    'All Time': 'monthly'
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const period = tabToPeriod[activeTab];
      const [ordersRes, analyticsRes] = await Promise.all([
        fetchApi(`/api/orders?shopId=${shopId}`),
        fetchApi(`/api/analytics?shopId=${shopId}&period=${period}`)
      ]);
      const ordersJson = await ordersRes.json();
      const analyticsJson = await analyticsRes.json();
      
      if (ordersJson.success) setOrders(ordersJson.data);
      if (analyticsJson.success) setAnalytics(analyticsJson.data);
    } catch (e) {
      console.error('Failed to load vendor orders data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId, activeTab]);

  const completedOrders = orders
    .filter(o => o.status === 'Completed')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D1A] font-body text-on-surface pb-32">
      
      {/* ── Top Custom Bar ───────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 max-w-7xl mx-auto w-full z-50 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm border-b border-slate-100 dark:border-slate-800/40 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">restaurant_menu</span>
          <h1 className="text-lg font-black text-orange-600 dark:text-orange-400 tracking-tight font-headline">QuickBite Vendor</h1>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-95 duration-200">
          <span className="material-symbols-outlined text-slate-500">notifications</span>
        </button>
      </header>

      <main className="pt-20 px-6 max-w-7xl mx-auto min-h-screen space-y-6">
        
        {/* ── Filter Period Tabs ──────────────────────────────── */}
        <div className="flex p-1 bg-slate-100 dark:bg-[#0D0D1A] rounded-2xl">
          {['Today', 'This Week', 'All Time'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-md'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Dynamic Sales Analytics Bento Grid ──────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-black text-base tracking-tight text-on-surface dark:text-white">
              Sales Analytics ({activeTab})
            </h2>
            <span className="text-[9px] uppercase tracking-widest text-primary font-bold bg-primary/5 px-2.5 py-1 rounded-full animate-pulse">
              Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            {/* Revenue Widget */}
            <div className="col-span-2 bg-gradient-to-br from-primary to-orange-500 p-5 rounded-3xl text-white shadow-lg shadow-primary/20 relative overflow-hidden group">
              <div className="relative z-10 space-y-3">
                <p className="text-white/80 font-label text-[10px] uppercase tracking-widest">Total Sales Earnings</p>
                <h3 className="text-3xl font-black font-headline tracking-tighter">₹{analytics.revenue.toLocaleString()}</h3>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white/95">
                  <span className="material-symbols-outlined text-base bg-white/20 p-1 rounded-full">trending_up</span>
                  <span>{analytics.totalOrders} total orders processed</span>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 scale-150 rotate-12">
                <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
            </div>

            {/* Total Orders Widget */}
            <div className="bg-white dark:bg-[#16213E] p-4 rounded-3xl border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="material-symbols-outlined text-tertiary text-lg">list_alt</span>
                <p className="text-[9px] font-bold uppercase tracking-wider">Orders</p>
              </div>
              <h4 className="text-xl font-black text-on-surface dark:text-white font-headline">{analytics.totalOrders}</h4>
            </div>

            {/* Average Preparation Time Widget */}
            <div className="bg-white dark:bg-[#16213E] p-4 rounded-3xl border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="material-symbols-outlined text-orange-500 text-lg">timer</span>
                <p className="text-[9px] font-bold uppercase tracking-wider">Avg Prep</p>
              </div>
              <h4 className="text-xl font-black text-on-surface dark:text-white font-headline">{analytics.averageEpt}m</h4>
            </div>

            {/* Popular Menu Item Widget */}
            <div className="bg-white dark:bg-[#16213E] p-4 rounded-3xl border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-1 col-span-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="material-symbols-outlined text-red-500 text-lg">favorite</span>
                <p className="text-[9px] font-bold uppercase tracking-wider">Popular Dish</p>
              </div>
              <h4 className="text-sm font-bold text-on-surface dark:text-white truncate">{analytics.popularItem}</h4>
            </div>

            {/* Peak Kitchen Hours Widget */}
            <div className="bg-white dark:bg-[#16213E] p-4 rounded-3xl border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-1 col-span-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="material-symbols-outlined text-purple-500 text-lg">schedule</span>
                <p className="text-[9px] font-bold uppercase tracking-wider">Kitchen Peak Hours</p>
              </div>
              <h4 className="text-sm font-bold text-on-surface dark:text-white truncate">{analytics.peakHours}</h4>
            </div>

          </div>
        </section>

        {/* ── Completed Orders History ─────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-black text-base tracking-tight text-on-surface dark:text-white">
              Completed Order Ledger
            </h2>
            <span className="text-primary font-bold text-xs">{completedOrders.length} orders</span>
          </div>

          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && completedOrders.length === 0 && (
            <div className="bg-white dark:bg-[#16213E] rounded-3xl p-8 border border-slate-100 dark:border-slate-800/40 text-center text-zinc-400">
              <span className="material-symbols-outlined text-4xl block mb-2">receipt_long</span>
              <p className="text-sm font-semibold">No orders finalized</p>
              <p className="text-xs text-zinc-500 mt-1">Finalized customer orders will append to this log.</p>
            </div>
          )}

          <div className="space-y-3">
            {completedOrders.map(order => (
              <div
                key={order.id}
                className="bg-white dark:bg-[#16213E] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-500">{order.displayId}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] text-zinc-400 font-semibold">{formatTime(order.updatedAt)}</span>
                  </div>
                  <h4 className="font-bold text-sm text-on-surface dark:text-white truncate mt-1">
                    {order.qty}x {order.itemName}
                  </h4>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 rounded text-[9px] font-bold uppercase tracking-wider">
                      Collected
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-zinc-500 rounded text-[9px] font-bold">
                      Wait: {order.ept}m
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-black text-on-surface dark:text-white">₹{order.itemPrice}</span>
                  <p className="text-[9px] text-zinc-400 mt-0.5 font-medium">{order.paymentMethod || 'Paid'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
