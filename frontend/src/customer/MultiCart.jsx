import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { getFoodImage } from '../foodImageMap.js';

export default function MultiCart() {
  const navigate = useNavigate();
  const { 
    cartByShop, 
    addToCart, 
    setCartItemQty, 
    removeFromCart, 
    clearCart,
    token, 
    addToast 
  } = useApp();

  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [shopEpts, setShopEpts] = useState({});
  const [loadingEpts, setLoadingEpts] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch shop metadata
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await fetch('/api/shops');
        const json = await res.json();
        if (json.success) setShops(json.data);
      } catch (e) {
        console.error('Failed to load shops:', e);
      } finally {
        setLoadingShops(false);
      }
    };
    fetchShops();
  }, []);

  // Compute active shops (shops with non-empty carts)
  const activeShops = useMemo(() => {
    return Object.keys(cartByShop).filter(shopId => {
      const shopCart = cartByShop[shopId];
      return shopCart && Object.keys(shopCart.items || {}).length > 0;
    });
  }, [cartByShop]);

  // Fetch EPT for each active cart
  useEffect(() => {
    if (activeShops.length === 0) return;

    activeShops.forEach(shopId => {
      const cart = cartByShop[shopId];
      const itemsPayload = Object.values(cart.items).map(entry => ({
        menuItemId: entry.item.id,
        qty: entry.qty,
      }));

      // Avoid redundant fetches if items list hasn't changed (using simple hash key comparison)
      const cacheKey = JSON.stringify(itemsPayload);
      if (loadingEpts[shopId] === cacheKey) return;

      const fetchEpt = async () => {
        setLoadingEpts(prev => ({ ...prev, [shopId]: cacheKey }));
        try {
          const res = await fetch('/api/ept-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shopId, items: itemsPayload }),
          });
          const json = await res.json();
          if (json.success) {
            setShopEpts(prev => ({ 
              ...prev, 
              [shopId]: { ept: json.data.ept, crowdLevel: json.data.crowdLevel } 
            }));
          }
        } catch (e) {
          console.error(`Failed to calculate EPT for ${shopId}:`, e);
        } finally {
          setLoadingEpts(prev => {
            const next = { ...prev };
            delete next[shopId];
            return next;
          });
        }
      };

      fetchEpt();
    });
  }, [activeShops, cartByShop]);

  const handleIncrement = (shopId, entry) => {
    setCartItemQty(shopId, entry.item, entry.qty + 1);
  };

  const handleDecrement = (shopId, entry) => {
    if (entry.qty <= 1) {
      removeFromCart(shopId, entry.item.id);
    } else {
      setCartItemQty(shopId, entry.item, entry.qty - 1);
    }
  };

  const handleCheckoutAll = () => {
    if (!token) {
      addToast('Auth Required', 'Please log in to place orders.', 'info');
      navigate('/login');
      return;
    }
    navigate('/customer/payment/all/cart');
  };

  // Calculate totals
  const cartSummary = useMemo(() => {
    let totalItems = 0;
    let totalPrice = 0;
    activeShops.forEach(shopId => {
      const cart = cartByShop[shopId];
      Object.values(cart.items).forEach(entry => {
        totalItems += entry.qty;
        totalPrice += entry.item.price * entry.qty;
      });
    });
    return { count: totalItems, price: totalPrice };
  }, [activeShops, cartByShop]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-50 dark:bg-[#0D0D1A] font-body text-on-background pb-32 relative"
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 max-w-5xl mx-auto w-full z-50 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/40 py-4 flex justify-between items-center px-6">
        <div className="flex items-center gap-2.5">
          <img src="/quickbite_logo.png" alt="QuickBite Logo" className="w-8 h-8 object-contain rounded-full shadow-sm" />
          <h1 className="font-headline font-black text-xl text-orange-500 dark:text-orange-400 italic">
            My Basket
          </h1>
        </div>
        {activeShops.length > 0 && (
          <span className="bg-primary/10 text-primary font-bold text-xs px-3 py-1 rounded-full">
            {activeShops.length} Vendor{activeShops.length > 1 ? 's' : ''}
          </span>
        )}
      </header>

      {/* ── Main Scroll Container ────────────────────────────── */}
      <main className="pt-28 px-6 max-w-5xl mx-auto space-y-6">
        
        {loadingShops && (
          <div className="flex flex-col gap-6 items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Loading basket details...</p>
          </div>
        )}

        {!loadingShops && activeShops.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-400">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/40 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-zinc-400">shopping_basket</span>
            </div>
            <h3 className="font-headline text-lg font-black text-on-surface dark:text-white mb-1">Your basket is empty</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 max-w-[280px] leading-relaxed">
              Add delicious food plates from campus cafeterias to start predictive ordering.
            </p>
            <button
              onClick={() => navigate('/customer/home')}
              className="mt-6 px-6 py-2.5 bg-primary text-slate-900 font-black rounded-xl text-xs shadow-md shadow-primary/20 active:scale-95 transition-transform"
            >
              Explore Cafeterias
            </button>
          </div>
        )}

        {!loadingShops && activeShops.length > 0 && (
          <div className="space-y-6">
            <AnimatePresence>
              {activeShops.map(shopId => {
                const shop = shops.find(s => s.id === shopId) || { name: shopId, imageUrl: '' };
                const cart = cartByShop[shopId];
                const eptInfo = shopEpts[shopId];
                const isCalculating = loadingEpts[shopId] != null;

                return (
                  <motion.div
                    key={shopId}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-[#16213E] rounded-3xl p-5 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4"
                  >
                    {/* Shop Header */}
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 flex-shrink-0">
                          <img src={shop.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-headline font-bold text-sm text-on-surface dark:text-white">{shop.name}</h3>
                          {/* Live timing info */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                              {isCalculating ? (
                                <span className="animate-pulse">Computing wait time...</span>
                              ) : eptInfo ? (
                                `Est. ${eptInfo.ept} min wait (${eptInfo.crowdLevel} Crowd)`
                              ) : (
                                'Timing unavailable'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/customer/confirm/${shopId}/cart`)}
                        className="bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-[10px] font-black px-3.5 py-1.5 rounded-lg active:scale-95 transition-all uppercase tracking-wider"
                      >
                        Checkout
                      </button>
                    </div>

                    {/* Cart Items List */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {Object.values(cart.items).map(entry => (
                        <div key={entry.item.id} className="py-3.5 flex justify-between items-center gap-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 dark:bg-slate-900">
                              <img
                                src={getFoodImage(entry.item.name, entry.item.imageUrl)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-on-surface dark:text-white truncate">{entry.item.name}</p>
                              <p className="text-[10px] text-zinc-400 mt-0.5">₹{entry.item.price} each</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 flex-shrink-0">
                            <p className="text-xs font-bold text-on-surface dark:text-white">₹{entry.item.price * entry.qty}</p>
                            
                            <div className="flex items-center bg-primary/10 rounded-full px-1.5 py-0.5 gap-1">
                              <button
                                onClick={() => handleDecrement(shopId, entry)}
                                className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-black active:scale-95 transition-transform"
                              >
                                −
                              </button>
                              <span className="min-w-[1.25rem] text-center text-xs font-bold text-on-surface dark:text-white">
                                {entry.qty}
                              </span>
                              <button
                                onClick={() => handleIncrement(shopId, entry)}
                                className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-xs font-black active:scale-95 transition-transform"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* ── Express Checkout All (Active only if > 0 items) ──── */}
            <div className="bg-surface-container-low dark:bg-dark-surface rounded-3xl p-5 border border-outline-variant/10 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-headline font-black text-sm text-on-surface dark:text-white">Basket Total</h4>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{cartSummary.count} items across {activeShops.length} vendors</p>
                </div>
                <p className="font-headline text-2xl font-black text-primary">₹{cartSummary.price}</p>
              </div>

              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-slate-100 dark:bg-slate-900/40 p-3.5 rounded-2xl leading-relaxed font-semibold">
                ⚠️ <span className="text-on-surface dark:text-white">Multi-Vendor Checkout</span> will place separate orders at each cafeteria. You can pay for all orders at once in the next step.
              </div>

              <button
                onClick={handleCheckoutAll}
                className="w-full bg-primary-gradient text-slate-900 font-headline text-sm font-black py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
                <span>Proceed to Payment (₹{cartSummary.price})</span>
              </button>
            </div>

          </div>
        )}
      </main>
    </motion.div>
  );
}
