// ============================================================
// QuickBite — Express REST API Server
// ============================================================

require('dotenv').config();

// Production-ready Process Event Listeners
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { calculateEPT, calculateShopEPT, calculateCartEPT } = require('./ept');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'quickbite-super-secret-key-college-cafeteria';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
  credentials: true
}));
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[API Request] [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Top-level Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});


// Standard response wrapper
const ok = (data) => ({ success: true, data });
const err = (msg, status = 400) => ({ success: false, error: msg, status });

// JWT Token parser middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return next(); // Pass as guest
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      // Invalid token, but let it pass as guest, or return error if route strictly requires auth
      return res.status(403).json({ success: false, error: 'Session expired. Please log in again.' });
    }
    req.user = decoded;
    next();
  });
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Access denied: Authentication required.' });
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ success: false, error: `Access denied: Requires ${role} role.` });
    }
    next();
  };
}

app.use(authenticateToken);

// ─────────────────────────────────────────────────────────────
// AUTHENTICATION ENDPOINTS
// ─────────────────────────────────────────────────────────────

// POST /api/auth/register — Register customer
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password, collegeId } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json(err('All fields (name, email, phone, password) are required.'));
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json(err('An account with this email already exists.'));
  }

  const passwordHash = bcrypt.hashSync(password, 8);
  const user = db.createUser(name, email, phone, passwordHash, null, collegeId);

  // Sign JWT
  const token = jwt.sign({ id: user.id, email: user.email, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
  
  const { password: _, ...userProfile } = user;
  res.status(201).json(ok({ token, user: userProfile }));
});

// POST /api/auth/login — Login customer
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json(err('Email and password are required.'));
  }

  const user = db.getUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json(err('Invalid email or password.'));
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userProfile } = user;
  res.json(ok({ token, user: userProfile }));
});

// POST /api/auth/forgot-password — Forgot password UI handler
app.post('/api/auth/forgot-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json(err('Email and new password are required.'));
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json(err('No account associated with this email address.'));
  }

  const passwordHash = bcrypt.hashSync(newPassword, 8);
  db.updateUser(user.id, { password: passwordHash });
  res.json(ok('Password successfully reset. You can now login.'));
});

// POST /api/auth/vendor-login — Login vendor
app.post('/api/auth/vendor-login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json(err('Username and password are required.'));
  }

  const vendor = db.getVendorByUsername(username);
  if (!vendor || !bcrypt.compareSync(password, vendor.password)) {
    return res.status(401).json(err('Invalid vendor credentials.'));
  }

  const token = jwt.sign({ id: vendor.id, shopId: vendor.shopId, username: vendor.username, role: 'vendor' }, JWT_SECRET, { expiresIn: '7d' });
  res.json(ok({ token, vendor: { id: vendor.id, shopId: vendor.shopId, username: vendor.username, role: 'vendor' } }));
});

// GET /api/auth/me — Retrieve self profile
app.get('/api/auth/me', requireAuth, (req, res) => {
  if (req.user.role === 'customer') {
    const user = db.getUserById(req.user.id);
    if (!user) return res.status(404).json(err('User not found.'));
    const { password: _, ...userProfile } = user;
    res.json(ok({ ...userProfile, role: 'customer' }));
  } else {
    const vendor = db.getVendorById(req.user.id);
    if (!vendor) return res.status(404).json(err('Vendor not found.'));
    res.json(ok({ id: vendor.id, shopId: vendor.shopId, username: vendor.username, role: 'vendor' }));
  }
});

// PUT /api/auth/profile — Update customer profile
app.put('/api/auth/profile', requireAuth, requireRole('customer'), (req, res) => {
  const updated = db.updateUser(req.user.id, req.body);
  if (!updated) return res.status(404).json(err('User not found.'));
  const { password: _, ...userProfile } = updated;
  res.json(ok(userProfile));
});

// ─────────────────────────────────────────────────────────────
// ADDRESS BOOK ENDPOINTS
// ─────────────────────────────────────────────────────────────

