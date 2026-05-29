import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';

// ── Order Confirmation Screen ─────────────────────────────────
// Route: /customer/confirm/:shopId/:itemId
// CRITICAL: EPT must be the LARGEST, most prominent element
export default function OrderConfirmation() {
  const { shopId, itemId } = useParams();
  const navigate = useNavigate();
  const { setActiveOrder, cartByShop, clearCart, setCartItemQty, removeFromCart } = useApp();

  const [shop, setShop] = useState(null);
  const [item, setItem] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [ept, setEpt] = useState(null);
  const [crowdLevel, setCrowdLevel] = useState('Low');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const isCartMode = itemId === 'cart';

  useEffect(() => {
    const load = async () => {
      try {
        const shopRes = await fetch(`/api/shops/${shopId}`);
        const shopJson = await shopRes.json();
        if (shopJson.success) setShop(shopJson.data);

        if (isCartMode) {
          const cart = cartByShop[shopId];
          const entries = cart ? Object.values(cart.items) : [];
          if (!entries.length) {
            setLoading(false);
            return;
          }
          const itemsPayload = entries.map(entry => ({
            menuItemId: entry.item.id,
            qty: entry.qty,
          }));
          setCartItems(entries);
          try {
            const eptRes = await fetch('/api/ept-cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ shopId, items: itemsPayload }),
            });
            const eptJson = await eptRes.json();
            if (eptJson.success && typeof eptJson.data.ept === 'number') {
              setEpt(eptJson.data.ept);
              setCrowdLevel(eptJson.data.crowdLevel);
            } else {
              const fallbackEpt = entries.reduce(
                (sum, entry) => sum + (entry.item.prepTime || 0) * entry.qty,
                0
              );
              setEpt(fallbackEpt);
            }
          } catch {
            const fallbackEpt = entries.reduce(
              (sum, entry) => sum + (entry.item.prepTime || 0) * entry.qty,
              0
            );
            setEpt(fallbackEpt);
          }
        } else {
          const [menuRes, eptRes] = await Promise.all([
            fetch(`/api/shops/${shopId}/menu`),
            fetch(`/api/ept?shopId=${shopId}&menuItemId=${itemId}`),
          ]);
          const menuJson = await menuRes.json();
          const eptJson = await eptRes.json();

          if (menuJson.success) {
            const found = menuJson.data.find(m => m.id === itemId);
            setItem(found || null);
            if (!eptJson.success && found) {
              setEpt(found.prepTime);
            }
          }
          if (eptJson.success && typeof eptJson.data.ept === 'number') {
            setEpt(eptJson.data.ept);
            setCrowdLevel(eptJson.data.crowdLevel);
          } else if (!ept && item) {
            setEpt(item.prepTime);
          }
        }
      } catch (e) {
        console.error('Failed to load confirmation:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId, itemId, isCartMode, cartByShop]);

  const handleConfirm = () => {
    if (!isCartMode && !item) return;
    if (isCartMode && !cartItems.length) return;
    navigate(`/customer/payment/${shopId}/${itemId}`);
  };

  const platformFee = 5;
  const totalBase = isCartMode
    ? cartItems.reduce((sum, entry) => sum + entry.item.price * entry.qty, 0)
    : item
    ? item.price
    : 0;
  const total = totalBase + platformFee;

  const eptDisplay = ept !== null && ept > 90 ? '90+' : ept;

  const handleIncrement = (entry) => {
    const nextQty = entry.qty + 1;
    setCartItemQty(shopId, entry.item, nextQty);
  };

  const handleDecrement = (entry) => {
    const nextQty = entry.qty - 1;
    if (nextQty <= 0) {
      removeFromCart(shopId, entry.item.id);
    } else {
      setCartItemQty(shopId, entry.item, nextQty);
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-dark-bg font-body text-on-background animate-fade-in">
      {/* ── Top App Bar ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto w-full flex justify-between items-center px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm z-50">
        <div className="flex items-center gap-3">
          <button
            id="confirm-back-btn"
            onClick={() => navigate(`/customer/menu/${shopId}`)}
            className="hover:opacity-80 transition-opacity active:scale-95 duration-150 text-yellow-600 dark:text-yellow-400"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-['Plus_Jakarta_Sans'] font-bold tracking-tight text-lg text-yellow-600 dark:text-yellow-400">
            Confirm Order
          </h1>
        </div>
      </header>

      <main className="pt-24 pb-10 px-6 max-w-2xl mx-auto">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && shop && (!isCartMode ? item : cartItems.length > 0) && (
          <section className="space-y-8">
            <header>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-background dark:text-dark-text mb-2">
                Review Your Meal
              </h2>
              <p className="text-on-surface-variant font-medium">One step closer to deliciousness.</p>
            </header>

            {/* ── Item Card ─────────────────────────────────── */}
            <div className="relative overflow-visible mb-8">
              <div className="bg-surface-container-lowest dark:bg-dark-card rounded-xl p-6 shadow-[0px_12px_32px_rgba(44,47,48,0.06)] flex flex-col md:flex-row items-center gap-6 border border-outline-variant/10">
                <div className="relative -mt-10 md:-mt-0 w-36 h-36 flex-shrink-0">
                  <img
                    src={isCartMode ? cartItems[0].item.imageUrl : item.imageUrl}
                    alt={isCartMode ? cartItems[0].item.name : item.name}
                    className="w-full h-full object-cover rounded-full shadow-2xl ring-8 ring-surface-container-lowest dark:ring-dark-card"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'; }}
                  />
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface dark:text-dark-text">
                    {isCartMode ? `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in order` : item.name}
                  </h3>
                  <p className="text-on-surface-variant text-sm mt-1">{shop.name}</p>
                  {!isCartMode && (
                    <p className="text-on-surface-variant text-sm mt-1">Qty: 1 · Prep time: {item.prepTime} min</p>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-3">
                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[11px] font-bold tracking-wider uppercase">
                      Fresh
                    </span>
                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[11px] font-bold tracking-wider uppercase">
                      Made to Order
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isCartMode && (
              <div className="bg-surface-container-lowest dark:bg-dark-card rounded-xl p-4 premium-shadow space-y-3">
                {cartItems.map(entry => (
                  <div key={entry.item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md overflow-hidden">
                        <img
                          src={entry.item.imageUrl}
                          alt={entry.item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'; }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface dark:text-dark-text">
                          {entry.item.name}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          ₹{entry.item.price} · {entry.item.prepTime}m prep
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-on-surface dark:text-dark-text">
                        ₹{entry.item.price * entry.qty}
                      </span>
                      <div className="flex items-center bg-primary/10 rounded-full px-2 py-1 gap-1">
                        <button
                          onClick={() => handleDecrement(entry)}
                          className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold active:scale-95 transition-transform"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold text-on-surface dark:text-dark-text">
                          {entry.qty}
                        </span>
                        <button
                          onClick={() => handleIncrement(entry)}
                          className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-sm font-bold active:scale-95 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Status/Info Card ──────────────────────────── */}
            <div className="bg-surface-container-low dark:bg-dark-surface rounded-xl p-6 space-y-6">
              {/* ── EPT BLOCK — DOMINANT ELEMENT ─────────────── */}
              {/* PRD: EPT must be LARGEST, most prominent — min 48px font */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                </div>
                <div className="flex-1">
                  <p className="text-on-surface-variant text-[11px] uppercase tracking-[0.08em] font-semibold mb-2">
                    Ready in approximately
                  </p>
                  {/* The DOMINANT element — 72px display font */}
                  <div className="flex items-baseline gap-2">
                    <span
                      id="ept-display"
                      className="font-headline font-extrabold text-primary tracking-tighter"
                      style={{ fontSize: '72px', lineHeight: 1 }}
                    >
                      {eptDisplay !== null ? eptDisplay : '—'}
                    </span>
                    <span className="font-headline font-bold text-primary text-2xl">min</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-on-secondary-container animate-pulse" />
                    <p className="text-on-surface-variant text-sm italic">Based on current queue load • {crowdLevel} Crowd</p>
                  </div>
                </div>
              </div>

              {/* Pickup Location */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-tertiary">location_on</span>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[11px] uppercase tracking-[0.08em] font-semibold mb-1">Pickup Location</p>
                  <h4 className="font-headline text-lg font-bold text-on-background dark:text-dark-text">{shop.name}</h4>
                  <p className="text-on-surface-variant text-sm">Counter Pickup · Show order ID</p>
                </div>
              </div>
            </div>

            {/* ── Pricing Block ─────────────────────────────── */}
            <div className="space-y-3 px-2">
              <div className="flex justify-between text-on-surface-variant font-medium">
                <span>{isCartMode ? 'Items Total' : 'Item Price'}</span>
                <span>₹{totalBase}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant font-medium">
                <span>Platform Fee</span>
                <span>₹{platformFee}</span>
              </div>
              <div className="pt-4 flex justify-between items-center border-t border-outline-variant/10">
                <span className="font-headline text-xl font-bold text-on-surface dark:text-dark-text">Total</span>
                <span className="font-headline text-2xl font-extrabold text-primary">₹{total}</span>
              </div>
            </div>

            {/* ── Confirm Button ────────────────────────────── */}
            <div className="pt-2">
              <button
                id="confirm-order-btn"
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full bg-gradient-to-br from-primary to-primary-fixed text-slate-900 font-headline text-lg font-black py-5 rounded-full shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-60"
              >
                {confirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Placing Order...
                  </span>
                ) : 'Confirm Order'}
              </button>
              <button
                onClick={() => navigate(`/customer/menu/${shopId}`)}
                className="w-full mt-4 text-on-surface-variant font-medium text-sm py-2 hover:underline decoration-primary transition-all underline-offset-4"
              >
                Modify Items
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
