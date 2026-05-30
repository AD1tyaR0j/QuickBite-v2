import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { getFoodImage } from '../foodImageMap.js';
import { motion, AnimatePresence } from 'framer-motion';

export default function Menu() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  
  // App context states
  const { 
    cartByShop, 
    addToCart, 
    setCartItemQty, 
    removeFromCart, 
    favoriteShops, 
    toggleFavoriteShop, 
    token, 
    addToast 
  } = useApp();

  const [shop, setShop] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [cartEpt, setCartEpt] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
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

  // Tabs: 'items' or 'reviews'
  const [activeTab, setActiveTab] = useState('items');

  const cartForShop = cartByShop[shopId] || { items: {} };

  const isFavorite = favoriteShops.includes(shopId);

  const cartSummary = useMemo(() => {
    const entries = Object.values(cartForShop.items);
    if (!entries.length) return { count: 0, totalPrice: 0 };
    let count = 0;
    let totalPrice = 0;
    entries.forEach(entry => {
      const qty = entry.qty || 0;
      count += qty;
      totalPrice += (entry.item.price || 0) * qty;
    });
    return { count, totalPrice };
  }, [cartForShop]);

  useEffect(() => {
    const load = async () => {
      try {
        const [shopRes, menuRes] = await Promise.all([
          fetch(`/api/shops/${shopId}`),
          fetch(`/api/shops/${shopId}/menu`),
        ]);
        const shopJson = await shopRes.json();
        const menuJson = await menuRes.json();
        if (shopJson.success) {
          setShop(shopJson.data);
          // Set Dynamic SEO Metadata
          document.title = `${shopJson.data.name} Menu | QuickBite`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', `Browse the menu of ${shopJson.data.name} on QuickBite. Check live prep time (${shopJson.data.ept} mins), crowd status, and place your order.`);
          }
        }
        if (menuJson.success) setMenuItems(menuJson.data);
      } catch (e) {
        console.error('Failed to load menu:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

  // Load reviews when tab changes
  useEffect(() => {
    if (activeTab !== 'reviews') return;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`/api/reviews/${shopId}`);
        const json = await res.json();
        if (json.success) {
          setReviews(json.data);
        }
      } catch (e) {
        console.error('Failed to load reviews:', e);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [activeTab, shopId]);

  useEffect(() => {
    const entries = Object.values(cartForShop.items);
    if (!entries.length || !shop) {
      setCartEpt(null);
      return;
    }
    const payloadItems = entries.map(entry => ({
      menuItemId: entry.item.id,
      qty: entry.qty,
    }));
    const compute = async () => {
      try {
        setCartLoading(true);
        const res = await fetch('/api/ept-cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopId, items: payloadItems }),
        });
        const json = await res.json();
        if (json.success) {
          setCartEpt(json.data.ept);
        }
      } catch (e) {
        console.error('Failed to calculate cart EPT:', e);
      } finally {
        setCartLoading(false);
      }
    };
    compute();
  }, [cartForShop, shop, shopId]);

  // Reviews distribution analytics
  const ratingsAnalytics = useMemo(() => {
    if (reviews.length === 0) return { avg: shop?.rating || 0.0, counts: [0, 0, 0, 0, 0], total: 0 };
    const counts = [0, 0, 0, 0, 0]; // Index 0 represents 5 stars, index 4 represents 1 star
    let sum = 0;
    reviews.forEach(r => {
      if (r.ratingShop) {
        sum += r.ratingShop;
        const starIdx = 5 - r.ratingShop;
        if (starIdx >= 0 && starIdx <= 4) {
          counts[starIdx]++;
        }
      }
    });
    return {
      avg: Math.round((sum / reviews.length) * 10) / 10,
      counts,
      total: reviews.length
    };
  }, [reviews, shop]);

  const featuredItem = menuItems.find(m => m.isFeatured);
  const regularItems = menuItems.filter(m => !m.isFeatured);

  const handleAdd = (item) => {
    addToCart(shopId, item, 1);
  };

  const handleIncrement = (item, currentQty) => {
    setCartItemQty(shopId, item, currentQty + 1);
  };

  const handleDecrement = (item, currentQty) => {
    if (currentQty <= 1) {
      removeFromCart(shopId, item.id);
    } else {
      setCartItemQty(shopId, item, currentQty - 1);
    }
  };

  const handleToggleFavorite = async () => {
    if (!token) {
      addToast('Auth Required', 'Please log in to add shops to your favorites.', 'info');
      navigate('/login');
      return;
    }
    await toggleFavoriteShop(shopId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-50 dark:bg-[#0D0D1A] font-body text-on-background pb-32 relative"
    >
      
      {/* ── Top App Bar with Back & Favorite Heart ──────────── */}
      <header className="fixed top-0 left-0 right-0 max-w-5xl mx-auto w-full flex justify-between items-center px-6 py-4 bg-white/90 dark:bg-[#16213E]/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/40 z-50">
        <div className="flex items-center gap-3">
          <button
            id="menu-back-btn"
            onClick={() => navigate('/customer/home')}
            className="hover:opacity-85 transition-opacity active:scale-95 duration-150 text-orange-500 dark:text-orange-400"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-base text-on-surface dark:text-white">
            {shop?.name || 'Menu'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <motion.button
            onClick={handleToggleFavorite}
            animate={{ scale: isFavorite ? [1, 1.25, 1] : 1 }}
            transition={{ duration: 0.3 }}
            whileTap={{ scale: 0.85 }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isFavorite ? 'bg-red-50 text-red-500 dark:bg-red-950/20' : 'text-zinc-400'}`}
          >
            <span className="material-symbols-outlined" style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : {}}>
              favorite
            </span >
          </motion.button>
        </div>
      </header>

      {/* ── Menu Main Container ─────────────────────────────── */}
      <main className="pt-28 px-6 max-w-5xl mx-auto space-y-6">
        
        {loading && (
          <div className="flex flex-col md:flex-row gap-6 items-start w-full animate-pulse">
            {/* Left Column Skeleton */}
            <div className="w-full md:w-[38%] space-y-6 flex-shrink-0">
              <div className="bg-white dark:bg-[#16213E] rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/40 space-y-4">
                <div className="h-40 rounded-2xl shimmer" />
                <div className="space-y-2">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 shimmer" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 shimmer" />
                  <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded w-full shimmer" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl shimmer" />
                  <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl shimmer" />
                </div>
              </div>
            </div>
            
            {/* Right Column Skeleton */}
            <div className="w-full md:w-[62%] space-y-6">
              <div className="bg-white dark:bg-[#16213E] rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/40 space-y-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 shimmer pb-2" />
                <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="py-4 flex justify-between items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-14 h-14 rounded-xl shimmer flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 shimmer" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 shimmer" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4 shimmer" />
                        </div>
                      </div>
                      <div className="w-16 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && shop && (
          <div className="flex flex-col md:flex-row gap-6 items-start w-full">
            {/* Left Column: Details Panel & Tabs */}
            <div className="w-full md:w-[38%] space-y-6 flex-shrink-0">
              {/* Shop Details Panel */}
              <div className="bg-white dark:bg-[#16213E] rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/40 space-y-4">
              <div className="relative h-40 rounded-2xl overflow-hidden shadow-sm">
                <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="bg-primary/95 text-white font-label text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    {shop.tags[0] || 'Campus Pick'}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-start">
                  <h2 className="font-headline text-2xl font-black text-on-surface dark:text-white tracking-tight">{shop.name}</h2>
                  <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-md font-bold text-xs">
                    ★ {shop.rating}
                  </div>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                  {JSON.parse(JSON.stringify(shop.tags)).join(' · ')}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-2.5">
                  {shop.description || 'Delicious home-style cafeteria orders prepped live for campus.'}
                </p>
              </div>

              {/* Crowd & EPT Badges Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 dark:bg-[#0D0D1A] p-3 rounded-2xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Queue Wait Time</p>
                    <p className="text-xs font-black text-on-surface dark:text-white">{shop.ept} mins wait</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-[#0D0D1A] p-3 rounded-2xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-purple-600 text-xl">group</span>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Crowd Level</p>
                    <p className="text-xs font-black text-on-surface dark:text-white">{shop.crowdLevel} Load</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB CONTAINER */}
            <div className="flex bg-slate-100 dark:bg-[#0D0D1A] p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('items')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'items' ? 'bg-primary text-slate-900 font-extrabold shadow-md' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
              >
                Food Items
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'reviews' ? 'bg-primary text-slate-900 font-extrabold shadow-md' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
              >
                Reviews & Ratings
              </button>
            </div>
            </div> {/* End Left Column */}

            {/* Right Column: Tab Content */}
            <div className="w-full md:w-[62%] space-y-6">
              {/* TAB 1: FOOD ITEMS LIST */}
              {activeTab === 'items' && (
              <div className="space-y-4">
                {/* Featured item banner card */}
                {featuredItem && (
                  <div className="bg-white dark:bg-[#16213E] rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800/40 relative overflow-hidden flex justify-between items-center group">
                    <div className="space-y-2 relative z-10 flex-1 pr-4">
                      <span className="bg-orange-100 text-orange-800 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        Today's Special
                      </span>
                      <h4 className="font-headline font-bold text-lg text-on-surface dark:text-white leading-tight">
                        {featuredItem.name}
                      </h4>
                      <p className="text-xl font-black text-primary">₹{featuredItem.price}</p>
                      <button
                        onClick={() => handleAdd(featuredItem)}
                        className="bg-primary-gradient text-slate-900 text-xs font-black px-4 py-2 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        Add to Cart
                        <span className="material-symbols-outlined text-[14px]">shopping_cart</span>
                      </button>
                    </div>
                    {featuredItem.imageUrl && (
                      <div className="w-24 h-24 rounded-2xl overflow-hidden relative z-10 flex-shrink-0 shadow-md">
                        <img
                          src={getFoodImage(featuredItem.name, featuredItem.imageUrl)}
                          alt={featuredItem.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Regular menu listing */}
                <div className="bg-white dark:bg-[#16213E] rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/40 space-y-4">
                  <h3 className="font-headline font-bold text-sm text-zinc-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/40 pb-2">Full Menu</h3>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="divide-y divide-slate-100 dark:divide-slate-800/40"
                  >
                    {regularItems.map((item) => {
                      const entry = cartForShop.items[item.id];
                      const qty = entry?.qty || 0;
                      return (
                        <motion.div
                          variants={itemVariants}
                          key={item.id}
                          className="py-4 flex justify-between items-center gap-4"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                              className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative bg-slate-50 dark:bg-[#0D0D1A]"
                            >
                              <img
                                src={getFoodImage(item.name, item.imageUrl)}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'; }}
                              />
                            </motion.div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-sm text-on-surface dark:text-white truncate">{item.name}</h5>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">₹{item.price}</p>
                              <span className="text-[10px] text-zinc-400 font-medium block mt-1">{item.prepTime} min cook time</span>
                            </div>
                          </div>

                          {/* Cart Add / Qty modifier */}
                          {qty > 0 ? (
                            <div className="flex items-center bg-primary/10 rounded-full px-1.5 py-0.5 gap-1 flex-shrink-0">
                              <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={() => handleDecrement(item, qty)}
                                className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold cursor-pointer"
                              >
                                −
                              </motion.button>
                              <motion.span
                                key={qty}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: [1, 1.25, 1], opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="min-w-[1.5rem] text-center text-xs font-semibold text-on-surface dark:text-white inline-block"
                              >
                                {qty}
                              </motion.span>
                              <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={() => handleIncrement(item, qty)}
                                className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-sm font-bold cursor-pointer"
                              >
                                +
                              </motion.button>
                            </div>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAdd(item)}
                              className="bg-slate-100 dark:bg-slate-800 text-zinc-600 dark:text-zinc-300 hover:bg-primary hover:text-white dark:hover:bg-primary px-4 py-1.5 rounded-full font-bold text-xs transition-all flex-shrink-0 cursor-pointer"
                            >
                              + Add
                            </motion.button>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            )}

            {/* TAB 2: REVIEWS & RATINGS BOARD */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                
                {/* RATING BREAKDOWN CARD */}
                <div className="bg-white dark:bg-[#16213E] rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/40 flex gap-6 items-center">
                  <div className="text-center space-y-1 pr-6 border-r border-slate-100 dark:border-slate-800/40">
                    <h4 className="text-4xl font-headline font-black text-gradient">{ratingsAnalytics.avg}</h4>
                    <div className="flex justify-center text-orange-500">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{ratingsAnalytics.total} Reviews</p>
                  </div>

                  {/* Star rating distribution bar chart */}
                  <div className="flex-1 space-y-1.5">
                    {ratingsAnalytics.counts.map((cnt, idx) => {
                      const starRating = 5 - idx;
                      const percentage = ratingsAnalytics.total > 0 ? (cnt / ratingsAnalytics.total) * 100 : 0;
                      return (
                        <div key={idx} className="flex items-center gap-2 text-[10px] font-semibold text-zinc-400">
                          <span className="w-2">{starRating}</span>
                          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="w-4 text-right">{cnt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* REVIEW CARDS LIST */}
                <div className="space-y-3">
                  <h3 className="font-headline font-bold text-sm text-zinc-400 uppercase tracking-widest px-0.5">Reviews</h3>
                  
                  {reviewsLoading && (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {!reviewsLoading && reviews.length === 0 && (
                    <div className="bg-white dark:bg-[#16213E] rounded-3xl p-8 border border-slate-100 dark:border-slate-800/40 text-center text-zinc-400">
                      <span className="material-symbols-outlined text-4xl block mb-2">reviews</span>
                      <p className="text-sm font-semibold">No reviews yet</p>
                      <p className="text-xs text-zinc-500 mt-1">Be the first to review this cafeteria after your meal!</p>
                    </div>
                  )}

                  {!reviewsLoading && reviews.length > 0 && (
                    <div className="space-y-3">
                      {reviews.map(review => (
                        <div key={review.id} className="bg-white dark:bg-[#16213E] rounded-3xl p-5 border border-slate-100 dark:border-slate-800/40 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                                <img src={review.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-on-surface dark:text-white leading-none">{review.userName}</h4>
                                <span className="text-[9px] text-zinc-400 mt-1 block">
                                  {new Date(review.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>

                            {/* Review Stars */}
                            <div className="flex text-orange-500">
                              {[1, 2, 3, 4, 5].map(star => (
                                <span 
                                  key={star} 
                                  className="material-symbols-outlined text-xs" 
                                  style={star <= (review.ratingShop || review.ratingFood) ? { fontVariationSettings: "'FILL' 1" } : {}}
                                >
                                  star
                                </span>
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                            {review.reviewText || 'No comment provided.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Persistent Cart Button */}
            <AnimatePresence>
              {cartSummary.count > 0 && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="fixed bottom-4 left-0 right-0 max-w-5xl mx-auto px-4 z-40"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/customer/confirm/${shopId}/cart`)}
                    className="w-full bg-primary-gradient text-slate-900 flex items-center justify-between px-5 py-4 rounded-full shadow-lg shadow-primary/20 cursor-pointer"
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-headline font-bold flex items-center gap-1.5">
                        <motion.span
                          key={cartSummary.count}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: [1, 1.25, 1], opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {cartSummary.count}
                        </motion.span>
                        item{cartSummary.count > 1 ? 's' : ''} in cart
                      </span>
                      <span className="text-[11px] opacity-90">
                        ₹{cartSummary.totalPrice} · {cartLoading || cartEpt == null ? 'Calculating EPT...' : `Est. ${cartEpt} min pickup`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold">
                      <span>View Cart</span>
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </div>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            </div> {/* End Right Column */}
          </div>
        )}
      </main>

      {/* ── Scroll To Top Button ──────────────────────────────── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-6 z-50 w-12 h-12 rounded-full bg-primary-gradient text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform cursor-pointer pointer-events-auto"
          >
            <span className="material-symbols-outlined text-2xl font-bold">arrow_upward</span>
          </motion.button>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
