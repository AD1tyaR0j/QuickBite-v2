// ============================================================
// QuickBite — Dual-Mode Database Wrapper (SQLite / JSON Fallback)
// ============================================================
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Try loading SQLite database engine
const sqliteDb = require('./sqliteDb');

const fallbackPath = path.resolve(__dirname, 'quickbite_db_fallback.json');

// In-Memory fallback store
let fallbackData = {
  users: [],
  vendors: [],
  shops: [],
  menuItems: [],
  orders: [],
  favorites: [],
  addresses: [],
  offlineLoads: [],
  reviews: []
};

// Seed fallback data if JSON file doesn't exist
function initFallbackData() {
  if (fs.existsSync(fallbackPath)) {
    try {
      const content = fs.readFileSync(fallbackPath, 'utf8');
      fallbackData = JSON.parse(content);
      return;
    } catch (e) {
      console.error('Failed to load fallback JSON. Resetting store.', e);
    }
  }

  // Pre-seed mock data for fallback
  fallbackData.shops = [
    { id: 'kitchen-kukkries', name: 'Kitchen Kukkries', rating: 4.5, tags: ['Momos', 'Chinese', 'Popular'], cookCount: 2, imageUrl: '/images/kitchen_kukkries.png', isOpen: true, logoUrl: '/images/kitchen_kukkries.png', bannerUrl: '/images/kitchen_kukkries.png', description: 'Authentic momos and Chinese street food freshly prepared for campus foodies.' },
    { id: 'kunj-burger-point', name: 'Kunj Burger Point', rating: 4.3, tags: ['Burgers', 'Fast Food', 'Shakes'], cookCount: 2, imageUrl: '/images/kunj_burger_point.png', isOpen: true, logoUrl: '/images/kunj_burger_point.png', bannerUrl: '/images/kunj_burger_point.png', description: 'Sizzling hot burgers, crispy fries, and premium thick milkshakes.' },
    { id: 'doctor-dosa', name: 'Doctor Dosa', rating: 4.6, tags: ['South Indian', 'Dosa', 'Healthy'], cookCount: 2, imageUrl: '/images/doctor_dosa.png', isOpen: true, logoUrl: '/images/doctor_dosa.png', bannerUrl: '/images/doctor_dosa.png', description: 'Healthy and South Indian breakfasts, traditional filter coffee, and paper dosas.' },
    { id: 'millennials-cafe', name: 'Millennials Cafe', rating: 4.4, tags: ['Cafe', 'Sandwiches', 'Pizza'], cookCount: 2, imageUrl: '/images/millennials_cafe.png', isOpen: true, logoUrl: '/images/millennials_cafe.png', bannerUrl: '/images/millennials_cafe.png', description: 'Gourmet sandwiches, hot espresso coffees, and stone-baked pizzas for millennials.' },
    { id: 'momo-shakes-corner', name: 'Momo & Shakes Corner', rating: 4.2, tags: ['Momos', 'Shakes', 'Quick'], cookCount: 2, imageUrl: '/images/momo_shakes_corner.png', isOpen: true, logoUrl: '/images/momo_shakes_corner.png', bannerUrl: '/images/momo_shakes_corner.png', description: 'Express quick snacks, momo combos, and chilled shakes on the go.' },
    { id: 'shree-balaji', name: 'Shree Balaji Cafeteria', rating: 4.7, tags: ['North Indian', 'Chaat', 'Thalis'], cookCount: 3, imageUrl: '/images/shree_balaji.png', isOpen: true, logoUrl: '/images/shree_balaji.png', bannerUrl: '/images/shree_balaji.png', description: 'Delightful North Indian curries, butter naans, special thalis, and spicy street chaat.' },
    { id: 'kathi-roll-co', name: 'The Kathi Roll Co.', rating: 4.4, tags: ['Rolls', 'Wraps', 'Snacks'], cookCount: 2, imageUrl: '/images/kathi_roll.png', isOpen: true, logoUrl: '/images/kathi_roll.png', bannerUrl: '/images/kathi_roll.png', description: 'Spicy paneer tikka rolls, classic aloo wraps, and hot, flakey paratha rolls.' }
  ];

  fallbackData.menuItems = [
    // Kitchen Kukkries
    { id: 'mi001', shopId: 'kitchen-kukkries', name: 'Veg Momos', price: 40, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80', isFeatured: true, isAvailable: true },
    { id: 'mi002', shopId: 'kitchen-kukkries', name: 'Paneer Momos', price: 50, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi003', shopId: 'kitchen-kukkries', name: 'Veg Fried Rice', price: 60, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi004', shopId: 'kitchen-kukkries', name: 'Paneer Fried Rice', price: 80, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1536489885071-87983c3e2859?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi005', shopId: 'kitchen-kukkries', name: 'Veg Noodles', price: 70, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi006', shopId: 'kitchen-kukkries', name: 'Chilli Paneer', price: 100, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi007', shopId: 'kitchen-kukkries', name: 'Spring Rolls', price: 50, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi008', shopId: 'kitchen-kukkries', name: 'Veg Manchurian', price: 90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi009', shopId: 'kitchen-kukkries', name: 'Kurkuri Momo', price: 70, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80', isFeatured: false, isAvailable: true },

    // Kunj Burger Point
    { id: 'mi010', shopId: 'kunj-burger-point', name: 'Veg Burger', price: 60, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=300&q=80', isFeatured: true, isAvailable: true },
    { id: 'mi011', shopId: 'kunj-burger-point', name: 'Cheese Burger', price: 80, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi012', shopId: 'kunj-burger-point', name: 'Paneer Burger', price: 90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi013', shopId: 'kunj-burger-point', name: 'French Fries', price: 70, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi014', shopId: 'kunj-burger-point', name: 'Cold Coffee', price: 70, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi015', shopId: 'kunj-burger-point', name: 'Chocolate Shake', price: 80, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi016', shopId: 'kunj-burger-point', name: 'Aloo Tikki Burger', price: 45, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1582196016295-f8c894d37922?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi017', shopId: 'kunj-burger-point', name: 'Cheese Fries', price: 95, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi018', shopId: 'kunj-burger-point', name: 'Onion Rings', price: 60, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1639024471283-2bc7b3c6a267?w=300&q=80', isFeatured: false, isAvailable: true },

    // Doctor Dosa
    { id: 'mi020', shopId: 'doctor-dosa', name: 'Masala Dosa', price: 80, prepTime: 12, imageUrl: '/images/masala_dosa.png', isFeatured: true, isAvailable: true },
    { id: 'mi021', shopId: 'doctor-dosa', name: 'Butter Dosa', price: 90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi022', shopId: 'doctor-dosa', name: 'Plain Dosa', price: 70, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi023', shopId: 'doctor-dosa', name: 'Idli Sambhar', price: 70, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi024', shopId: 'doctor-dosa', name: 'Vada Sambhar', price: 80, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1540713434306-58505cf1b6fc?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi025', shopId: 'doctor-dosa', name: 'Onion Rava Dosa', price: 100, prepTime: 14, imageUrl: '/images/masala_dosa.png', isFeatured: false, isAvailable: true },
    { id: 'mi026', shopId: 'doctor-dosa', name: 'Rava Dosa', price: 90, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi027', shopId: 'doctor-dosa', name: 'Filter Coffee', price: 30, prepTime: 4, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi028', shopId: 'doctor-dosa', name: 'Onion Uttapam', price: 80, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80', isFeatured: false, isAvailable: true },

    // Millennials Cafe
    { id: 'mi030', shopId: 'millennials-cafe', name: 'Veg Sandwich', price: 80, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80', isFeatured: true, isAvailable: true },
    { id: 'mi031', shopId: 'millennials-cafe', name: 'Cheese Sandwich', price: 90, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi032', shopId: 'millennials-cafe', name: 'Pasta', price: 55, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi033', shopId: 'millennials-cafe', name: 'Pizza', price: 60, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi034', shopId: 'millennials-cafe', name: 'Cake Slice', price: 70, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi035', shopId: 'millennials-cafe', name: 'Garlic Bread', price: 70, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1573145959956-e9fae6b8bd4f?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi036', shopId: 'millennials-cafe', name: 'Paneer Tikka Pizza', price: 120, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi037', shopId: 'millennials-cafe', name: 'Cappuccino', price: 60, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi038', shopId: 'millennials-cafe', name: 'Hot Chocolate', price: 75, prepTime: 6, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&q=80', isFeatured: false, isAvailable: true },

    // Momo & Shakes Corner
    { id: 'mi040', shopId: 'momo-shakes-corner', name: 'Veg Momos', price: 40, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80', isFeatured: true, isAvailable: true },
    { id: 'mi041', shopId: 'momo-shakes-corner', name: 'Paneer Momos', price: 60, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi042', shopId: 'momo-shakes-corner', name: 'Chocolate Shake', price: 70, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi043', shopId: 'momo-shakes-corner', name: 'Maggi', price: 50, prepTime: 7, imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi044', shopId: 'momo-shakes-corner', name: 'French Fries', price: 70, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi045', shopId: 'momo-shakes-corner', name: 'Cheese Maggi', price: 65, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi046', shopId: 'momo-shakes-corner', name: 'Oreo Shake', price: 90, prepTime: 6, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi047', shopId: 'momo-shakes-corner', name: 'Paneer Kurkuri Momo', price: 85, prepTime: 12, imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi048', shopId: 'momo-shakes-corner', name: 'Mango Shake', price: 80, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80', isFeatured: false, isAvailable: true },

    // Shree Balaji Cafeteria
    { id: 'mi050', shopId: 'shree-balaji', name: 'Paneer Butter Masala & Naan Combo', price: 150, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80', isFeatured: true, isAvailable: true },
    { id: 'mi051', shopId: 'shree-balaji', name: 'Chole Bhature Platter', price: 90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', isFeatured: true, isAvailable: true },
    { id: 'mi052', shopId: 'shree-balaji', name: 'Delhi Samosa Chaat', price: 60, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi053', shopId: 'shree-balaji', name: 'Executive Veg Thali', price: 180, prepTime: 15, imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi054', shopId: 'shree-balaji', name: 'Punjabi Rajma Chawal', price: 80, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi055', shopId: 'shree-balaji', name: 'Sweet Kulhad Lassi', price: 50, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi056', shopId: 'shree-balaji', name: 'Gulab Jamun (2 Pcs)', price: 40, prepTime: 4, imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80', isFeatured: false, isAvailable: true },

    // The Kathi Roll Co.
    { id: 'mi060', shopId: 'kathi-roll-co', name: 'Double Paneer Tikka Roll', price: 90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', isFeatured: true, isAvailable: true },
    { id: 'mi061', shopId: 'kathi-roll-co', name: 'Spicy Soya Chaap Roll', price: 80, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', isFeatured: true, isAvailable: true },
    { id: 'mi062', shopId: 'kathi-roll-co', name: 'Masala Aloo Roll', price: 60, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi063', shopId: 'kathi-roll-co', name: 'Cheese Corn Wrap', price: 90, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi064', shopId: 'kathi-roll-co', name: 'Paneer Bhurji Roll', price: 100, prepTime: 10, imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi065', shopId: 'kathi-roll-co', name: 'Lemon Mint Cooler', price: 60, prepTime: 5, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&q=80', isFeatured: false, isAvailable: true },
    { id: 'mi066', shopId: 'kathi-roll-co', name: 'Spicy Peri Peri Fries', price: 80, prepTime: 8, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80', isFeatured: false, isAvailable: true }
  ];
  // Seed default customer users
  const bcrypt = require('bcryptjs');
  const adityaHash = bcrypt.hashSync('adi@123', 8);
  fallbackData.users = [
    {
      id: 'usr-aditya',
      name: 'Aditya Raj',
      email: 'aditya@quickbite.com',
      phone: '9876543210',
      password: adityaHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      collegeId: 'COL-2026-089',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-smriti',
      name: 'Smriti',
      email: 'smriti@quickbite.com',
      phone: '9876543211',
      password: bcrypt.hashSync('smriti123', 8),
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
      collegeId: 'COL-2026-001',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-muskan',
      name: 'muskan',
      email: 'muskan@quickbite.com',
      phone: '9876543212',
      password: bcrypt.hashSync('muskan123', 8),
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
      collegeId: 'COL-2026-002',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-aditi',
      name: 'aditi',
      email: 'aditi@quickbite.com',
      phone: '9876543213',
      password: bcrypt.hashSync('aditi123', 8),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      collegeId: 'COL-2026-003',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-divyesh',
      name: 'divyesh',
      email: 'divyesh@quickbite.com',
      phone: '9876543214',
      password: bcrypt.hashSync('divyesh123', 8),
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      collegeId: 'COL-2026-004',
      createdAt: new Date().toISOString()
    }
  ];

  fallbackData.addresses = [
    { id: 'addr-1', userId: 'usr-aditya', addressLine: 'Room 304, Hostel A, Campus North', isDefault: true },
    { id: 'addr-2', userId: 'usr-aditya', addressLine: 'Computer Lab 2, Library Block', isDefault: false },
    { id: 'addr-3', userId: 'usr-smriti', addressLine: 'Hostel B, Room 102, Campus East', isDefault: true },
    { id: 'addr-4', userId: 'usr-muskan', addressLine: 'Girls Hostel, Room 405, Campus West', isDefault: true },
    { id: 'addr-5', userId: 'usr-aditi', addressLine: 'Room 215, Hostel C, Campus South', isDefault: true },
    { id: 'addr-6', userId: 'usr-divyesh', addressLine: 'Girls Hostel, Room 112, Campus West', isDefault: true }
  ];

  const vendorsMock = [
    { id: 'vend-1', shopId: 'kitchen-kukkries', username: 'kukkries', pass: 'kukkries123' },
    { id: 'vend-2', shopId: 'kunj-burger-point', username: 'burgerpoint', pass: 'burger123' },
    { id: 'vend-3', shopId: 'doctor-dosa', username: 'doctordosa', pass: 'dosa123' },
    { id: 'vend-4', shopId: 'millennials-cafe', username: 'millennials', pass: 'cafe123' },
    { id: 'vend-5', shopId: 'momo-shakes-corner', username: 'momoshakes', pass: 'momo123' },
    { id: 'vend-6', shopId: 'shree-balaji', username: 'balaji', pass: 'balaji123' },
    { id: 'vend-7', shopId: 'kathi-roll-co', username: 'kathiroll', pass: 'kathi123' }
  ];

  fallbackData.vendors = vendorsMock.map(v => ({
    id: v.id,
    shopId: v.shopId,
    username: v.username,
    password: bcrypt.hashSync(v.pass, 8),
    createdAt: new Date().toISOString()
  }));

  fallbackData.orders = [
    {
      id: 'ord-a3f2',
      displayId: '#A3F2',
      shopId: 'kitchen-kukkries',
      userId: 'usr-aditya',
      itemName: 'Veg Momos',
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80',
      itemPrice: 40,
      qty: 1,
      items: [{ menuItemId: 'mi001', itemName: 'Veg Momos', itemPrice: 40, prepTime: 10, qty: 1 }],
      status: 'Preparing',
      ept: 10,
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60000).toISOString()
    },
    {
      id: 'ord-b7k1',
      displayId: '#B7K1',
      shopId: 'kitchen-kukkries',
      userId: 'usr-aditya',
      itemName: 'Veg Noodles',
      imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&q=80',
      itemPrice: 70,
      qty: 1,
      items: [{ menuItemId: 'mi005', itemName: 'Veg Noodles', itemPrice: 70, prepTime: 12, qty: 1 }],
      status: 'Preparing',
      ept: 12,
      createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60000).toISOString()
    },
    {
      id: 'ord-c9r4',
      displayId: '#C9R4',
      shopId: 'kitchen-kukkries',
      userId: 'usr-aditya',
      itemName: 'Paneer Momos',
      imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80',
      itemPrice: 50,
      qty: 1,
      items: [{ menuItemId: 'mi002', itemName: 'Paneer Momos', itemPrice: 50, prepTime: 12, qty: 1 }],
      status: 'Ready',
      ept: 0,
      createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60000).toISOString()
    }
  ];

  saveFallback();
}

function saveFallback() {
  try {
    fs.writeFileSync(fallbackPath, JSON.stringify(fallbackData, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save fallback JSON database:', e);
  }
}

// Initialize fallback mock data
initFallbackData();

const useSQLite = sqliteDb !== null;

// ─────────────────────────────────────────────────────────────
// CRUD IMPLEMENTATION
// ─────────────────────────────────────────────────────────────

// SHOPS
function getAllShops() {
  if (useSQLite) {
    const rows = sqliteDb.prepare('SELECT * FROM shops').all();
    return rows.map(r => ({
      ...r,
      tags: JSON.parse(r.tags),
      isOpen: r.isOpen === 1
    }));
  } else {
    return fallbackData.shops;
  }
}

function getShopById(id) {
  if (useSQLite) {
    const r = sqliteDb.prepare('SELECT * FROM shops WHERE id = ?').get(id);
    if (!r) return null;
    return {
      ...r,
      tags: JSON.parse(r.tags),
      isOpen: r.isOpen === 1
    };
  } else {
    return fallbackData.shops.find(s => s.id === id) || null;
  }
}

function updateShopDetails(id, data) {
  if (useSQLite) {
    const fields = [];
    const vals = [];
    if (data.name !== undefined) { fields.push('name = ?'); vals.push(data.name); }
    if (data.tags !== undefined) { fields.push('tags = ?'); vals.push(JSON.stringify(data.tags)); }
    if (data.cookCount !== undefined) { fields.push('cookCount = ?'); vals.push(parseInt(data.cookCount)); }
    if (data.imageUrl !== undefined) { fields.push('imageUrl = ?'); vals.push(data.imageUrl); }
    if (data.logoUrl !== undefined) { fields.push('logoUrl = ?'); vals.push(data.logoUrl); }
    if (data.bannerUrl !== undefined) { fields.push('bannerUrl = ?'); vals.push(data.bannerUrl); }
    if (data.description !== undefined) { fields.push('description = ?'); vals.push(data.description); }
    if (data.isOpen !== undefined) { fields.push('isOpen = ?'); vals.push(data.isOpen ? 1 : 0); }
    
    if (fields.length > 0) {
      vals.push(id);
      sqliteDb.prepare(`UPDATE shops SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    }
    return getShopById(id);
  } else {
    const idx = fallbackData.shops.findIndex(s => s.id === id);
    if (idx === -1) return null;
    fallbackData.shops[idx] = { ...fallbackData.shops[idx], ...data };
    saveFallback();
    return fallbackData.shops[idx];
  }
}

// MENU ITEMS
function getMenuByShopId(shopId) {
  if (useSQLite) {
    const rows = sqliteDb.prepare('SELECT * FROM menu_items WHERE shopId = ?').all(shopId);
    return rows.map(r => ({
      ...r,
      isFeatured: r.isFeatured === 1,
      isAvailable: r.isAvailable === 1
    }));
  } else {
    return fallbackData.menuItems.filter(m => m.shopId === shopId);
  }
}

function getMenuItemById(id) {
  if (useSQLite) {
    const r = sqliteDb.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    if (!r) return null;
    return {
      ...r,
      isFeatured: r.isFeatured === 1,
      isAvailable: r.isAvailable === 1
    };
  } else {
    return fallbackData.menuItems.find(m => m.id === id) || null;
  }
}

function addMenuItem(data) {
  const id = 'mi' + Date.now();
  const item = {
    id,
    shopId: data.shopId,
    name: data.name,
    price: parseFloat(data.price),
    prepTime: parseInt(data.prepTime),
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    isFeatured: data.isFeatured ? true : false,
    isAvailable: data.isAvailable !== undefined ? !!data.isAvailable : true
  };

  if (useSQLite) {
    sqliteDb.prepare(`
      INSERT INTO menu_items (id, shopId, name, price, prepTime, imageUrl, isFeatured, isAvailable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.shopId,
      item.name,
      item.price,
      item.prepTime,
      item.imageUrl,
      item.isFeatured ? 1 : 0,
      item.isAvailable ? 1 : 0
    );
  } else {
    fallbackData.menuItems.push(item);
    saveFallback();
  }
  return item;
}

function updateMenuItem(id, data) {
  if (useSQLite) {
    const fields = [];
    const vals = [];
    if (data.name !== undefined) { fields.push('name = ?'); vals.push(data.name); }
    if (data.price !== undefined) { fields.push('price = ?'); vals.push(parseFloat(data.price)); }
    if (data.prepTime !== undefined) { fields.push('prepTime = ?'); vals.push(parseInt(data.prepTime)); }
    if (data.imageUrl !== undefined) { fields.push('imageUrl = ?'); vals.push(data.imageUrl); }
    if (data.isFeatured !== undefined) { fields.push('isFeatured = ?'); vals.push(data.isFeatured ? 1 : 0); }
    if (data.isAvailable !== undefined) { fields.push('isAvailable = ?'); vals.push(data.isAvailable ? 1 : 0); }

    if (fields.length > 0) {
      vals.push(id);
      sqliteDb.prepare(`UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    }
    return getMenuItemById(id);
  } else {
    const idx = fallbackData.menuItems.findIndex(m => m.id === id);
    if (idx === -1) return null;
    fallbackData.menuItems[idx] = { ...fallbackData.menuItems[idx], ...data };
    saveFallback();
    return fallbackData.menuItems[idx];
  }
}

function deleteMenuItem(id) {
  if (useSQLite) {
    const result = sqliteDb.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
    return result.changes > 0;
  } else {
    const idx = fallbackData.menuItems.findIndex(m => m.id === id);
    if (idx === -1) return false;
    fallbackData.menuItems.splice(idx, 1);
    saveFallback();
    return true;
  }
}

// ORDERS
function getAllOrders() {
  if (useSQLite) {
    const rows = sqliteDb.prepare('SELECT * FROM orders').all();
    return rows.map(r => ({
      ...r,
      items: JSON.parse(r.itemsJson)
    }));
  } else {
    return fallbackData.orders;
  }
}

function getOrdersByShopId(shopId) {
  if (useSQLite) {
    const rows = sqliteDb.prepare('SELECT * FROM orders WHERE shopId = ?').all(shopId);
    return rows.map(r => ({
      ...r,
      items: JSON.parse(r.itemsJson)
    }));
  } else {
    return fallbackData.orders.filter(o => o.shopId === shopId);
  }
}

function getOrdersByUserId(userId) {
  if (useSQLite) {
    const rows = sqliteDb.prepare('SELECT * FROM orders WHERE userId = ?').all(userId);
    return rows.map(r => ({
      ...r,
      items: JSON.parse(r.itemsJson)
    }));
  } else {
    return fallbackData.orders.filter(o => o.userId === userId);
  }
}

function getOrderById(id) {
  if (useSQLite) {
    const r = sqliteDb.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!r) return null;
    return {
      ...r,
      items: JSON.parse(r.itemsJson)
    };
  } else {
    return fallbackData.orders.find(o => o.id === id) || null;
  }
}

function createOrder(data) {
  const shortId = '#' + Math.random().toString(36).substr(2, 4).toUpperCase();

  let normalizedItems = [];
  let primaryItemName = '';
  let primaryImageUrl = '';
  let totalPrice = 0;
  let totalQty = 0;

  if (Array.isArray(data.items) && data.items.length > 0) {
    data.items.forEach(entry => {
      const menuItem = getMenuItemById(entry.menuItemId);
      const source = menuItem || entry;
      const qty = entry.qty && entry.qty > 0 ? entry.qty : 1;
      const name = source.name || 'Item';
      const price = typeof source.price === 'number' ? source.price : parseFloat(source.price || 0);
      const prepTime = parseInt(source.prepTime || 0);
      const imageUrl = source.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80';

      if (!primaryItemName) {
        primaryItemName = name;
        primaryImageUrl = imageUrl;
      }
      normalizedItems.push({
        menuItemId: entry.menuItemId,
        itemName: name,
        itemPrice: price,
        prepTime: prepTime,
        qty,
      });
      totalPrice += price * qty;
      totalQty += qty;
    });
  } else if (data.menuItemId) {
    const item = getMenuItemById(data.menuItemId);
    if (!item) return null;
    const qty = data.qty || 1;
    primaryItemName = item.name;
    primaryImageUrl = item.imageUrl;
    normalizedItems.push({
      menuItemId: item.id,
      itemName: item.name,
      itemPrice: item.price,
      prepTime: item.prepTime,
      qty,
    });
    totalPrice = item.price * qty;
    totalQty = qty;
  } else {
    return null;
  }

  const displayName = normalizedItems.length > 1
    ? `${primaryItemName} + ${normalizedItems.length - 1} more`
    : primaryItemName;

  const order = {
    id: uuidv4(),
    displayId: shortId,
    shopId: data.shopId,
    userId: data.userId || null,
    menuItemId: normalizedItems[0].menuItemId,
    itemName: displayName,
    imageUrl: primaryImageUrl,
    itemPrice: totalPrice,
    qty: totalQty,
    items: normalizedItems,
    status: data.status || 'Pending',
    ept: data.ept || normalizedItems[0].prepTime,
    paymentMethod: data.paymentMethod || 'Cash On Pickup',
    paymentStatus: data.paymentStatus || 'Pending',
    transactionId: data.transactionId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (useSQLite) {
    sqliteDb.prepare(`
      INSERT INTO orders (id, displayId, shopId, userId, itemName, imageUrl, itemPrice, qty, itemsJson, status, ept, paymentMethod, paymentStatus, transactionId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order.id,
      order.displayId,
      order.shopId,
      order.userId,
      order.itemName,
      order.imageUrl,
      order.itemPrice,
      order.qty,
      JSON.stringify(order.items),
      order.status,
      order.ept,
      order.paymentMethod,
      order.paymentStatus,
      order.transactionId,
      order.createdAt,
      order.updatedAt
    );
  } else {
    fallbackData.orders.push(order);
    saveFallback();
  }
  return order;
}

function updateOrderStatus(id, newStatus) {
  const time = new Date().toISOString();
  if (useSQLite) {
    sqliteDb.prepare('UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?').run(newStatus, time, id);
    return getOrderById(id);
  } else {
    const order = fallbackData.orders.find(o => o.id === id);
    if (!order) return null;
    order.status = newStatus;
    order.updatedAt = time;
    saveFallback();
    return order;
  }
}

// OFFLINE LOADS
function getActiveOfflineLoads(shopId) {
  const now = Date.now();
  if (useSQLite) {
    const rows = sqliteDb.prepare(`
      SELECT * FROM offline_loads 
      WHERE shopId = ? AND datetime(expiresAt) > datetime('now')
    `).all(shopId);
    return rows;
  } else {
    return fallbackData.offlineLoads.filter(
      l => l.shopId === shopId && (now - new Date(l.createdAt).getTime()) < 3600000
    );
  }
}

function addOfflineLoad(data) {
  const load = {
    id: uuidv4(),
    shopId: data.shopId,
    minutes: parseInt(data.minutes),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  };

  if (useSQLite) {
    sqliteDb.prepare(`
      INSERT INTO offline_loads (id, shopId, minutes, createdAt, expiresAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(load.id, load.shopId, load.minutes, load.createdAt, load.expiresAt);
  } else {
    fallbackData.offlineLoads.push(load);
    saveFallback();
  }
  return load;
}

// USERS & AUTH
function createUser(name, email, phone, passwordHash, avatarUrl = null, collegeId = null) {
  const user = {
    id: 'usr-' + Date.now(),
    name,
    email,
    phone,
    password: passwordHash,
    avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
    collegeId,
    createdAt: new Date().toISOString()
  };

  if (useSQLite) {
    sqliteDb.prepare(`
      INSERT INTO users (id, name, email, phone, password, avatarUrl, collegeId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user.id, user.name, user.email, user.phone, user.password, user.avatarUrl, user.collegeId, user.createdAt);
  } else {
    fallbackData.users.push(user);
    saveFallback();
  }
  return user;
}

function getUserByEmail(email) {
  if (useSQLite) {
    return sqliteDb.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
  } else {
    return fallbackData.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
}

function getUserById(id) {
  if (useSQLite) {
    return sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
  } else {
    return fallbackData.users.find(u => u.id === id) || null;
  }
}

function updateUser(id, data) {
  if (useSQLite) {
    const fields = [];
    const vals = [];
    if (data.name !== undefined) { fields.push('name = ?'); vals.push(data.name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); vals.push(data.phone); }
    if (data.avatarUrl !== undefined) { fields.push('avatarUrl = ?'); vals.push(data.avatarUrl); }
    if (data.collegeId !== undefined) { fields.push('collegeId = ?'); vals.push(data.collegeId); }
    if (data.password !== undefined) { fields.push('password = ?'); vals.push(data.password); }

    if (fields.length > 0) {
      vals.push(id);
      sqliteDb.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    }
    return getUserById(id);
  } else {
    const idx = fallbackData.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    fallbackData.users[idx] = { ...fallbackData.users[idx], ...data };
    saveFallback();
    return fallbackData.users[idx];
  }
}

// VENDORS
function getVendorByUsername(username) {
  if (useSQLite) {
    return sqliteDb.prepare('SELECT * FROM vendors WHERE username = ?').get(username) || null;
  } else {
    return fallbackData.vendors.find(v => v.username.toLowerCase() === username.toLowerCase()) || null;
  }
}

function getVendorById(id) {
  if (useSQLite) {
    return sqliteDb.prepare('SELECT * FROM vendors WHERE id = ?').get(id) || null;
  } else {
    return fallbackData.vendors.find(v => v.id === id) || null;
  }
}

// ADDRESSES
function getAddressesByUserId(userId) {
  if (useSQLite) {
    return sqliteDb.prepare('SELECT * FROM addresses WHERE userId = ?').all(userId);
  } else {
    return fallbackData.addresses.filter(a => a.userId === userId);
  }
}

function addAddress(userId, addressLine) {
  const address = {
    id: 'addr-' + Date.now(),
    userId,
    addressLine,
    isDefault: getAddressesByUserId(userId).length === 0 ? 1 : 0
  };

  if (useSQLite) {
    sqliteDb.prepare(`
      INSERT INTO addresses (id, userId, addressLine, isDefault)
      VALUES (?, ?, ?, ?)
    `).run(address.id, address.userId, address.addressLine, address.isDefault);
  } else {
    fallbackData.addresses.push(address);
    saveFallback();
  }
  return address;
}

function deleteAddress(id, userId) {
  if (useSQLite) {
    const res = sqliteDb.prepare('DELETE FROM addresses WHERE id = ? AND userId = ?').run(id, userId);
    return res.changes > 0;
  } else {
    const idx = fallbackData.addresses.findIndex(a => a.id === id && a.userId === userId);
    if (idx === -1) return false;
    fallbackData.addresses.splice(idx, 1);
    saveFallback();
    return true;
  }
}

// FAVORITES
function getFavoritesByUserId(userId) {
  if (useSQLite) {
    const rows = sqliteDb.prepare('SELECT shopId FROM favorites WHERE userId = ?').all(userId);
    return rows.map(r => r.shopId);
  } else {
    return fallbackData.favorites.filter(f => f.userId === userId).map(f => f.shopId);
  }
}

function toggleFavorite(userId, shopId) {
  let isFav = false;
  if (useSQLite) {
    const check = sqliteDb.prepare('SELECT count(*) as count FROM favorites WHERE userId = ? AND shopId = ?').get(userId, shopId);
    if (check.count > 0) {
      sqliteDb.prepare('DELETE FROM favorites WHERE userId = ? AND shopId = ?').run(userId, shopId);
    } else {
      sqliteDb.prepare('INSERT INTO favorites (userId, shopId) VALUES (?, ?)').run(userId, shopId);
      isFav = true;
    }
  } else {
    const idx = fallbackData.favorites.findIndex(f => f.userId === userId && f.shopId === shopId);
    if (idx > -1) {
      fallbackData.favorites.splice(idx, 1);
    } else {
      fallbackData.favorites.push({ userId, shopId });
      isFav = true;
    }
    saveFallback();
  }
  return isFav;
}

// REVIEWS
function addReview(userId, shopId, menuItemId, ratingFood, ratingShop, reviewText) {
  const review = {
    id: 'rev-' + Date.now(),
    userId,
    shopId,
    menuItemId: menuItemId || null,
    ratingFood: ratingFood ? parseInt(ratingFood) : null,
    ratingShop: ratingShop ? parseInt(ratingShop) : null,
    reviewText,
    createdAt: new Date().toISOString()
  };

  if (useSQLite) {
    sqliteDb.prepare(`
      INSERT INTO reviews (id, userId, shopId, menuItemId, ratingFood, ratingShop, reviewText, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(review.id, review.userId, review.shopId, review.menuItemId, review.ratingFood, review.ratingShop, review.reviewText, review.createdAt);

    // Dynamic Shop rating recalculation
    if (ratingShop) {
      const avgRow = sqliteDb.prepare('SELECT avg(ratingShop) as avgRating FROM reviews WHERE shopId = ?').get(shopId);
      if (avgRow && avgRow.avgRating) {
        const roundedAvg = Math.round(avgRow.avgRating * 10) / 10;
        sqliteDb.prepare('UPDATE shops SET rating = ? WHERE id = ?').run(roundedAvg, shopId);
      }
    }
  } else {
    fallbackData.reviews.push(review);
    
    if (ratingShop) {
      const shopReviews = fallbackData.reviews.filter(r => r.shopId === shopId && r.ratingShop !== null);
      const avg = shopReviews.reduce((sum, r) => sum + r.ratingShop, 0) / shopReviews.length;
      const roundedAvg = Math.round(avg * 10) / 10;
      const sIdx = fallbackData.shops.findIndex(s => s.id === shopId);
      if (sIdx > -1) {
        fallbackData.shops[sIdx].rating = roundedAvg;
      }
    }
    saveFallback();
  }
  return review;
}

function getReviewsByShopId(shopId) {
  if (useSQLite) {
    const rows = sqliteDb.prepare(`
      SELECT reviews.*, users.name as userName, users.avatarUrl as userAvatar
      FROM reviews 
      JOIN users ON reviews.userId = users.id 
      WHERE reviews.shopId = ?
      ORDER BY datetime(reviews.createdAt) DESC
    `).all(shopId);
    return rows;
  } else {
    return fallbackData.reviews
      .filter(r => r.shopId === shopId)
      .map(r => {
        const user = fallbackData.users.find(u => u.id === r.userId) || { name: 'Anonymous', avatarUrl: '' };
        return {
          ...r,
          userName: user.name,
          userAvatar: user.avatarUrl
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// ANALYTICS (Daily, Weekly, Monthly metrics calculation)
function getAnalytics(shopId, period) {
  let dateFilter = '';
  const now = new Date();
  
  if (period === 'daily') {
    // Current day
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    dateFilter = startOfDay;
  } else if (period === 'weekly') {
    // Last 7 days
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60000).toISOString();
    dateFilter = startOfWeek;
  } else {
    // Monthly (last 30 days)
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60000).toISOString();
    dateFilter = startOfMonth;
  }

  let ordersList = [];
  if (useSQLite) {
    ordersList = sqliteDb.prepare(`
      SELECT * FROM orders 
      WHERE shopId = ? AND datetime(createdAt) >= datetime(?)
    `).all(shopId, dateFilter);
  } else {
    const filterTime = new Date(dateFilter).getTime();
    ordersList = fallbackData.orders.filter(
      o => o.shopId === shopId && new Date(o.createdAt).getTime() >= filterTime
    );
  }

  const completedOrders = ordersList.filter(o => o.status === 'Completed' || o.status === 'Ready');
  const totalOrders = ordersList.length;
  const revenue = ordersList.reduce((sum, o) => sum + o.itemPrice, 0);
  
  // Calculate average EPT
  const ordersWithEpt = ordersList.filter(o => o.ept > 0);
  const avgEpt = ordersWithEpt.length > 0
    ? Math.round(ordersWithEpt.reduce((sum, o) => sum + o.ept, 0) / ordersWithEpt.length)
    : 0;

  // Calculate Peak Hours
  const hourCounts = {};
  ordersList.forEach(o => {
    try {
      const date = new Date(o.createdAt);
      const hr = date.getHours();
      hourCounts[hr] = (hourCounts[hr] || 0) + 1;
    } catch {}
  });
  
  let peakHourStr = 'N/A';
  let maxCount = 0;
  Object.keys(hourCounts).forEach(hr => {
    if (hourCounts[hr] > maxCount) {
      maxCount = hourCounts[hr];
      const hNum = parseInt(hr);
      const ampm = hNum >= 12 ? 'PM' : 'AM';
      const dispHour = hNum % 12 === 0 ? 12 : hNum % 12;
      peakHourStr = `${dispHour}:00 ${ampm} - ${dispHour + 1}:00 ${ampm}`;
    }
  });

  // Calculate Popular Items
  const itemCounts = {};
  ordersList.forEach(o => {
    try {
      const items = useSQLite ? JSON.parse(o.itemsJson) : o.items;
      if (Array.isArray(items)) {
        items.forEach(it => {
          itemCounts[it.itemName] = (itemCounts[it.itemName] || 0) + (it.qty || 1);
        });
      }
    } catch {}
  });

  let popularItem = 'N/A';
  let maxItemCount = 0;
  Object.keys(itemCounts).forEach(name => {
    if (itemCounts[name] > maxItemCount) {
      maxItemCount = itemCounts[name];
      popularItem = name;
    }
  });

  return {
    totalOrders,
    revenue,
    peakHours: peakHourStr,
    popularItem,
    averageEpt: avgEpt || 10
  };
}

module.exports = {
  // Shops
  getAllShops,
  getShopById,
  updateShopDetails,
  // Menu
  getMenuByShopId,
  getMenuItemById,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  // Orders
  getAllOrders,
  getOrdersByShopId,
  getOrdersByUserId,
  getOrderById,
  createOrder,
  updateOrderStatus,
  // Offline Loads
  getActiveOfflineLoads,
  addOfflineLoad,
  // Users & Auth
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  // Vendors
  getVendorByUsername,
  getVendorById,
  // Addresses
  getAddressesByUserId,
  addAddress,
  deleteAddress,
  // Favorites
  getFavoritesByUserId,
  toggleFavorite,
  // Reviews
  addReview,
  getReviewsByShopId,
  // Analytics
  getAnalytics
};
