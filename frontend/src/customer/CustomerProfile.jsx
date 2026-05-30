import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { 
    darkMode, 
    toggleDarkMode, 
    currentUser, 
    logout, 
    updateProfile,
    savedAddresses,
    addAddressLine,
    removeAddressLine,
    favoriteShops,
    addToast,
    fetchApi
  } = useApp();

  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  // Form fields states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editCollegeId, setEditCollegeId] = useState('');
  const [newAddressLine, setNewAddressLine] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);

  // Load static data references (shops list)
  useEffect(() => {
    fetch('/api/shops')
      .then(res => res.json())
      .then(json => { if (json.success) setShops(json.data); })
      .catch(console.error);

    // Fetch user order history to calculate count
    fetchApi('/api/orders')
      .then(res => res.json())
      .then(json => { if (json.success) setOrders(json.data); })
      .catch(console.error);
  }, []);

  // Update initial form values when currentUser loads
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditPhone(currentUser.phone);
      setEditAvatarUrl(currentUser.avatarUrl || '');
      setEditCollegeId(currentUser.collegeId || '');
    }
  }, [currentUser]);

  // Derived stats
  const memberDate = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })
    : 'N/A';

  const favShopName = useMemo(() => {
    if (favoriteShops.length === 0 || shops.length === 0) return 'None';
    const firstFavId = favoriteShops[0];
    const shopObj = shops.find(s => s.id === firstFavId);
    return shopObj ? shopObj.name : 'None';
  }, [favoriteShops, shops]);

  const stats = [
    { label: 'Orders Placed', value: orders.length.toString(), icon: 'receipt_long' },
    { label: 'Fav Shop', value: favShopName, icon: 'favorite' },
    { label: 'Member Since', value: memberDate, icon: 'calendar_today' },
  ];

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const result = await updateProfile({
      name: editName.trim(),
      phone: editPhone.trim(),
      avatarUrl: editAvatarUrl.trim(),
      collegeId: editCollegeId.trim() || null
    });

    setSaving(false);
    if (result.success) {
      setShowEditProfile(false);
    } else {
      addToast('Error', result.error || 'Failed to save changes.', 'error');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (addingAddress) return;
    if (newAddressLine.trim().length < 5) {
      addToast('Validation Error', 'Address is too short.', 'error');
      return;
    }

    setAddingAddress(true);
    const result = await addAddressLine(newAddressLine.trim());
    setAddingAddress(false);

    if (result.success) {
      setNewAddressLine('');
      setShowAddressModal(false);
    } else {
      addToast('Error', result.error || 'Failed to add address.', 'error');
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/customer/home');
  };

  // Get matching favorite shop objects
  const favoriteShopsList = shops.filter(s => favoriteShops.includes(s.id));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D1A] font-body text-on-surface pb-32">
      
      {/* ── Top App Bar ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 max-w-5xl mx-auto w-full z-50 bg-white/90 dark:bg-[#16213E]/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/40">
        <div className="flex justify-between items-center px-6 h-16 w-full">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500 dark:text-orange-400">restaurant</span>
            <h1 className="font-headline font-black text-xl text-orange-500 dark:text-orange-400 italic">
              QuickBite
            </h1>
          </div>
          <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-zinc-500 active:scale-95 transition-transform">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </header>

      {currentUser && (
        <main className="pt-28 px-6 max-w-5xl mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row gap-6 items-start w-full">
            {/* Left Column: Profile card + Stats + App Configs + Logout */}
            <div className="w-full md:w-[45%] space-y-6 flex-shrink-0">
              {/* ── Profile Hero card ─────────────────────────────── */}
              <section className="bg-white dark:bg-[#16213E] rounded-3xl p-5 border border-slate-100 dark:border-slate-800/40 shadow-sm flex items-center gap-4">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 bg-slate-50 dark:bg-[#0D0D1A]">
                    <img
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80'}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80'; }}
                    />
                  </div>
                  <button
                    className="absolute bottom-0 right-0 bg-primary p-1.5 rounded-full text-slate-900 shadow-md active:scale-90 transition-transform font-bold"
                    onClick={() => setShowEditProfile(true)}
                  >
                    <span className="material-symbols-outlined text-[12px] font-bold">edit</span>
                  </button>
                </div>
                <div className="min-w-0">
                  <h2 className="font-headline text-lg font-black text-on-surface dark:text-white truncate">
                    {currentUser.name}
                  </h2>
                  <p className="text-[10px] text-zinc-400 font-semibold truncate mt-0.5">{currentUser.email}</p>
                  <p className="text-[10px] text-zinc-400 font-medium truncate">{currentUser.phone}</p>
                  {currentUser.collegeId && (
                    <span className="inline-block mt-2 px-2.5 py-0.5 bg-primary/10 text-primary rounded-md text-[9px] font-bold">
                      ID: {currentUser.collegeId}
                    </span>
                  )}
                </div>
              </section>

              {/* ── Stats Bento Grid ──────────────────────────────── */}
              <section className="grid grid-cols-3 gap-3">
                {stats.map(stat => (
                  <div key={stat.label} className="bg-white dark:bg-[#16213E] p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 shadow-sm flex flex-col items-center justify-center space-y-1">
                    <span className="material-symbols-outlined text-primary text-base">{stat.icon}</span>
                    <span className="font-headline text-sm font-black text-gradient truncate max-w-full">{stat.value}</span>
                    <span className="font-label text-[8px] text-zinc-400 uppercase tracking-widest text-center">{stat.label}</span>
                  </div>
                ))}
              </section>

              {/* ── App Configs (with Dark Mode toggle) ─────────── */}
              <section className="space-y-4">
                <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-zinc-400 px-1">App Settings</h3>
                <div className="bg-white dark:bg-[#16213E] rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800/40 shadow-sm">
                  
                  {/* DARK MODE TOGGLE */}
                  <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-purple-600">dark_mode</span>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-on-surface dark:text-white">Dark Mode</span>
                        <p className="text-[10px] text-zinc-400">Affects entire app</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="customer-dark-mode-toggle"
                        type="checkbox"
                        checked={darkMode}
                        onChange={toggleDarkMode}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>

                  {/* Order history redirection link */}
                  <div
                    className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer border-b border-slate-100 dark:border-slate-800/40"
                    onClick={() => navigate('/orders/history')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#0D0D1A] flex items-center justify-center">
                        <span className="material-symbols-outlined text-zinc-500">receipt_long</span>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-on-surface dark:text-white">Order History</span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">View your complete past orders</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-zinc-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </div>

                  <div
                    className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => navigate('/about')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#0D0D1A] flex items-center justify-center">
                        <span className="material-symbols-outlined text-zinc-500">info</span>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-on-surface dark:text-white">About QuickBite</span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">App information and setup details</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-zinc-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </div>

                </div>
              </section>

              {/* Logout button */}
              <button
                id="logout-btn"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-headline font-black text-red-600 border border-red-200 dark:border-red-900/35 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors active:scale-95 duration-150"
              >
                <span className="material-symbols-outlined">logout</span>
                Sign Out Account
              </button>
            </div>

            {/* Right Column: Favorites & Addresses */}
            <div className="w-full md:w-[55%] space-y-6">
              {/* ── Favorite Shops List ──────────────────────────── */}
              <section className="space-y-3">
                <h3 className="font-headline font-bold text-sm text-zinc-400 uppercase tracking-widest px-0.5">Favorite Cafeterias</h3>
                <div className="bg-white dark:bg-[#16213E] rounded-3xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/40">
                  {favoriteShopsList.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4">No shops favorited yet.</p>
                  ) : (
                    favoriteShopsList.map(shop => (
                      <div key={shop.id} className="py-2.5 flex justify-between items-center cursor-pointer" onClick={() => navigate(`/customer/menu/${shop.id}`)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-50 dark:bg-[#0D0D1A]">
                            <img src={shop.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs font-bold text-on-surface dark:text-white">{shop.name}</span>
                        </div>
                        <span className="material-symbols-outlined text-zinc-400 text-sm">chevron_right</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* ── Saved Delivery Addresses ─────────────────────── */}
              <section className="space-y-3">
                <div className="flex justify-between items-center px-0.5">
                  <h3 className="font-headline font-bold text-sm text-zinc-400 uppercase tracking-widest">Saved Addresses</h3>
                  <button
                    onClick={() => { setNewAddressLine(''); setShowAddressModal(true); }}
                    className="text-xs font-bold text-primary flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-sm">add</span> Add
                  </button>
                </div>
                <div className="bg-white dark:bg-[#16213E] rounded-3xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/40">
                  {savedAddresses.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4 font-medium">No addresses saved yet.</p>
                  ) : (
                    savedAddresses.map(addr => (
                      <div key={addr.id} className="py-3 flex justify-between items-center gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="material-symbols-outlined text-zinc-400 text-base mt-0.5">location_on</span>
                          <span className="text-xs font-semibold text-on-surface dark:text-white leading-relaxed break-words pr-2">{addr.addressLine}</span>
                        </div>
                        <button 
                          onClick={() => removeAddressLine(addr.id)}
                          className="text-red-500 hover:text-red-600 flex-shrink-0 active:scale-95 transition-transform"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="text-center pb-8">
            <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-medium">
              QuickBite v1.0.0
            </p>
          </div>

        </main>
      )}

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {showEditProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditProfile(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#16213E] rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-[#2E2E5E]/40 relative z-10 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/40">
                <h3 className="font-headline font-black text-lg text-on-surface dark:text-white">Edit Profile Details</h3>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-[#0D0D1A] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">College ID</label>
                  <input
                    type="text"
                    value={editCollegeId}
                    onChange={(e) => setEditCollegeId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Profile Photo URL</label>
                  <input
                    type="text"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowEditProfile(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-zinc-500 bg-slate-50 dark:bg-[#0D0D1A] dark:text-zinc-400 hover:bg-slate-100 active:scale-95 transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] py-3 rounded-xl font-black text-slate-900 bg-primary-gradient shadow-lg shadow-primary/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD ADDRESS MODAL */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddressModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#16213E] rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-[#2E2E5E]/40 relative z-10 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/40">
                <h3 className="font-headline font-black text-lg text-on-surface dark:text-white">Add Delivery Address</h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-[#0D0D1A] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <form onSubmit={handleAddAddress} className="space-y-4 pt-1">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">Delivery Address Line</label>
                  <textarea
                    required
                    value={newAddressLine}
                    onChange={(e) => setNewAddressLine(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50 h-24 resize-none"
                    placeholder="e.g. Room 402, Hostel Block C, Main Campus"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-zinc-500 bg-slate-50 dark:bg-[#0D0D1A] dark:text-zinc-400 hover:bg-slate-100 active:scale-95 transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingAddress}
                    className="flex-[2] py-3 rounded-xl font-black text-slate-900 bg-primary-gradient shadow-lg shadow-primary/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    {addingAddress ? (
                      <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Save Address'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
