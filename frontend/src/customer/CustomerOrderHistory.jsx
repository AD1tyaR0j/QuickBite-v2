import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CustomerOrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/orders');
        const json = await res.json();
        if (json.success) {
          const sorted = [...json.data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(sorted);
        }
      } catch (e) {
        console.error('Failed to load order history:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDateTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const platformFee = 5;

  return (
    <div className="min-h-screen bg-surface dark:bg-dark-bg font-body text-on-background animate-fade-in">
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto w-full flex justify-between items-center px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="hover:opacity-80 transition-opacity active:scale-95 duration-150 text-orange-600 dark:text-orange-400"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-['Plus_Jakarta_Sans'] font-bold tracking-tight text-lg text-orange-600 dark:text-orange-400">
            Order History
          </h1>
        </div>
      </header>

      <main className="pt-24 pb-10 px-6 max-w-2xl mx-auto">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4">receipt_long</span>
            <p className="font-headline text-lg font-bold text-on-surface dark:text-dark-text mb-1">
              No past orders yet
            </p>
            <p className="text-sm">Place an order to see it appear here.</p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map(order => {
              const items = Array.isArray(order.items) && order.items.length > 0
                ? order.items
                : [{
                    itemName: order.itemName,
                    itemPrice: order.itemPrice,
                    qty: order.qty,
                  }];
              const baseTotal = items.reduce(
                (sum, it) => sum + (it.itemPrice || 0) * (it.qty || 0),
                0
              );
              const total = baseTotal + platformFee;

              return (
                <div
                  key={order.id}
                  className="bg-surface-container-lowest dark:bg-dark-card rounded-xl p-5 premium-shadow border border-outline-variant/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                        {order.displayId}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-on-surface dark:text-dark-text">
                        ₹{total}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">Incl. ₹{platformFee} fee</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant">
                          {it.qty}x {it.itemName}
                        </span>
                        <span className="text-on-surface">
                          ₹{(it.itemPrice || 0) * (it.qty || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

