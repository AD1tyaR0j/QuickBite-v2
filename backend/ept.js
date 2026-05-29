const db = require('./db');

// ─────────────────────────────────────────────────────────────
// HELPER: Batching + Parallel cooking for a list of cart items
//
// Rules:
//  1. SAME ITEM MULTIPLE QTY (Batching):
//     effective_parallel = min(qty, cooks)
//     item_time = (qty / effective_parallel) * prepTime * 1.1  (10% overhead)
//
//  2. MULTIPLE DIFFERENT ITEMS (Parallel):
//     Items cook simultaneously → take MAX of all item_times
// ─────────────────────────────────────────────────────────────
function calcOptimizedPrepTime(cartItems, cookCount) {
  if (!cartItems || cartItems.length === 0) return 0;

  const itemTimes = cartItems.map(({ prepTime, qty = 1 }) => {
    const effectiveParallel = Math.min(qty, cookCount);
    const rawTime = (qty / effectiveParallel) * prepTime;
    return rawTime * 1.1; // 10% overhead for realism
  });

  // Sum all item times, then divide by cooks to reflect kitchen capacity
  const totalItemTime = itemTimes.reduce((sum, t) => sum + t, 0);
  return totalItemTime / cookCount;
}

// ─────────────────────────────────────────────────────────────
// Also apply batching logic to pending queue orders
// (replaces linear pendingPrepTime / cookCount)
// ─────────────────────────────────────────────────────────────
function calcPendingQueueTime(preparingOrders, cookCount) {
  // Group by menuItemId to merge same-item orders
  const grouped = {};
  preparingOrders.forEach(order => {
    const item = db.getMenuItemById(order.menuItemId);
    if (!item) return;
    if (!grouped[item.id]) {
      grouped[item.id] = { prepTime: item.prepTime, qty: 0 };
    }
    grouped[item.id].qty += order.qty || 1;
  });

  const groups = Object.values(grouped);
  if (groups.length === 0) return 0;

  // Each group is also batch-cooked in parallel with others
  const groupTimes = groups.map(({ prepTime, qty }) => {
    const effectiveParallel = Math.min(qty, cookCount);
    return (qty / effectiveParallel) * prepTime * 1.1;
  });

  // Sum all group times and divide by cooks to reflect kitchen capacity
  const totalTime = groupTimes.reduce((sum, t) => sum + t, 0);
  return totalTime / cookCount;
}

/**
 * Calculate EPT for a given shop + menu item (single item order).
 *
 * @param {string} shopId
 * @param {string} menuItemId
 * @returns {{ ept: number, eptDisplay: number|string, crowdLevel: 'Low'|'Medium'|'High' }}
 */
function calculateEPT(shopId, menuItemId) {
  const shop = db.getShopById(shopId);
  if (!shop) return { ept: 0, crowdLevel: 'Low' };

  const menuItem = db.getMenuItemById(menuItemId);
  if (!menuItem) return { ept: 0, crowdLevel: 'Low' };

  const allShopOrders = db.getOrdersByShopId(shopId);
  const cookCount = Math.max(shop.cookCount, 1);

  // ── 1. Pending queue time (batching + parallel) ───────────
  const preparingOrders = allShopOrders.filter(o => o.status === 'Preparing');
  const pendingQueueTime = calcPendingQueueTime(preparingOrders, cookCount);

  // ── 2. Offline load minutes ───────────────────────────────
  const activeLoads = db.getActiveOfflineLoads(shopId);
  const offlineLoadMinutes = activeLoads.reduce((sum, load) => sum + load.minutes, 0);

  // ── 3. New item prep time (single item, qty=1) ────────────
  const newOrderPrepTime = calcOptimizedPrepTime(
    [{ prepTime: menuItem.prepTime, qty: 1 }],
    cookCount
  );

  // ── 4. Calculate EPT ──────────────────────────────────────
  let rawEpt;

  if (preparingOrders.length === 0 && offlineLoadMinutes === 0) {
    // EDGE CASE: Empty queue → show min prep time from menu (never 0)
    const shopMenu = db.getMenuByShopId(shopId);
    const minPrepTime = shopMenu.reduce(
      (min, item) => Math.min(min, item.prepTime),
      Infinity
    );
    rawEpt = minPrepTime === Infinity ? menuItem.prepTime : minPrepTime;
  } else {
    // EPT = (queue occupancy + offline load) / cooks  +  new item optimized time
    rawEpt = ((pendingQueueTime + offlineLoadMinutes) / cookCount) + newOrderPrepTime;
  }

  // ── 5. Round and enforce minimum ─────────────────────────
  let ept = Math.round(rawEpt);
  ept = Math.max(ept, menuItem.prepTime);

  // ── 6. Cap at 90 minutes ─────────────────────────────────
  const eptDisplay = ept > 90 ? '90+' : ept;

  // ── 7. Crowd level ────────────────────────────────────────
  const queueDepth = allShopOrders.filter(
    o => o.status === 'Pending' || o.status === 'Preparing'
  ).length;

  let crowdLevel;
  if (queueDepth < 5) crowdLevel = 'Low';
  else if (queueDepth <= 15) crowdLevel = 'Medium';
  else crowdLevel = 'High';

  return { ept, eptDisplay, crowdLevel };
}

/**
 * Calculate shop-level EPT for dashboard card (uses fastest item).
 *
 * @param {string} shopId
 * @returns {{ ept: number, crowdLevel: string }}
 */