app.get('/api/addresses', requireAuth, requireRole('customer'), (req, res) => {
  const list = db.getAddressesByUserId(req.user.id);
  res.json(ok(list));
});

app.post('/api/addresses', requireAuth, requireRole('customer'), (req, res) => {
  const { addressLine } = req.body;
  if (!addressLine || addressLine.trim().length < 5) {
    return res.status(400).json(err('Please provide a valid address line (min 5 chars).'));
  }
  const addr = db.addAddress(req.user.id, addressLine.trim());
  res.status(201).json(ok(addr));
});

app.delete('/api/addresses/:id', requireAuth, requireRole('customer'), (req, res) => {
  const deleted = db.deleteAddress(req.params.id, req.user.id);
  if (!deleted) return res.status(404).json(err('Address not found.'));
  res.json(ok({ deleted: true }));
});

// ─────────────────────────────────────────────────────────────
// FAVORITE SHOPS ENDPOINTS
// ─────────────────────────────────────────────────────────────

app.get('/api/favorites', requireAuth, requireRole('customer'), (req, res) => {
  const list = db.getFavoritesByUserId(req.user.id);
  res.json(ok(list));
});

app.post('/api/favorites/:shopId', requireAuth, requireRole('customer'), (req, res) => {
  const isFav = db.toggleFavorite(req.user.id, req.params.shopId);
  res.json(ok({ isFavorite: isFav }));
});

// ─────────────────────────────────────────────────────────────
// REVIEW ENDPOINTS
// ─────────────────────────────────────────────────────────────

app.get('/api/reviews/:shopId', (req, res) => {
  const reviews = db.getReviewsByShopId(req.params.shopId);
  res.json(ok(reviews));
});

app.post('/api/reviews', requireAuth, requireRole('customer'), (req, res) => {
  const { shopId, menuItemId, ratingFood, ratingShop, reviewText } = req.body;
  if (!shopId || (!ratingFood && !ratingShop)) {
    return res.status(400).json(err('shopId and at least one rating (food or shop) are required.'));
  }

  const review = db.addReview(req.user.id, shopId, menuItemId, ratingFood, ratingShop, reviewText);
  res.status(201).json(ok(review));
});

// ─────────────────────────────────────────────────────────────
// SHOP ENDPOINTS
// ─────────────────────────────────────────────────────────────

// GET /api/shops — List all shops with computed EPT + crowdLevel
app.get('/api/shops', (req, res) => {
  const shops = db.getAllShops();
  const enriched = shops.map(shop => {
    const { ept, crowdLevel } = calculateShopEPT(shop.id);
    return { ...shop, ept, crowdLevel };
  });
  res.json(ok(enriched));
});

// GET /api/shops/:id — Single shop detail
app.get('/api/shops/:id', (req, res) => {
  const shop = db.getShopById(req.params.id);
  if (!shop) return res.status(404).json(err('Shop not found', 404));
  const { ept, crowdLevel } = calculateShopEPT(shop.id);
  res.json(ok({ ...shop, ept, crowdLevel }));
});

// PUT /api/shops/:id — Edit shop details (Requires vendor verification)
app.put('/api/shops/:id', requireAuth, requireRole('vendor'), (req, res) => {
  const { id } = req.params;
  if (req.user.shopId !== id) {
    return res.status(403).json(err('Access denied: You can only edit your own shop.'));
  }
  const updated = db.updateShopDetails(id, req.body);
  if (!updated) return res.status(404).json(err('Shop not found.'));
  res.json(ok(updated));
});

// GET /api/shops/:id/menu — Menu items for a shop
app.get('/api/shops/:id/menu', (req, res) => {
  const shop = db.getShopById(req.params.id);
  if (!shop) return res.status(404).json(err('Shop not found', 404));
  const menu = db.getMenuByShopId(req.params.id);
  res.json(ok(menu));
});

// ─────────────────────────────────────────────────────────────
// ORDER ENDPOINTS
// ─────────────────────────────────────────────────────────────

