import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function VendorProfile() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, logout, fetchApi, addToast } = useApp();
  
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit fields state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editCookCount, setEditCookCount] = useState(2);
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editIsOpen, setEditIsOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchShop = async () => {
    try {
      const res = await fetch(`/api/shops/${shopId}`);
      const json = await res.json();
      if (json.success) {
        setShop(json.data);
        setEditName(json.data.name);
        setEditDesc(json.data.description || '');
        setEditTags(JSON.parse(JSON.stringify(json.data.tags)).join(', '));
        setEditCookCount(json.data.cookCount);
        setEditLogoUrl(json.data.logoUrl || '');
        setEditBannerUrl(json.data.bannerUrl || '');
        setEditIsOpen(json.data.isOpen);
      }
    } catch (e) {
      console.error('Failed to fetch shop details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, [shopId]);

  const handleOpenEdit = () => {
    if (shop) {
      setEditName(shop.name);
      setEditDesc(shop.description || '');
      setEditTags(shop.tags.join(', '));
      setEditCookCount(shop.cookCount);
      setEditLogoUrl(shop.logoUrl || '');
      setEditBannerUrl(shop.bannerUrl || '');
      setEditIsOpen(shop.isOpen);
      setShowEditModal(true);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const parsedTags = editTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      name: editName.trim(),
      description: editDesc.trim(),
      tags: parsedTags,
      cookCount: parseInt(editCookCount) || 1,
      logoUrl: editLogoUrl.trim(),
      bannerUrl: editBannerUrl.trim(),
      isOpen: editIsOpen
    };

    try {
      const res = await fetchApi(`/api/shops/${shopId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShop(json.data);
        addToast('Shop Details Updated', 'Changes saved successfully to database.', 'success');
        setShowEditModal(false);
      } else {
        addToast('Error', json.error || 'Failed to update shop details.', 'error');
      }
    } catch (err) {
      addToast('Error', 'Failed to connect to the server.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const appSettings = [
    { label: 'Operating Hours', icon: 'schedule', sub: 'Mon - Fri, 08:00 - 20:00' },
    { label: 'Help Center', icon: 'help' },
    { label: 'Contact Support', icon: 'mail' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D1A] font-body text-on-surface pb-32">
      
      {/* ── Top Custom Bar ───────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 max-w-7xl mx-auto w-full z-50 bg-white/90 dark:bg-[#16213E]/80 backdrop-blur-xl shadow-sm border-b border-slate-100 dark:border-slate-800/40 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">restaurant_menu</span>
          <h1 className="font-headline font-black text-lg text-orange-600 dark:text-orange-400">
            QuickBite Vendor
          </h1>
        </div>
        <button className="p-2 rounded-full hover:bg-slate-100 transition-colors active:scale-95 duration-200">
          <span className="material-symbols-outlined text-slate-500">notifications</span>
        </button>
      </header>

      <main className="pt-20 px-6 max-w-7xl mx-auto space-y-6">
        
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Profile Shop Identity Card ─────────────────────── */}
        {!loading && shop && (
          <>
            <section className="relative mt-4">
              <div className="bg-white dark:bg-[#16213E] rounded-3xl p-5 flex items-center gap-4 border border-slate-100 dark:border-slate-800/40 shadow-sm">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <img
                    src={shop.logoUrl || "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=200&q=80"}
                    alt={shop.name}
                    className="w-full h-full object-cover rounded-full ring-4 ring-primary/10"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=200&q=80'; }}
                  />
                  <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1 border border-white">
                    <span className="material-symbols-outlined text-white text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-headline font-bold text-lg tracking-tight leading-tight text-on-surface dark:text-white truncate">
                    {shop.name}
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs flex items-center gap-1 mt-1 font-semibold">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    Manager · {shop.cookCount} Active Cook{shop.cookCount > 1 ? 's' : ''}
                  </p>
                  <button 
                    onClick={handleOpenEdit}
                    className="mt-3 px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-all"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            </section>

            {/* ── Shop Status Bento Block ─────────────────────── */}
            <section className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-[#16213E] p-4 rounded-3xl border border-slate-100 dark:border-slate-800/40 shadow-sm text-center">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Shop Rating</p>
                <p className="font-headline font-bold text-lg text-orange-600 dark:text-orange-400 mt-1">★ {shop.rating}</p>
              </div>
              <div className="bg-white dark:bg-[#16213E] p-4 rounded-3xl border border-slate-100 dark:border-slate-800/40 shadow-sm text-center">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Cook Count</p>
                <p className="font-headline font-bold text-lg text-on-surface dark:text-white mt-1">{shop.cookCount}</p>
              </div>
              <div className="bg-white dark:bg-[#16213E] p-4 rounded-3xl border border-slate-100 dark:border-slate-800/40 shadow-sm text-center flex flex-col justify-center items-center">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Cafeteria</p>
                <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${shop.isOpen ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300'}`}>
                  <span className={`w-1 h-1 rounded-full ${shop.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  {shop.isOpen ? 'Open' : 'Closed'}
                </div>
              </div>
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
                      id="dark-mode-toggle"
                      type="checkbox"
                      checked={darkMode}
                      onChange={toggleDarkMode}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>

                {/* Kitchen push notifications */}
                <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-orange-600">campaign</span>
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-on-surface dark:text-white">Kitchen Alerts</span>
                      <span className="text-[10px] text-zinc-400 block">Push notifications for new orders</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>

                {/* Other list settings */}
                {appSettings.map((s, i) => (
                  <div
                    key={s.label}
                    className={`p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer ${i < appSettings.length - 1 ? 'border-b border-slate-100 dark:border-slate-800/40' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#0D0D1A] flex items-center justify-center">
                        <span className="material-symbols-outlined text-zinc-500">{s.icon}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-on-surface dark:text-white">{s.label}</span>
                        {s.sub && <span className="text-[10px] text-zinc-400 block mt-0.5">{s.sub}</span>}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-zinc-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Logout button */}
            <button
              id="vendor-logout-btn"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-headline font-black text-red-600 border border-red-200 dark:border-red-900/35 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors active:scale-95 duration-150"
            >
              <span className="material-symbols-outlined">logout</span>
              Logout Manager
            </button>

            <div className="text-center pt-2">
              <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-medium">
                QuickBite v1.0.0
              </p>
            </div>
          </>
        )}

      </main>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#16213E] rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-[#2E2E5E]/40 relative z-10 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/40">
                <h3 className="font-headline font-black text-lg text-on-surface dark:text-white">Edit Shop Profile</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-[#0D0D1A] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveDetails} className="space-y-4 pt-1">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Shop Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Description</label>
                  <textarea
                    required
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50 h-16 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    required
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50"
                    placeholder="Burgers, Chinese, Drinks"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Cooks Active</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={editCookCount}
                      onChange={(e) => setEditCookCount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Open Status</label>
                    <button
                      type="button"
                      onClick={() => setEditIsOpen(prev => !prev)}
                      className={`w-full py-3 text-xs font-bold rounded-xl border transition-all ${editIsOpen ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-red-500/10 border-red-500 text-red-500'}`}
                    >
                      {editIsOpen ? 'Open' : 'Closed'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Logo URL</label>
                  <input
                    type="text"
                    value={editLogoUrl}
                    onChange={(e) => setEditLogoUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Banner URL</label>
                  <input
                    type="text"
                    value={editBannerUrl}
                    onChange={(e) => setEditBannerUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D0D1A] border-none rounded-xl px-4 py-3 text-xs dark:text-white focus:ring-2 focus:ring-primary/50"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-zinc-500 bg-slate-50 dark:bg-[#0D0D1A] dark:text-zinc-400 hover:bg-slate-100 active:scale-95 transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] py-3 rounded-xl font-bold text-white bg-primary-gradient shadow-lg shadow-primary/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

    </div>
  );
}
