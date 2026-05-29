import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All'); // 'All' | 'Momos' | 'Burgers' | 'Dosa' | 'Chinese' | 'Healthy' etc.
  const [sortBy, setSortBy] = useState('none'); // 'none' | 'ept' | 'rating'
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  const navigate = useNavigate();
  const { currentUser, notifications, markNotificationsAsRead, token } = useApp();

  const cuisineTags = ['All', 'Momos', 'Burgers', 'Dosa', 'Chinese', 'Healthy', 'Sandwiches', 'Shakes'];

  // SEO Optimization Tags Setup
  useEffect(() => {
    document.title = 'QuickBite | Smart College Cafeteria Ordering';
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'QuickBite offers queue-aware predictive food ordering for college cafeterias. Skip the long lines by tracking live waiting times and crowds.');

    const ogTags = {
      'og:title': 'QuickBite — College Food Court Ordering',
      'og:description': 'Check EPT and place orders in advance from college shops.',
      'og:type': 'website',
      'og:url': window.location.origin + '/customer/home',
      'og:image': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
      'twitter:card': 'summary_large_image',
      'twitter:title': 'QuickBite — Skip Cafeteria Queues',
      'twitter:description': 'Check queue crowd load and order beforehand.'
    };

    Object.keys(ogTags).forEach(property => {
      let meta = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        if (property.startsWith('og:')) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', ogTags[property]);
    });
  }, []);

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/shops');
      const json = await res.json();
      if (json.success) setShops(json.data);
    } catch (e) {
      console.error('Failed to fetch shops:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
    const interval = setInterval(fetchShops, 15000); // Poll faster for reactive updates
    return () => clearInterval(interval);
  }, []);

  // Filter & Sort computation
  const filteredAndSortedShops = shops
    .filter(shop => {
      const matchesSearch = 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = 
        selectedTag === 'All' ||
        shop.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());

      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'ept') return a.ept - b.ept;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // Keep default seed order
    });

  // Derived dashboard metrics
  const activeOrdersInFoodCourt = shops.reduce((sum, s) => sum + (s.ept > 10 ? Math.floor(s.ept / 5) : 0), 0);
  
  // Calculate food court crowd level dynamically
  let crowdStatus = 'Low';
  let crowdColorClass = 'text-green-600 bg-green-50 dark:bg-green-950/20';
  if (activeOrdersInFoodCourt > 8) {
    crowdStatus = 'High';
    crowdColorClass = 'text-red-600 bg-red-50 dark:bg-red-950/20';
  } else if (activeOrdersInFoodCourt > 3) {
    crowdStatus = 'Medium';
    crowdColorClass = 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
  }

  // Recommended list (highest rated)
  const recommendedShops = [...shops].sort((a, b) => b.rating - a.rating).slice(0, 3);
  
  // Fastest shops (wait time <= 12)
  const fastestShops = [...shops].sort((a, b) => a.ept - b.ept).slice(0, 3);

  // Trending items list cross-cafeteria
  const trendingItems = [
    { name: 'Veg Momos', price: 40, shopId: 'kitchen-kukkries', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=200&q=80', shopName: 'Kitchen Kukkries' },
    { name: 'Veg Burger', price: 60, shopId: 'kunj-burger-point', img: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=200&q=80', shopName: 'Kunj Burger Point' },
    { name: 'Masala Dosa', price: 80, shopId: 'doctor-dosa', img: '/images/masala_dosa.png', shopName: 'Doctor Dosa' },
    { name: 'Veg Sandwich', price: 80, shopId: 'millennials-cafe', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&q=80', shopName: 'Millennials Cafe' }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpenNotifications = () => {
    setShowNotificationCenter(true);
    markNotificationsAsRead();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D1A] font-body text-on-background pb-28 relative">
      
      {/* ── Top Custom App Bar ───────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 max-w-md md:max-w-5xl lg:max-w-7xl mx-auto w-full flex justify-between items-center px-6 py-4 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/40 z-50">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Welcome to Campus Hub</span>
          <h1 className="font-headline font-black text-xl text-orange-600 dark:text-orange-500 italic">
            QuickBite
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenNotifications}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#16213E] text-zinc-600 dark:text-zinc-300 flex items-center justify-center relative active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
          {!token && (
            <button 
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs shadow-md shadow-primary/20 active:scale-95 transition-transform"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* ── Main Scroll Container ────────────────────────────── */}
      <main className="pt-28 px-6 max-w-md md:max-w-5xl lg:max-w-7xl mx-auto space-y-6">
        
        {/* Greetings Section */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold font-headline text-on-surface dark:text-white">
              Hey {currentUser ? currentUser.name.split(' ')[0] : 'Cafeterian'}!
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Ready to beat the food lines?</p>
          </div>
          
          {/* Dynamic Crowd Tracker */}
          <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold ${crowdColorClass} border border-transparent`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
            <span>{crowdStatus} Court Crowd</span>
          </div>
        </div>

        {/* Dynamic Search Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-3.5 text-zinc-400 text-sm">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#16213E] border border-slate-100 dark:border-slate-800/40 rounded-2xl pl-11 pr-4 py-3.5 text-sm dark:text-white focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all placeholder-zinc-400 shadow-sm"
            placeholder="Search cafeterias, cuisines, plates..."
          />
        </div>

        {/* Cuisine Tags Scroll */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {cuisineTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                selectedTag === tag
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white dark:bg-[#16213E] text-zinc-500 dark:text-zinc-400 border border-slate-100 dark:border-slate-800/40'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Sorting Chip Selectors */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex-shrink-0">Sort By</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy(prev => prev === 'ept' ? 'none' : 'ept')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 transition-all ${
                sortBy === 'ept' 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-slate-200 dark:border-slate-800/40 text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <span className="material-symbols-outlined text-xs">schedule</span>
              Wait Time
            </button>
            <button
              onClick={() => setSortBy(prev => prev === 'rating' ? 'none' : 'rating')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 transition-all ${
                sortBy === 'rating' 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-slate-200 dark:border-slate-800/40 text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <span className="material-symbols-outlined text-xs text-yellow-500">star</span>
              Popularity
            </button>
          </div>
        </div>

        {/* ── BENTO 1: Recommended For You ─────────────────────── */}
        {!searchQuery && selectedTag === 'All' && (
          <section className="space-y-3">
            <h3 className="font-headline font-black text-base text-on-surface dark:text-white px-0.5">
              Recommended For You
            </h3>
            <div className="flex md:grid gap-4 overflow-x-auto md:overflow-x-visible no-scrollbar md:grid-cols-3 pb-3">
              {recommendedShops.map(shop => (
                <div
                  key={shop.id}
                  onClick={() => navigate(`/customer/menu/${shop.id}`)}
                  className="w-48 md:w-auto bg-white dark:bg-[#16213E] rounded-2xl p-3 flex-shrink-0 cursor-pointer shadow-sm border border-slate-100 dark:border-slate-800/40 hover:shadow-md transition-shadow active:scale-98"
                >
                  <div className="h-28 rounded-xl overflow-hidden mb-2.5">
                    <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-bold text-xs truncate text-on-surface dark:text-white">{shop.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-zinc-400">★ {shop.rating}</span>
                    <span className="text-[10px] font-bold text-primary">{shop.ept} mins wait</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── BENTO 2: Trending Plates (Items scroll) ────────────── */}
        {!searchQuery && selectedTag === 'All' && (
          <section className="space-y-3">
            <h3 className="font-headline font-black text-base text-on-surface dark:text-white px-0.5">
              Trending Cravings
            </h3>
            <div className="flex md:grid gap-4 overflow-x-auto md:overflow-x-visible no-scrollbar md:grid-cols-2 lg:grid-cols-4 pb-3">
              {trendingItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/customer/menu/${item.shopId}`)}
                  className="w-40 md:w-auto bg-white dark:bg-[#16213E] rounded-2xl p-2.5 flex-shrink-0 cursor-pointer shadow-sm border border-slate-100 dark:border-slate-800/40 hover:shadow-md transition-shadow active:scale-98 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[11px] truncate text-on-surface dark:text-white">{item.name}</h4>
                    <p className="text-[9px] text-zinc-400 truncate">{item.shopName}</p>
                    <p className="text-[10px] font-black text-primary mt-0.5">₹{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── BENTO 3: Shops List (Filtered & Sorted) ──────────── */}
        <section className="space-y-3">
          <h3 className="font-headline font-black text-base text-on-surface dark:text-white px-0.5">
            {searchQuery || selectedTag !== 'All' ? 'Matched Cafeterias' : 'All Cafeterias'}
          </h3>
          
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedShops.map(shop => {
              const crowdColors = {
                Low: 'bg-green-500',
                Medium: 'bg-yellow-500',
                High: 'bg-red-500',
              };
              const crowdBgs = {
                Low: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/40',
                Medium: 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-900/40',
                High: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/40',
              };

              return (
                <div
                  key={shop.id}
                  onClick={() => navigate(`/customer/menu/${shop.id}`)}
                  className="bg-white dark:bg-[#16213E] p-4 rounded-2xl flex items-center gap-4 cursor-pointer shadow-sm border border-slate-100 dark:border-slate-800/40 hover:shadow-md transition-shadow active:scale-98 group"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative">
                    <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-on-surface dark:text-white truncate pr-2">{shop.name}</h4>
                      <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        ★ {shop.rating}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{JSON.parse(JSON.stringify(shop.tags)).join(' • ')}</p>
                    
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center gap-1 text-xs text-primary font-bold">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span>{shop.ept} mins wait</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${crowdBgs[shop.crowdLevel]}`}>
                        {shop.crowdLevel} Load
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAndSortedShops.length === 0 && !loading && (
              <div className="text-center py-16 text-zinc-400">
                <span className="material-symbols-outlined text-4xl block mb-2">storefront</span>
                <p className="text-sm font-semibold">No shops match your preferences</p>
                <p className="text-xs text-zinc-500 mt-1">Try clearing your filters or changing search query.</p>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* ── NOTIFICATION CENTER SLIDE-OVER MODAL ───────────────── */}
      <AnimatePresence>
        {showNotificationCenter && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationCenter(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            {/* Sidebar content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#16213E] h-full shadow-2xl flex flex-col justify-between"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">notifications</span>
                  <h3 className="font-headline font-bold text-lg text-on-surface dark:text-white">Notifications</h3>
                </div>
                <button
                  onClick={() => setShowNotificationCenter(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-[#0D0D1A] flex items-center justify-center active:scale-95 transition-transform text-zinc-500"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 py-20">
                    <span className="material-symbols-outlined text-5xl mb-3">notifications_off</span>
                    <p className="text-sm font-semibold">Your inbox is clear</p>
                    <p className="text-xs text-zinc-500 mt-1">We'll alert you here when your orders change status.</p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const iconColors = {
                      success: 'bg-green-100 text-green-600 dark:bg-green-950/20 dark:text-green-400',
                      info: 'bg-orange-100 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400',
                      error: 'bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400',
                    };
                    const icons = {
                      success: 'check_circle',
                      info: 'info',
                      error: 'warning',
                    };
                    return (
                      <div key={n.id} className="p-4 bg-slate-50 dark:bg-[#0D0D1A] rounded-2xl flex gap-3 border border-slate-100/50 dark:border-slate-800/20">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconColors[n.type] || iconColors.info}`}>
                          <span className="material-symbols-outlined text-lg">{icons[n.type] || 'info'}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-on-surface dark:text-white">{n.title}</h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-zinc-400 block mt-2">{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