// POST /api/orders — Create a new order (with user association)
app.post('/api/orders', (req, res) => {
  const { shopId, menuItemId, qty = 1, items, paymentMethod, paymentStatus, transactionId } = req.body;
  if (!shopId) {
    return res.status(400).json(err('shopId is required'));
  }

  let eptResult;
  let orderData;

  if (Array.isArray(items) && items.length > 0) {
    eptResult = calculateCartEPT(shopId, items);
    orderData = { shopId, items, ept: eptResult.ept };
  } else {
    if (!menuItemId) {
      return res.status(400).json(err('menuItemId is required when items array is not provided'));
    }
    eptResult = calculateEPT(shopId, menuItemId);
    orderData = { shopId, menuItemId, qty, ept: eptResult.ept };
  }

  // Bind order to current user if authorized
  if (req.user && req.user.role === 'customer') {
    orderData.userId = req.user.id;
  }
  
  orderData.paymentMethod = paymentMethod || 'Cash On Pickup';
  orderData.paymentStatus = paymentStatus || 'Pending';
  orderData.transactionId = transactionId || null;
  orderData.status = 'Pending'; // Starts as pending

  const order = db.createOrder(orderData);
  if (!order) return res.status(400).json(err('Failed to create order'));

  res.status(201).json(ok({ ...order, crowdLevel: eptResult.crowdLevel }));
});

// GET /api/orders/:id — Get order by ID
app.get('/api/orders/:id', (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json(err('Order not found', 404));
  const shop = db.getShopById(order.shopId);
  res.json(ok({ ...order, shopName: shop ? shop.name : order.shopId }));
});

// PATCH /api/orders/:id/status — Update order status (Vendor Route protection)
app.patch('/api/orders/:id/status', requireAuth, requireRole('vendor'), (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Preparing', 'Almost Ready', 'Ready', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json(err('Invalid status'));
  }
  
  const orderCheck = db.getOrderById(req.params.id);
  if (!orderCheck) return res.status(404).json(err('Order not found', 404));
  
  // Verify vendor matches order shop
  if (req.user.shopId !== orderCheck.shopId) {
    return res.status(403).json(err('Access denied: Unauthorized to manage orders for this shop.'));
  }

  const order = db.updateOrderStatus(req.params.id, status);
  res.json(ok(order));
});

// PATCH /api/orders/:id/cancel — Customer cancels their own order
app.patch('/api/orders/:id/cancel', requireAuth, requireRole('customer'), (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json(err('Order not found', 404));
  if (order.userId && order.userId !== req.user.id) {
    return res.status(403).json(err('Access denied: You can only cancel your own orders.'));
  }
  // Only allow cancellation if order is not already Completed or Ready
  const nonCancellable = ['Completed', 'Ready', 'Almost Ready'];
  if (nonCancellable.includes(order.status)) {
    return res.status(400).json(err('Cannot cancel an order that is already in progress or completed.'));
  }
  const cancelledOrder = db.updateOrderStatus(req.params.id, 'Cancelled');

  // Proactive duplicate cleanup:
  try {
    const cancelTime = new Date(order.createdAt).getTime();
    const allOrders = db.getAllOrders();
    allOrders.forEach(o => {
      if (o.id !== order.id && o.shopId === order.shopId && o.itemPrice === order.itemPrice && o.userId === order.userId) {
        const oTime = new Date(o.createdAt).getTime();
        if (Math.abs(cancelTime - oTime) < 5000) {
          if (!['Cancelled', 'Completed', 'Ready', 'Almost Ready'].includes(o.status)) {
            db.updateOrderStatus(o.id, 'Cancelled');
          }
        }
      }
    });
  } catch (err) {
    console.error("Failed to cleanup duplicate orders:", err);
  }

  res.json(ok(cancelledOrder));
});

