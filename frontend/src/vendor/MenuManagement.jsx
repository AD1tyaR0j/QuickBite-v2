import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';

// ── Vendor Menu Management ────────────────────────────────────
// Route: /vendor/:shopId/menu
// CRUD: Add, edit, remove menu items
export default function MenuManagement() {
  const { shopId } = useParams();
  const { fetchApi } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const emptyForm = { name: '', price: '', prepTime: '', imageUrl: '', isAvailable: true };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const fetchMenu = async () => {
    try {
      const res = await fetchApi(`/api/shops/${shopId}/menu`);
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch (e) {
      console.error('Failed to load menu:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, [shopId]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 2 || form.name.length > 60) errs.name = 'Name must be 2-60 characters';
    if (!form.price || isNaN(form.price) || parseFloat(form.price) <= 0) errs.price = 'Price must be > 0';
    if (!form.prepTime || isNaN(form.prepTime) || parseInt(form.prepTime) < 1 || parseInt(form.prepTime) > 120) errs.prepTime = 'Prep time must be 1-120 min';
    return errs;
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      price: String(item.price),
      prepTime: String(item.prepTime),
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        shopId,
        name: form.name.trim(),
        price: parseFloat(form.price),
        prepTime: parseInt(form.prepTime),
        imageUrl: form.imageUrl || undefined,
        isAvailable: form.isAvailable,
      };

      if (editItem) {
        await fetchApi(`/api/menu/${editItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('Item updated!');
      } else {
        await fetchApi('/api/menu', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('Item added!');
      }
      setShowModal(false);
      await fetchMenu();
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      await fetchApi(`/api/menu/${item.id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      showToast(`${item.name} removed`);
      await fetchMenu();
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-dark-bg font-body text-on-surface">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 max-w-7xl mx-auto w-full z-50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-yellow-600">restaurant_menu</span>
          <h1 className="text-xl font-extrabold text-yellow-600 tracking-tight font-headline">Menu Management</h1>
        </div>
        <button
          id="add-item-btn"
          onClick={openAdd}
          className="bg-primary-gradient text-white font-bold px-4 py-2 rounded-full flex items-center gap-1 text-sm active:scale-95 transition-transform shadow-lg"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Item
        </button>
      </header>

      <main className="pt-20 pb-28 px-6 max-w-7xl mx-auto">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="mt-4 space-y-4">
            <p className="text-on-surface-variant text-sm font-semibold">{items.length} items in menu</p>

            {items.length === 0 && (
              <div className="text-center py-20 text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl block mb-3">menu_book</span>
                <p className="font-medium">No menu items yet</p>
                <button onClick={openAdd} className="mt-4 bg-primary text-on-primary px-6 py-2 rounded-full font-bold text-sm active:scale-95">
                  + Add First Item
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => (
              <div key={item.id} className="bg-surface-container-lowest dark:bg-dark-card rounded-xl p-5 premium-shadow flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'; }}
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline font-bold text-on-surface dark:text-dark-text truncate">{item.name}</h4>
                    {item.isFeatured && (
                      <span className="bg-tertiary/10 text-tertiary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Featured</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-primary font-bold text-sm">₹{item.price}</span>
                    <span className="text-on-surface-variant text-[11px]">· {item.prepTime}m prep</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${item.isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
                    <span className="text-[11px] text-on-surface-variant">{item.isAvailable ? 'Available' : 'Unavailable'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    id={`edit-${item.id}`}
                    onClick={() => openEdit(item)}
                    className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-surface-container active:scale-90 transition-all"
                    title="Edit item"
                  >
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                  </button>
                  <button
                    id={`delete-${item.id}`}
                    onClick={() => setDeleteConfirm(item)}
                    className="w-9 h-9 rounded-full bg-error/10 flex items-center justify-center hover:bg-error/20 active:scale-90 transition-all"
                    title="Remove item"
                  >
                    <span className="material-symbols-outlined text-[18px] text-error">delete</span>
                  </button>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Add / Edit Modal ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-end md:items-center justify-center">
          <div className="bg-surface-container-lowest dark:bg-dark-card w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-xl font-bold text-on-surface dark:text-dark-text">
                {editItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Item Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Classic Cheeseburger"
                  className="w-full bg-surface-container-low dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary-container"
                />
                {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
              </div>
              {/* Price + Prep Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="e.g. 199"
                    className="w-full bg-surface-container-low dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary-container"
                  />
                  {errors.price && <p className="text-error text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Prep Time (min) *</label>
                  <input
                    type="number"
                    value={form.prepTime}
                    onChange={e => setForm(p => ({ ...p, prepTime: e.target.value }))}
                    placeholder="e.g. 8"
                    className="w-full bg-surface-container-low dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary-container"
                  />
                  {errors.prepTime && <p className="text-error text-xs mt-1">{errors.prepTime}</p>}
                </div>
              </div>
              {/* Image URL */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Image URL (optional)</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-surface-container-low dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary-container"
                />
              </div>
              {/* Available Toggle */}
              <div className="flex items-center justify-between p-4 bg-surface-container-low dark:bg-slate-800 rounded-xl">
                <span className="font-medium text-on-surface dark:text-dark-text">Available</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-on-surface-variant bg-surface-container-low hover:bg-surface-container active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                id="save-item-btn"
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] py-3 rounded-xl font-bold text-white bg-primary-gradient shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center px-6">
          <div className="bg-surface-container-lowest dark:bg-dark-card rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-fade-in">
            <h3 className="font-headline text-lg font-bold text-on-surface dark:text-dark-text mb-2">Remove Item?</h3>
            <p className="text-on-surface-variant text-sm mb-6">
              Remove <strong>{deleteConfirm.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl font-bold text-on-surface-variant bg-surface-container-low active:scale-95"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-btn"
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-error active:scale-95 shadow-lg"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-4 left-4 md:left-auto md:w-80 bg-inverse-surface text-on-primary-fixed p-4 rounded-xl shadow-2xl flex items-center gap-3 z-[60] animate-fade-in">
          <span className="material-symbols-outlined text-primary-fixed">check_circle</span>
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
