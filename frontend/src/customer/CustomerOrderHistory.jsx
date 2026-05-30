import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerOrderHistory() {
   const navigate = useNavigate();
  const { addToast, addToCart, fetchApi } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancel Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelList, setCancelList] = useState([]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [cancellingAll, setCancellingAll] = useState(false);

  const openCancelModal = () => {
    const active = orders.filter(o => !['Cancelled', 'Completed', 'Ready', 'Almost Ready'].includes(o.status));
    setCancelList(active);
    setCheckedIds(active.map(o => o.id));
    setShowCancelModal(true);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchApi('/api/orders');
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

  const handleReorder = (order) => {
    const items = Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [{
          menuItemId: order.menuItemId,
          itemName: order.itemName,
          itemPrice: order.itemPrice,
          qty: order.qty,
        }];

    items.forEach(it => {
      const itemObj = {
        id: it.menuItemId || order.menuItemId,
        name: it.itemName,
        price: it.itemPrice,
      };
      addToCart(order.shopId, itemObj, it.qty);
    });

    addToast('Reordered!', 'Items added to cart. Redirecting to checkout...', 'success');
    navigate(`/customer/confirm/${order.shopId}/cart`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      } 
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const platformFee = 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-surface dark:bg-dark-bg font-body text-on-background"
    >
      <header className="fixed top-0 left-0 right-0 max-w-5xl mx-auto w-full flex justify-between items-center px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm z-50">
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

      <main className="pt-24 pb-10 px-4 sm:px-6 max-w-5xl mx-auto">
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
          <>
            {orders.filter(o => !['Cancelled', 'Completed', 'Ready', 'Almost Ready'].includes(o.status)).length > 1 && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={openCancelModal}
                  className="bg-red-500 hover:bg-red-600 text-white font-headline font-extrabold px-5 py-2.5 rounded-xl shadow-md hover:shadow-red-500/10 active:scale-95 transition-all flex items-center gap-2 cursor-pointer text-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  Cancel All Active Orders ({orders.filter(o => !['Cancelled', 'Completed', 'Ready', 'Almost Ready'].includes(o.status)).length})
                </button>
              </div>
            )}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
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
                <motion.div
                  variants={cardVariants}
                  whileHover={{ y: -3, scale: 1.01, boxShadow: "0 8px 24px -5px rgba(249, 115, 22, 0.08)" }}
                  key={order.id}
                  className="bg-surface-container-lowest dark:bg-dark-card rounded-xl p-5 premium-shadow border border-outline-variant/10 flex flex-col h-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                          {order.displayId}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(order.displayId);
                            addToast('ID Copied', 'Order ID copied to clipboard.', 'success');
                          }}
                          className="w-6 h-6 rounded-full text-zinc-400 hover:text-orange-500 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                          title="Copy Order ID"
                        >
                          <span className="material-symbols-outlined text-[12px]">content_copy</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
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
                  <div className="mt-3 space-y-1 flex-1">
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
                  {/* Status badge */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                      : order.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                      : order.status === 'Ready' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
                    }`}>
                      {order.status || 'Pending'}
                    </span>
                    
                    <div className="flex items-center gap-1.5 ml-auto">
                      {/* Cancel button */}
                      { !['Cancelled','Completed','Ready','Almost Ready'].includes(order.status) && (
                        <button
                          className="text-xs font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg transition-colors active:scale-95 cursor-pointer"
                          onClick={async () => {
                            try {
                              const res = await fetchApi(`/api/orders/${order.id}/cancel`, {
                                method: 'PATCH',
                              });
                              const json = await res.json();
                              if (json.success) {
                                setOrders(prev => prev.map(o => o.id === order.id ? json.data : o));
                                addToast('Order Cancelled', 'Your order has been cancelled.', 'success');
                              } else {
                                console.error('Cancel failed', json.error);
                                addToast('Error', json.error || 'Failed to cancel order.', 'error');
                              }
                            } catch (e) {
                              console.error(e);
                              addToast('Error', `Unable to cancel order: ${e.message}`, 'error');
                            }
                          }}
                        >
                          Cancel Order
                        </button>
                      )}

                      {/* Reorder Button */}
                      { ['Completed', 'Cancelled', 'Ready'].includes(order.status) && (
                        <button
                          onClick={() => handleReorder(order)}
                          className="text-xs font-bold text-orange-500 hover:text-white hover:bg-orange-500 border border-orange-500/30 dark:border-orange-500/20 px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                        >
                          Reorder
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          </>
        )}
      </main>

      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelModal(false)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white dark:bg-[#16213E] rounded-3xl p-6 w-full max-w-md relative z-10 border border-slate-100 dark:border-slate-800/40 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-headline font-black text-xl text-on-surface dark:text-white">Cancel Orders</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Select which orders you want to cancel</p>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 max-h-[45vh]">
                {cancelList.map(order => {
                  const isChecked = checkedIds.includes(order.id);
                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        if (isChecked) {
                          setCheckedIds(checkedIds.filter(id => id !== order.id));
                        } else {
                          setCheckedIds([...checkedIds, order.id]);
                        }
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        isChecked 
                          ? 'border-red-500/30 bg-red-50/10 dark:bg-red-950/10' 
                          : 'border-slate-100 dark:border-slate-800/40 bg-slate-50/30 dark:bg-zinc-900/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isChecked 
                            ? 'bg-red-500 border-red-500 text-white' 
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-zinc-950'
                        }`}>
                          {isChecked && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-headline font-black text-xs text-orange-600 dark:text-orange-400">{order.displayId}</span>
                            <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-on-surface dark:text-white mt-1 truncate">{order.itemName}</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">₹{order.itemPrice || 0}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800/40 mt-4">
                <button
                  disabled={checkedIds.length === 0 || cancellingAll}
                  onClick={async () => {
                    if (checkedIds.length === 0) return;
                    setCancellingAll(true);
                    try {
                      const res = await fetchApi('/api/orders/cancel-all', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderIds: checkedIds })
                      });
                      const json = await res.json();
                      if (json.success) {
                        setOrders(prev => prev.map(o => {
                          const updated = json.data.find(u => u.id === o.id);
                          return updated ? updated : o;
                        }));
                        addToast('Orders Updated', `${checkedIds.length} order(s) cancelled successfully.`, 'success');
                        setShowCancelModal(false);
                      } else {
                        addToast('Error', json.error || 'Failed to cancel orders.', 'error');
                      }
                    } catch (e) {
                      addToast('Error', `Unable to cancel orders: ${e.message}`, 'error');
                    } finally {
                      setCancellingAll(false);
                    }
                  }}
                  className={`w-full font-headline font-extrabold py-3.5 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-2 ${
                    checkedIds.length === 0 
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/10 active:scale-95'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  {cancellingAll ? 'Cancelling...' : `Cancel Checked Orders (${checkedIds.length})`}
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-300 font-bold py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Keep All & Go Back
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

