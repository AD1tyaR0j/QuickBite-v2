// ── Food Image Map ─────────────────────────────────────────────
// Maps food item names (lowercase) to accurate Unsplash image URLs.
// Used only at render time to display relevant food photos.
// Does NOT modify any data fields.

const FOOD_IMAGE_MAP = {
  // Kitchen Kukkries
  'veg momos':          'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80',
  'paneer momos':       'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=300&q=80',
  'veg fried rice':     'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&q=80',
  'paneer fried rice':  'https://images.unsplash.com/photo-1645696301019-35adcc18fc0b?w=300&q=80',
  'veg noodles':        'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=300&q=80',
  'chilli paneer':      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80',

  // Kunj Burger Point
  'veg burger':         'https://images.unsplash.com/photo-1550317138-10000687a72b?w=300&q=80',
  'cheese burger':      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80',
  'paneer burger':      'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&q=80',
  'french fries':       'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80',
  'cold coffee':        'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&q=80',
  'chocolate shake':    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80',

  // Doctor Dosa
  'masala dosa':        '/images/masala_dosa.png',
  'butter dosa':        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&q=80',
  'plain dosa':         'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=300&q=80',
  'idli sambhar':       'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80',
  'vada sambhar':       'https://images.unsplash.com/photo-1540713434306-58505cf1b6fc?w=300&q=80',

  // Millennials Cafe
  'veg sandwich':       'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80',
  'cheese sandwich':    'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80',
  'pasta':              'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300&q=80',
  'pizza':              'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80',
  'cake slice':         'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80',

  // Momo & Shakes Corner
  'maggi':              'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80',
};

/**
 * Returns the best image URL for a food item by name.
 * Falls back to the item's original imageUrl if no match found.
 *
 * @param {string} name - The food item name (e.g. "Veg Momos")
 * @param {string} fallback - The original imageUrl from the data
 * @returns {string} - An accurate Unsplash image URL
 */
export function getFoodImage(name, fallback) {
  if (!name) return fallback;
  const key = name.toLowerCase().trim();
  return FOOD_IMAGE_MAP[key] || fallback;
}