// PATCH /api/orders/cancel-all — Customer cancels all specified active orders
app.patch('/api/orders/cancel-all', requireAuth, requireRole('customer'), (req, res) => {
  const { orderIds } = req.body;
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json(err('orderIds array is required'));
  }

  const updatedOrders = [];
  for (const id of orderIds) {
    const order = db.getOrderById(id);
    if (order) {
      if (order.userId && order.userId !== req.user.id) {
        continue;
      }
      if (!['Cancelled', 'Completed', 'Ready', 'Almost Ready'].includes(order.status)) {
        const cancelled = db.updateOrderStatus(id, 'Cancelled');
        if (cancelled) {
          updatedOrders.push(cancelled);
        }
      }
    }
  }
  res.json(ok(updatedOrders));
});

// GET /api/orders — Retrieve active orders (Customer lists self, Vendor lists shop)
app.get('/api/orders', (req, res) => {
  const { shopId } = req.query;
  
  let orders;
  if (shopId) {
    // If vendor login present, verify they own this shop
    if (req.user && req.user.role === 'vendor' && req.user.shopId !== shopId) {
      return res.status(403).json(err('Access denied: Unauthorized to view orders for this shop.'));
    }
    orders = db.getOrdersByShopId(shopId);
  } else {
    // Customer profile lists own order history, otherwise fall back to all
    if (req.user && req.user.role === 'customer') {
      orders = db.getOrdersByUserId(req.user.id);
    } else {
      orders = db.getAllOrders();
    }
  }

  // Enrich orders with shopName
  const enriched = orders.map(o => {
    const shop = db.getShopById(o.shopId);
    return { ...o, shopName: shop ? shop.name : o.shopId };
  });

  res.json(ok(enriched));
});

// ─────────────────────────────────────────────────────────────
// MENU MANAGEMENT ENDPOINTS (Protected)
// ─────────────────────────────────────────────────────────────

// POST /api/menu — Add a new menu item
app.post('/api/menu', requireAuth, requireRole('vendor'), (req, res) => {
  const { shopId, name, price, prepTime, imageUrl, isFeatured, isAvailable } = req.body;
  if (!shopId || !name || price === undefined || prepTime === undefined) {
    return res.status(400).json(err('shopId, name, price, prepTime are required'));
  }
  if (req.user.shopId !== shopId) {
    return res.status(403).json(err('Access denied: Unauthorized to manage menu for this shop.'));
  }
  if (name.length < 2 || name.length > 60) {
    return res.status(400).json(err('name must be 2-60 characters'));
  }
  if (price <= 0) return res.status(400).json(err('price must be > 0'));
  if (prepTime < 1 || prepTime > 120) {
    return res.status(400).json(err('prepTime must be 1-120 minutes'));
  }

  const item = db.addMenuItem({ shopId, name, price, prepTime, imageUrl, isFeatured, isAvailable });
  res.status(201).json(ok(item));
});

// PUT /api/menu/:id — Update a menu item
app.put('/api/menu/:id', requireAuth, requireRole('vendor'), (req, res) => {
  const itemCheck = db.getMenuItemById(req.params.id);
  if (!itemCheck) return res.status(404).json(err('Menu item not found'));
  
  if (req.user.shopId !== itemCheck.shopId) {
    return res.status(403).json(err('Access denied: Unauthorized to manage menu for this shop.'));
  }

  const updates = req.body;
  const item = db.updateMenuItem(req.params.id, updates);
  res.json(ok(item));
});

// DELETE /api/menu/:id — Remove a menu item
app.delete('/api/menu/:id', requireAuth, requireRole('vendor'), (req, res) => {
  const itemCheck = db.getMenuItemById(req.params.id);
  if (!itemCheck) return res.status(404).json(err('Menu item not found'));

  if (req.user.shopId !== itemCheck.shopId) {
    return res.status(403).json(err('Access denied: Unauthorized to manage menu for this shop.'));
  }

  const deleted = db.deleteMenuItem(req.params.id);
  res.json(ok({ deleted }));
});

// ─────────────────────────────────────────────────────────────
// OFFLINE LOAD ENDPOINTS
// ─────────────────────────────────────────────────────────────