function calculateShopEPT(shopId) {
  const shop = db.getShopById(shopId);
  if (!shop) return { ept: 0, crowdLevel: 'Low' };

  const shopMenu = db.getMenuByShopId(shopId);
  if (!shopMenu.length) return { ept: 0, crowdLevel: 'Low' };

  const cookCount = Math.max(shop.cookCount, 1);

  // Use fastest item for shop-level display
  const fastestItem = shopMenu.reduce((fastest, item) =>
    item.prepTime < fastest.prepTime ? item : fastest
  );

  const allShopOrders = db.getOrdersByShopId(shopId);

  // ── Pending queue (batching + parallel) ──────────────────
  const preparingOrders = allShopOrders.filter(o => o.status === 'Preparing');
  const pendingQueueTime = calcPendingQueueTime(preparingOrders, cookCount);

  // ── Offline load ──────────────────────────────────────────
  const activeLoads = db.getActiveOfflineLoads(shopId);
  const offlineLoadMinutes = activeLoads.reduce((sum, load) => sum + load.minutes, 0);

  // ── Fastest item optimized prep time ─────────────────────
  const fastestOptimized = calcOptimizedPrepTime(
    [{ prepTime: fastestItem.prepTime, qty: 1 }],
    cookCount
  );

  let rawEpt;
  if (preparingOrders.length === 0 && offlineLoadMinutes === 0) {
    // Empty queue → min prep time from menu
    const minPrepTime = shopMenu.reduce(
      (min, item) => Math.min(min, item.prepTime),
      Infinity
    );
    rawEpt = minPrepTime === Infinity ? fastestItem.prepTime : minPrepTime;
  } else {
    rawEpt = ((pendingQueueTime + offlineLoadMinutes) / cookCount) + fastestOptimized;
  }

  let ept = Math.round(rawEpt);
  ept = Math.max(ept, fastestItem.prepTime);
  if (ept > 90) ept = 90;

  const queueDepth = allShopOrders.filter(
    o => o.status === 'Pending' || o.status === 'Preparing'
  ).length;

  let crowdLevel;
  if (queueDepth < 5) crowdLevel = 'Low';
  else if (queueDepth <= 15) crowdLevel = 'Medium';
  else crowdLevel = 'High';

  return { ept, crowdLevel };
}

/**
 * Calculate EPT for a full cart (multiple items, multiple quantities).
 *
 * Batching + Parallel logic applied:
 *  - Each cart item is batch-cooked (qty / min(qty, cooks))
 *  - All items cook simultaneously → MAX of item times
 *
 * @param {string} shopId
 * @param {Array<{ menuItemId: string, qty: number }>} cartItems
 * @returns {{ ept: number, eptDisplay: number|string, crowdLevel: string, totalPrepTime: number }}
 */
function calculateCartEPT(shopId, cartItems) {
  const shop = db.getShopById(shopId);
  if (!shop || !Array.isArray(cartItems) || cartItems.length === 0) {
    return { ept: 0, eptDisplay: 0, crowdLevel: 'Low', totalPrepTime: 0 };
  }

  const cookCount = Math.max(shop.cookCount, 1);
  const allShopOrders = db.getOrdersByShopId(shopId);

  // ── Pending queue (batching + parallel) ──────────────────
  const preparingOrders = allShopOrders.filter(o => o.status === 'Preparing');
  const pendingQueueTime = calcPendingQueueTime(preparingOrders, cookCount);

  // ── Offline load ──────────────────────────────────────────
  const activeLoads = db.getActiveOfflineLoads(shopId);
  const offlineLoadMinutes = activeLoads.reduce((sum, load) => sum + load.minutes, 0);

  // ── Build cart item list with prepTime for each entry ────
  const resolvedItems = cartItems
    .map(entry => {
      const item = db.getMenuItemById(entry.menuItemId);
      if (!item) return null;
      const qty = entry.qty && entry.qty > 0 ? entry.qty : 1;
      return { prepTime: item.prepTime, qty };
    })
    .filter(Boolean);

  if (resolvedItems.length === 0) {
    return { ept: 0, eptDisplay: 0, crowdLevel: 'Low', totalPrepTime: 0 };
  }

  // ── Optimized prep time for this cart (batching + parallel) ──
  const optimizedPrepTime = calcOptimizedPrepTime(resolvedItems, cookCount);

  // ── Legacy totalPrepTime for reference (kept for API compatibility) ──
  const totalPrepTime = resolvedItems.reduce(
    (sum, { prepTime, qty }) => sum + prepTime * qty,
    0
  );

  // ── Final EPT ─────────────────────────────────────────────
  let rawEpt;
  if (preparingOrders.length === 0 && offlineLoadMinutes === 0) {
    // Empty queue → optimized prep time for this cart only
    rawEpt = optimizedPrepTime;
  } else {
    rawEpt = ((pendingQueueTime + offlineLoadMinutes) / cookCount) + optimizedPrepTime;
  }

  let ept = Math.round(rawEpt);
  // Minimum is the optimized prep time (never show less than what the kitchen needs)
  if (ept < Math.round(optimizedPrepTime)) ept = Math.round(optimizedPrepTime);
  if (ept > 90) ept = 90;

  const queueDepth = allShopOrders.filter(
    o => o.status === 'Pending' || o.status === 'Preparing'
  ).length;

  let crowdLevel;
  if (queueDepth < 5) crowdLevel = 'Low';
  else if (queueDepth <= 15) crowdLevel = 'Medium';
  else crowdLevel = 'High';

  return { ept, eptDisplay: ept, crowdLevel, totalPrepTime };
}

module.exports = { calculateEPT, calculateShopEPT, calculateCartEPT };
