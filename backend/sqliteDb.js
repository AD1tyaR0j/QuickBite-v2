let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  Database = null;
}
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'quickbite.db');
let db;

try {
  if (!Database) {
    throw new Error('better-sqlite3 module not found.');
  }
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  
  // ── Create Schemas ─────────────────────────────────────────
  
  // Users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      avatarUrl TEXT,
      collegeId TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  // Shops
  db.exec(`
    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rating REAL DEFAULT 4.0,
      tags TEXT NOT NULL, -- JSON string or comma-separated
      cookCount INTEGER DEFAULT 2,
      imageUrl TEXT,
      isOpen INTEGER DEFAULT 1, -- 0 = false, 1 = true
      logoUrl TEXT,
      bannerUrl TEXT,
      description TEXT
    )
  `);

  // Menu Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      shopId TEXT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      prepTime INTEGER NOT NULL,
      imageUrl TEXT,
      isFeatured INTEGER DEFAULT 0, -- 0 = false, 1 = true
      isAvailable INTEGER DEFAULT 1,  -- 0 = false, 1 = true
      FOREIGN KEY(shopId) REFERENCES shops(id) ON DELETE CASCADE
    )
  `);

  // Orders
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      displayId TEXT NOT NULL,
      shopId TEXT,
      userId TEXT, -- Nullable for offline orders
      itemName TEXT NOT NULL,
      imageUrl TEXT,
      itemPrice REAL NOT NULL,
      qty INTEGER NOT NULL,
      itemsJson TEXT NOT NULL, -- Details of all items ordered
      status TEXT NOT NULL, -- 'Pending', 'Preparing', 'Almost Ready', 'Ready', 'Completed'
      ept INTEGER NOT NULL,
      paymentMethod TEXT, -- 'UPI', 'Card', 'Wallet', 'Cash'
      paymentStatus TEXT, -- 'Pending', 'Paid'
      transactionId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(shopId) REFERENCES shops(id),
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);

  // Favorites
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      userId TEXT,
      shopId TEXT,
      PRIMARY KEY (userId, shopId),
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(shopId) REFERENCES shops(id) ON DELETE CASCADE
    )
  `);

  // Saved Addresses
  db.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      userId TEXT,
      addressLine TEXT NOT NULL,
      isDefault INTEGER DEFAULT 0,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Offline Loads
  db.exec(`
    CREATE TABLE IF NOT EXISTS offline_loads (
      id TEXT PRIMARY KEY,
      shopId TEXT,
      minutes INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      FOREIGN KEY(shopId) REFERENCES shops(id) ON DELETE CASCADE
    )
  `);

  // Reviews
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      userId TEXT,
      shopId TEXT,
      menuItemId TEXT, -- Nullable if rating whole shop
      ratingFood INTEGER, -- 1 to 5
      ratingShop INTEGER, -- 1 to 5
      reviewText TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(shopId) REFERENCES shops(id),
      FOREIGN KEY(menuItemId) REFERENCES menu_items(id)
    )
  `);

  // Vendors
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      shopId TEXT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY(shopId) REFERENCES shops(id) ON DELETE CASCADE
    )
  `);

  // ── Database Seeding ───────────────────────────────────────
  
  const shopCountResult = db.prepare('SELECT count(*) as count FROM shops').get();
  if (shopCountResult.count === 0) {
    console.log('🌱 Seeding QuickBite Database...');

    // Seed Shops
    const insertShop = db.prepare(`
      INSERT INTO shops (id, name, rating, tags, cookCount, imageUrl, isOpen, logoUrl, bannerUrl, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const shopsData = [
      {
        id: 'kitchen-kukkries',
        name: 'Kitchen Kukkries',
        rating: 4.5,
        tags: JSON.stringify(['Momos', 'Chinese', 'Popular']),
        cookCount: 2,
        imageUrl: '/images/kitchen_kukkries.png',
        isOpen: 1,
        logoUrl: '/images/kitchen_kukkries.png',
        bannerUrl: '/images/kitchen_kukkries.png',
        description: 'Authentic momos and Chinese street food freshly prepared for campus foodies.'
      },
      {
        id: 'kunj-burger-point',
        name: 'Kunj Burger Point',
        rating: 4.3,
        tags: JSON.stringify(['Burgers', 'Fast Food', 'Shakes']),
        cookCount: 2,
        imageUrl: '/images/kunj_burger_point.png',
        isOpen: 1,
        logoUrl: '/images/kunj_burger_point.png',
        bannerUrl: '/images/kunj_burger_point.png',
        description: 'Sizzling hot burgers, crispy fries, and premium thick milkshakes.'
      },
      {
        id: 'doctor-dosa',
        name: 'Doctor Dosa',
        rating: 4.6,
        tags: JSON.stringify(['South Indian', 'Dosa', 'Healthy']),
        cookCount: 2,
        imageUrl: '/images/doctor_dosa.png',
        isOpen: 1,
        logoUrl: '/images/doctor_dosa.png',
        bannerUrl: '/images/doctor_dosa.png',
        description: 'Healthy and delicious South Indian breakfasts, traditional filter coffee, and paper dosas.'
      },
      {
        id: 'millennials-cafe',
        name: 'Millennials Cafe',
        rating: 4.4,
        tags: JSON.stringify(['Cafe', 'Sandwiches', 'Pizza']),
        cookCount: 2,
        imageUrl: '/images/millennials_cafe.png',
        isOpen: 1,
        logoUrl: '/images/millennials_cafe.png',
        bannerUrl: '/images/millennials_cafe.png',
        description: 'Gourmet sandwiches, hot espresso coffees, and stone-baked pizzas for millennials.'
      },
      {
        id: 'momo-shakes-corner',
        name: 'Momo & Shakes Corner',
        rating: 4.2,
        tags: JSON.stringify(['Momos', 'Shakes', 'Quick']),
        cookCount: 2,
        imageUrl: '/images/momo_shakes_corner.png',
        isOpen: 1,
        logoUrl: '/images/momo_shakes_corner.png',
        bannerUrl: '/images/momo_shakes_corner.png',
        description: 'Express quick snacks, momo combos, and chilled shakes on the go.'
      },
      {
        id: 'shree-balaji',
        name: 'Shree Balaji Cafeteria',
        rating: 4.7,
        tags: JSON.stringify(['North Indian', 'Chaat', 'Thalis']),
        cookCount: 3,
        imageUrl: '/images/shree_balaji.png',
        isOpen: 1,
        logoUrl: '/images/shree_balaji.png',
        bannerUrl: '/images/shree_balaji.png',
        description: 'Delightful North Indian curries, butter naans, special thalis, and spicy street chaat.'
      },
      {
        id: 'kathi-roll-co',
        name: 'The Kathi Roll Co.',
        rating: 4.4,
        tags: JSON.stringify(['Rolls', 'Wraps', 'Snacks']),
        cookCount: 2,
        imageUrl: '/images/kathi_roll.png',
        isOpen: 1,
        logoUrl: '/images/kathi_roll.png',
        bannerUrl: '/images/kathi_roll.png',
        description: 'Spicy paneer tikka rolls, classic aloo wraps, and hot, flakey paratha rolls.'
      }
    ];

    shopsData.forEach(s => {
      insertShop.run(s.id, s.name, s.rating, s.tags, s.cookCount, s.imageUrl, s.isOpen, s.logoUrl, s.bannerUrl, s.description);
    });

    // Seed Menu Items
    const insertMenuItem = db.prepare(`
      INSERT INTO menu_items (id, shopId, name, price, prepTime, imageUrl, isFeatured, isAvailable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const menuData = [
      // Kitchen Kukkries
      { id: 'mi001', shopId: 'kitchen-kukkries', name: 'Veg Momos', price: 40, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80', isFeatured: 1, isAvailable: 1 },
      { id: 'mi002', shopId: 'kitchen-kukkries', name: 'Paneer Momos', price: 50, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi003', shopId: 'kitchen-kukkries', name: 'Veg Fried Rice', price: 60, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi004', shopId: 'kitchen-kukkries', name: 'Paneer Fried Rice', price: 80, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1536489885071-87983c3e2859?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi005', shopId: 'kitchen-kukkries', name: 'Veg Noodles', price: 70, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi006', shopId: 'kitchen-kukkries', name: 'Chilli Paneer', price: 100, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi007', shopId: 'kitchen-kukkries', name: 'Spring Rolls', price: 50, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi008', shopId: 'kitchen-kukkries', name: 'Veg Manchurian', price: 90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi009', shopId: 'kitchen-kukkries', name: 'Kurkuri Momo', price: 70, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80', isFeatured: 0, isAvailable: 1 },

      // Kunj Burger Point
      { id: 'mi010', shopId: 'kunj-burger-point', name: 'Veg Burger', price: 60, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=300&q=80', isFeatured: 1, isAvailable: 1 },
      { id: 'mi011', shopId: 'kunj-burger-point', name: 'Cheese Burger', price: 80, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi012', shopId: 'kunj-burger-point', name: 'Paneer Burger', price: 90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi013', shopId: 'kunj-burger-point', name: 'French Fries', price: 70, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi014', shopId: 'kunj-burger-point', name: 'Cold Coffee', price: 70, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi015', shopId: 'kunj-burger-point', name: 'Chocolate Shake', price: 80, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi016', shopId: 'kunj-burger-point', name: 'Aloo Tikki Burger', price: 45, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1582196016295-f8c894d37922?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi017', shopId: 'kunj-burger-point', name: 'Cheese Fries', price: 95, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi018', shopId: 'kunj-burger-point', name: 'Onion Rings', price: 60, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1639024471283-2bc7b3c6a267?w=300&q=80', isFeatured: 0, isAvailable: 1 },

      // Doctor Dosa
      { id: 'mi020', shopId: 'doctor-dosa', name: 'Masala Dosa', price: 80, prepTime: 12, imageUrl: '/images/masala_dosa.png', isFeatured: 1, isAvailable: 1 },
      { id: 'mi021', shopId: 'doctor-dosa', name: 'Butter Dosa', price: 90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi022', shopId: 'doctor-dosa', name: 'Plain Dosa', price: 70, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi023', shopId: 'doctor-dosa', name: 'Idli Sambhar', price: 70, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi024', shopId: 'doctor-dosa', name: 'Vada Sambhar', price: 80, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1540713434306-58505cf1b6fc?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi025', shopId: 'doctor-dosa', name: 'Onion Rava Dosa', price: 100, prepTime: 14, imageUrl: '/images/masala_dosa.png', isFeatured: 0, isAvailable: 1 },
      { id: 'mi026', shopId: 'doctor-dosa', name: 'Rava Dosa', price: 90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi027', shopId: 'doctor-dosa', name: 'Filter Coffee', price: 30, prepTime: 4, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi028', shopId: 'doctor-dosa', name: 'Onion Uttapam', price: 80, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80', isFeatured: 0, isAvailable: 1 },

      // Millennials Cafe
      { id: 'mi030', shopId: 'millennials-cafe', name: 'Veg Sandwich', price: 80, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80', isFeatured: 1, isAvailable: 1 },
      { id: 'mi031', shopId: 'millennials-cafe', name: 'Cheese Sandwich', price: 90, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi032', shopId: 'millennials-cafe', name: 'Pasta', price: 55, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi033', shopId: 'millennials-cafe', name: 'Pizza', price: 60, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi034', shopId: 'millennials-cafe', name: 'Cake Slice', price: 70, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi035', shopId: 'millennials-cafe', name: 'Garlic Bread', price: 70, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1573145959956-e9fae6b8bd4f?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi036', shopId: 'millennials-cafe', name: 'Paneer Tikka Pizza', price: 120, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi037', shopId: 'millennials-cafe', name: 'Cappuccino', price: 60, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi038', shopId: 'millennials-cafe', name: 'Hot Chocolate', price: 75, prepTime: 6, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&q=80', isFeatured: 0, isAvailable: 1 },

      // Momo & Shakes Corner
      { id: 'mi040', shopId: 'momo-shakes-corner', name: 'Veg Momos', price: 40, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80', isFeatured: 1, isAvailable: 1 },
      { id: 'mi041', shopId: 'momo-shakes-corner', name: 'Paneer Momos', price: 60, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi042', shopId: 'momo-shakes-corner', name: 'Chocolate Shake', price: 70, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi043', shopId: 'momo-shakes-corner', name: 'Maggi', price: 50, prepTime: 7, imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi044', shopId: 'momo-shakes-corner', name: 'French Fries', price: 70, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi045', shopId: 'momo-shakes-corner', name: 'Cheese Maggi', price: 65, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi046', shopId: 'momo-shakes-corner', name: 'Oreo Shake', price: 90, prepTime: 6, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi047', shopId: 'momo-shakes-corner', name: 'Paneer Kurkuri Momo', price: 85, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi048', shopId: 'momo-shakes-corner', name: 'Mango Shake', price: 80, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80', isFeatured: 0, isAvailable: 1 },

      // Shree Balaji Cafeteria
      { id: 'mi050', shopId: 'shree-balaji', name: 'Paneer Butter Masala & Naan Combo', price: 150, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80', isFeatured: 1, isAvailable: 1 },
      { id: 'mi051', shopId: 'shree-balaji', name: 'Chole Bhature Platter', price: 90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', isFeatured: 1, isAvailable: 1 },
      { id: 'mi052', shopId: 'shree-balaji', name: 'Delhi Samosa Chaat', price: 60, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi053', shopId: 'shree-balaji', name: 'Executive Veg Thali', price: 180, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi054', shopId: 'shree-balaji', name: 'Punjabi Rajma Chawal', price: 80, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi055', shopId: 'shree-balaji', name: 'Sweet Kulhad Lassi', price: 50, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi056', shopId: 'shree-balaji', name: 'Gulab Jamun (2 Pcs)', price: 40, prepTime: 4, imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80', isFeatured: 0, isAvailable: 1 },

      // The Kathi Roll Co.
      { id: 'mi060', shopId: 'kathi-roll-co', name: 'Double Paneer Tikka Roll', price: 90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', isFeatured: 1, isAvailable: 1 },
      { id: 'mi061', shopId: 'kathi-roll-co', name: 'Spicy Soya Chaap Roll', price: 80, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', isFeatured: 1, isAvailable: 1 },
      { id: 'mi062', shopId: 'kathi-roll-co', name: 'Masala Aloo Roll', price: 60, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi063', shopId: 'kathi-roll-co', name: 'Cheese Corn Wrap', price: 90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi064', shopId: 'kathi-roll-co', name: 'Paneer Bhurji Roll', price: 100, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi065', shopId: 'kathi-roll-co', name: 'Lemon Mint Cooler', price: 60, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&q=80', isFeatured: 0, isAvailable: 1 },
      { id: 'mi066', shopId: 'kathi-roll-co', name: 'Spicy Peri Peri Fries', price: 80, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80', isFeatured: 0, isAvailable: 1 }
    ];

    menuData.forEach(m => {
      insertMenuItem.run(m.id, m.shopId, m.name, m.price, m.prepTime, m.imageUrl, m.isFeatured, m.isAvailable);
    });

    // Seed Default User (Aditya Raj)
    const userId = 'usr-aditya';
    const userPasswordHash = bcrypt.hashSync('adi@123', 8);
    db.prepare(`
      INSERT INTO users (id, name, email, phone, password, avatarUrl, collegeId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      'Aditya Raj',
      'aditya@quickbite.com',
      '9876543210',
      userPasswordHash,
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      'COL-2026-089',
      new Date().toISOString()
    );

    // Seed 4 additional users
    const extraUsers = [
      { id: 'usr-smriti', name: 'Smriti', email: 'smriti@quickbite.com', pass: 'smriti123', phone: '9876543211', collId: 'COL-2026-001', pic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
      { id: 'usr-muskan', name: 'muskan', email: 'muskan@quickbite.com', pass: 'muskan123', phone: '9876543212', collId: 'COL-2026-002', pic: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
      { id: 'usr-aditi', name: 'aditi', email: 'aditi@quickbite.com', pass: 'aditi123', phone: '9876543213', collId: 'COL-2026-003', pic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80' },
      { id: 'usr-divyesh', name: 'divyesh', email: 'divyesh@quickbite.com', pass: 'divyesh123', phone: '9876543214', collId: 'COL-2026-004', pic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' }
    ];

    const insertUserStmt = db.prepare(`
      INSERT INTO users (id, name, email, phone, password, avatarUrl, collegeId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    extraUsers.forEach(u => {
      insertUserStmt.run(u.id, u.name, u.email, u.phone, bcrypt.hashSync(u.pass, 8), u.pic, u.collId, new Date().toISOString());
    });

    // Seed Addresses for Users
    const insertAddrStmt = db.prepare(`
      INSERT INTO addresses (id, userId, addressLine, isDefault)
      VALUES (?, ?, ?, ?)
    `);

    // Addresses for Aditya
    insertAddrStmt.run('addr-1', userId, 'Room 304, Hostel A, Campus North', 1);
    insertAddrStmt.run('addr-2', userId, 'Computer Lab 2, Library Block', 0);

    // Addresses for other users
    insertAddrStmt.run('addr-3', 'usr-smriti', 'Hostel B, Room 102, Campus East', 1);
    insertAddrStmt.run('addr-4', 'usr-muskan', 'Girls Hostel, Room 405, Campus West', 1);
    insertAddrStmt.run('addr-5', 'usr-aditi', 'Room 215, Hostel C, Campus South', 1);
    insertAddrStmt.run('addr-6', 'usr-divyesh', 'Girls Hostel, Room 112, Campus West', 1);

    // Seed Vendors & Accounts
    const insertVendor = db.prepare(`
      INSERT INTO vendors (id, shopId, username, password, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);

    const vendorsData = [
      { id: 'vend-1', shopId: 'kitchen-kukkries', username: 'kukkries', pass: 'kukkries123' },
      { id: 'vend-2', shopId: 'kunj-burger-point', username: 'burgerpoint', pass: 'burger123' },
      { id: 'vend-3', shopId: 'doctor-dosa', username: 'doctordosa', pass: 'dosa123' },
      { id: 'vend-4', shopId: 'millennials-cafe', username: 'millennials', pass: 'cafe123' },
      { id: 'vend-5', shopId: 'momo-shakes-corner', username: 'momoshakes', pass: 'momo123' },
      { id: 'vend-6', shopId: 'shree-balaji', username: 'balaji', pass: 'balaji123' },
      { id: 'vend-7', shopId: 'kathi-roll-co', username: 'kathiroll', pass: 'kathi123' }
    ];

    vendorsData.forEach(v => {
      const hash = bcrypt.hashSync(v.pass, 8);
      insertVendor.run(v.id, v.shopId, v.username, hash, new Date().toISOString());
    });

    // Seed active order for live dashboard testing
    const orderId1 = 'ord-a3f2';
    const orderId2 = 'ord-b7k1';
    const orderId3 = 'ord-c9r4';

    const insertOrder = db.prepare(`
      INSERT INTO orders (id, displayId, shopId, userId, itemName, imageUrl, itemPrice, qty, itemsJson, status, ept, paymentMethod, paymentStatus, transactionId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      orderId1,
      '#A3F2',
      'kitchen-kukkries',
      userId,
      'Veg Momos',
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80',
      40,
      1,
      JSON.stringify([{ menuItemId: 'mi001', itemName: 'Veg Momos', itemPrice: 40, prepTime: 10, qty: 1 }]),
      'Preparing',
      10,
      'UPI',
      'Paid',
      'TXN-A3F2-TEST',
      new Date(Date.now() - 5 * 60000).toISOString(),
      new Date(Date.now() - 5 * 60000).toISOString()
    );

    insertOrder.run(
      orderId2,
      '#B7K1',
      'kitchen-kukkries',
      userId,
      'Veg Noodles',
      'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&q=80',
      70,
      1,
      JSON.stringify([{ menuItemId: 'mi005', itemName: 'Veg Noodles', itemPrice: 70, prepTime: 12, qty: 1 }]),
      'Preparing',
      12,
      'Card',
      'Paid',
      'TXN-B7K1-TEST',
      new Date(Date.now() - 2 * 60000).toISOString(),
      new Date(Date.now() - 2 * 60000).toISOString()
    );

    insertOrder.run(
      orderId3,
      '#C9R4',
      'kitchen-kukkries',
      userId,
      'Paneer Momos',
      'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80',
      50,
      1,
      JSON.stringify([{ menuItemId: 'mi002', itemName: 'Paneer Momos', itemPrice: 50, prepTime: 12, qty: 1 }]),
      'Ready',
      0,
      'Wallet',
      'Paid',
      'TXN-C9R4-TEST',
      new Date(Date.now() - 12 * 60000).toISOString(),
      new Date(Date.now() - 1 * 60000).toISOString()
    );

    console.log('✅ QuickBite Database Seeded Successfully!');
  }
} catch (e) {
  console.warn('⚠️ SQLite connection or schema failed. Using Fallback mode in db.js.');
  console.error(e);
  db = null;
}

module.exports = db;