// POST /api/offline-load — Add an offline load entry
app.post('/api/offline-load', requireAuth, requireRole('vendor'), (req, res) => {
  const { shopId, minutes, items, avgPrepTime } = req.body;
  if (!shopId) return res.status(400).json(err('shopId is required'));

  if (req.user.shopId !== shopId) {
    return res.status(403).json(err('Access denied: Unauthorized to inject load for this shop.'));
  }

  let resolvedMinutes = 0;

  // If direct minutes provided, use as-is
  if (minutes !== undefined && minutes > 0) {
    resolvedMinutes = parseInt(minutes);
  }
  // If items count provided, convert: items × avgPrepTime (default avg=8)
  else if (items !== undefined && items > 0) {
    const avg = avgPrepTime || 8;
    resolvedMinutes = parseInt(items) * avg;
  } else {
    return res.status(400).json(err('Provide minutes or items count'));
  }

  const load = db.addOfflineLoad({ shopId, minutes: resolvedMinutes });
  res.status(201).json(ok(load));
});

// GET /api/offline-load/:shopId — Get active offline loads for a shop
app.get('/api/offline-load/:shopId', (req, res) => {
  const loads = db.getActiveOfflineLoads(req.params.shopId);
  res.json(ok(loads));
});

// ─────────────────────────────────────────────────────────────
// EPT CALCULATION ENDPOINTS
// ─────────────────────────────────────────────────────────────

// GET /api/ept?shopId=X&menuItemId=Y — Compute EPT server-side
app.get('/api/ept', (req, res) => {
  const { shopId, menuItemId } = req.query;
  if (!shopId || !menuItemId) {
    return res.status(400).json(err('shopId and menuItemId are required'));
  }
  const result = calculateEPT(shopId, menuItemId);
  res.json(ok(result));
});

// POST /api/ept-cart — Compute EPT for a cart of items
app.post('/api/ept-cart', (req, res) => {
  const { shopId, items } = req.body;
  if (!shopId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json(err('shopId and items are required'));
  }
  const result = calculateCartEPT(shopId, items);
  res.json(ok(result));
});

// ─────────────────────────────────────────────────────────────
// ANALYTICS ENDPOINT (Requires Vendor Verification)
// ─────────────────────────────────────────────────────────────

// GET /api/analytics — Fetch vendor sales analytics
app.get('/api/analytics', requireAuth, requireRole('vendor'), (req, res) => {
  const { shopId, period = 'weekly' } = req.query;
  if (!shopId) return res.status(400).json(err('shopId is required.'));

  if (req.user.shopId !== shopId) {
    return res.status(403).json(err('Access denied: Unauthorized to view analytics for this shop.'));
  }

  const analytics = db.getAnalytics(shopId, period);
  res.json(ok(analytics));
});

// ─────────────────────────────────────────────────────────────
// SEO SITEMAP & ROBOTS ENDPOINTS
// ─────────────────────────────────────────────────────────────

// GET /sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  const shops = db.getAllShops();
  let shopUrls = shops
    .map(s => `  <url>\n    <loc>${FRONTEND_URL}/customer/menu/${s.id}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`)
    .join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${FRONTEND_URL}/customer/home</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${FRONTEND_URL}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
${shopUrls}
</urlset>`;
  res.send(sitemap);
});

// GET /robots.txt
app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Sitemap: ${BACKEND_URL}/sitemap.xml`);
});

// ─────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json(ok({ status: 'QuickBite API running', timestamp: new Date().toISOString() }));
});

// ─────────────────────────────────────────────────────────────
// Serve Frontend static assets in Production Monolith mode
// ─────────────────────────────────────────────────────────────
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// ─────────────────────────────────────────────────────────────
// Express Error Handling Middleware
// ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[Express Error] [${new Date().toISOString()}] Handler caught error:`, err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ─────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 QuickBite API running in [${process.env.NODE_ENV || 'development'}] mode`);
  console.log(`🍔 Server listening on ${BACKEND_URL}`);
  console.log(`   Health API:  ${BACKEND_URL}/api/health`);
  console.log(`   Health Check: ${BACKEND_URL}/health`);
  console.log(`   Sitemap:      ${BACKEND_URL}/sitemap.xml\n`);
});

module.exports = app;
