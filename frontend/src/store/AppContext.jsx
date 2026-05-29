import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('quickbite-dark-mode') === 'true';
  });

  const [activeOrder, setActiveOrder] = useState(() => {
    try {
      const raw = localStorage.getItem('quickbite-active-order');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [cartByShop, setCartByShop] = useState(() => {
    try {
      const raw = localStorage.getItem('quickbite-cart-v2');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Authentication states
  const [token, setToken] = useState(() => localStorage.getItem('quickbite-token') || null);
  const [currentUser, setCurrentUser] = useState(null);
  const [vendorUser, setVendorUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Address and Favorites list synchronized with backend
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [favoriteShops, setFavoriteShops] = useState([]);

  // Toast Notifications Stack
  const [toasts, setToasts] = useState([]);
  
  // Notification Center Log
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem('quickbite-notifications');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Custom fetch helper that appends token automatically
  const fetchApi = async (url, options = {}) => {
    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      ...options,
      headers
    });
    
    // In case of 403 / 401 session expiration, log out user
    if (res.status === 401 || res.status === 403) {
      const json = await res.json().catch(() => ({}));
      if (json.error && json.error.includes('Session expired')) {
        logout();
      }
    }
    
    return res;
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('quickbite-dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('quickbite-cart-v2', JSON.stringify(cartByShop));
  }, [cartByShop]);

  useEffect(() => {
    if (activeOrder) {
      localStorage.setItem('quickbite-active-order', JSON.stringify(activeOrder));
    } else {
      localStorage.removeItem('quickbite-active-order');
    }
  }, [activeOrder]);

  useEffect(() => {
    localStorage.setItem('quickbite-notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Load profile on start
  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          if (json.data.role === 'customer') {
            setCurrentUser(json.data);
            setVendorUser(null);
            // Load user specifics
            loadCustomerDetails();
          } else if (json.data.role === 'vendor') {
            setVendorUser(json.data);
            setCurrentUser(null);
          }
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (e) {
        console.error('Failed to load profile from token:', e);
      } finally {
        setAuthLoading(false);
      }
    };
    loadProfile();
  }, [token]);

  const loadCustomerDetails = async () => {
    try {
      const [addrRes, favRes] = await Promise.all([
        fetch('/api/addresses', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/favorites', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const addrJson = await addrRes.json();
      const favJson = await favRes.json();
      if (addrJson.success) setSavedAddresses(addrJson.data);
      if (favJson.success) setFavoriteShops(favJson.data);
    } catch (e) {
      console.error('Failed to load customer details:', e);
    }
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Authentication Methods
  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (json.success) {
      localStorage.setItem('quickbite-token', json.data.token);
      setToken(json.data.token);
      setCurrentUser(json.data.user);
      setVendorUser(null);
      addToast('Welcome Back!', `Logged in successfully as ${json.data.user.name}.`, 'success');
      addNotification('Logged In', 'You successfully logged into your QuickBite account.', 'info');
      return { success: true };
    }
    return { success: false, error: json.error };
  };

  const vendorLogin = async (username, password) => {
    const res = await fetch('/api/auth/vendor-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const json = await res.json();
    if (json.success) {
      localStorage.setItem('quickbite-token', json.data.token);
      setToken(json.data.token);
      setVendorUser(json.data.vendor);
      setCurrentUser(null);
      addToast('Vendor Session Started', `Dashboard loaded for ${json.data.vendor.username}.`, 'success');
      return { success: true, shopId: json.data.vendor.shopId };
    }
    return { success: false, error: json.error };
  };

  const signUp = async (name, email, phone, password, collegeId) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, collegeId })
    });
    const json = await res.json();
    if (json.success) {
      localStorage.setItem('quickbite-token', json.data.token);
      setToken(json.data.token);
      setCurrentUser(json.data.user);
      setVendorUser(null);
      addToast('Registration Successful!', 'Welcome to QuickBite.', 'success');
      addNotification('Welcome!', 'Thank you for registering on QuickBite! Order ahead and skip the queue.', 'success');
      return { success: true };
    }
    return { success: false, error: json.error };
  };

  const logout = () => {
    localStorage.removeItem('quickbite-token');
    localStorage.removeItem('quickbite-active-order');
    setToken(null);
    setCurrentUser(null);
    setVendorUser(null);
    setActiveOrder(null);
    setSavedAddresses([]);
    setFavoriteShops([]);
    addToast('Signed Out', 'You have logged out of your account.', 'info');
  };

  const updateProfile = async (updates) => {
    try {
      const res = await fetchApi('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      const json = await res.json();
      if (json.success) {
        setCurrentUser(json.data);
        addToast('Profile Updated', 'Your profile details have been saved.', 'success');
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e) {
      return { success: false, error: 'Network error. Try again later.' };
    }
  };

  // Addresses CRUD
  const addAddressLine = async (addressLine) => {
    try {
      const res = await fetchApi('/api/addresses', {
        method: 'POST',
        body: JSON.stringify({ addressLine })
      });
      const json = await res.json();
      if (json.success) {
        setSavedAddresses(prev => [...prev, json.data]);
        addToast('Address Saved', 'Address added to your account.', 'success');
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e) {
      return { success: false, error: 'Network error.' };
    }
  };

  const removeAddressLine = async (addressId) => {
    try {
      const res = await fetchApi(`/api/addresses/${addressId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setSavedAddresses(prev => prev.filter(a => a.id !== addressId));
        addToast('Address Removed', 'Address deleted.', 'info');
        return { success: true };
      }
      return { success: false, error: json.error };
    } catch (e) {
      return { success: false, error: 'Network error.' };
    }
  };

  // Favorites CRUD
  const toggleFavoriteShop = async (shopId) => {
    try {
      const res = await fetchApi(`/api/favorites/${shopId}`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success) {
        if (json.data.isFavorite) {
          setFavoriteShops(prev => [...prev, shopId]);
          addToast('Added to Favorites', 'Shop saved to favorites list.', 'success');
        } else {
          setFavoriteShops(prev => prev.filter(id => id !== shopId));
          addToast('Removed Favorite', 'Shop removed from favorites.', 'info');
        }
        return { success: true, isFavorite: json.data.isFavorite };
      }
      return { success: false, error: json.error };
    } catch (e) {
      return { success: false, error: 'Network error.' };
    }
  };

  // Toast alert manager
  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, title, message, type }]);
    
    // Auto remove after 3.5s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Notification Log helper
  const addNotification = (title, message, type = 'info') => {
    const notif = {
      id: 'notif-' + Date.now() + Math.random().toString(36).substr(2, 4),
      title,
      message,
      type,
      time: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Cart operations
  const addToCart = (shopId, item, qty = 1) => {
    setCartByShop(prev => {
      const existing = prev[shopId] || { items: {} };
      const currentEntry = existing.items[item.id] || { item, qty: 0 };
      const nextQty = currentEntry.qty + qty;
      if (nextQty <= 0) {
        const nextItems = { ...existing.items };
        delete nextItems[item.id];
        return {
          ...prev,
          [shopId]: {
            ...existing,
            items: nextItems,
          },
        };
      }
      return {
        ...prev,
        [shopId]: {
          ...existing,
          items: {
            ...existing.items,
            [item.id]: { item, qty: nextQty },
          },
        },
      };
    });
  };

  const setCartItemQty = (shopId, item, qty) => {
    setCartByShop(prev => {
      const existing = prev[shopId] || { items: {} };
      if (qty <= 0) {
        const nextItems = { ...existing.items };
        delete nextItems[item.id];
        return {
          ...prev,
          [shopId]: {
            ...existing,
            items: nextItems,
          },
        };
      }
      return {
        ...prev,
        [shopId]: {
          ...existing,
          items: {
            ...existing.items,
            [item.id]: { item, qty },
          },
        },
      };
    });
  };

  const removeFromCart = (shopId, itemId) => {
    setCartByShop(prev => {
      const existing = prev[shopId];
      if (!existing) return prev;
      const nextItems = { ...existing.items };
      delete nextItems[itemId];
      return {
        ...prev,
        [shopId]: {
          ...existing,
          items: nextItems,
        },
      };
    });
  };

  const clearCart = (shopId) => {
    setCartByShop(prev => {
      const next = { ...prev };
      delete next[shopId];
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
        activeOrder,
        setActiveOrder,
        cartByShop,
        addToCart,
        clearCart,
        setCartItemQty,
        removeFromCart,
        
        // Auth states & methods
        token,
        currentUser,
        vendorUser,
        authLoading,
        login,
        vendorLogin,
        signUp,
        logout,
        updateProfile,
        fetchApi,

        // Address & Favorites
        savedAddresses,
        addAddressLine,
        removeAddressLine,
        favoriteShops,
        toggleFavoriteShop,

        // Toasts & Notifications
        toasts,
        removeToast,
        addToast,
        notifications,
        addNotification,
        markNotificationsAsRead,
        clearNotifications
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
