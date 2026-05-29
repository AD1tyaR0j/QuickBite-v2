# 🍔 QuickBite — Setup & Run Guide

Welcome to the QuickBite predictive ordering application! This guide explains exactly how to start the project and where to navigate to test both the customer and vendor sides.

---

## 🚀 1. How to Run the Application

The project is split into two parts: the Node.js backend (`backend/`) and the React/Vite frontend (`frontend/`). You need to run **both** simultaneously in two separate terminal windows.

### Terminal 1 — Start the Backend (API Server)

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies (first time only):
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
   ✅ Backend runs on **`http://localhost:3001`**

### Terminal 2 — Start the Frontend (User Interface)

1. Open a **new** terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies (first time only):
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   ✅ Frontend runs on **`http://localhost:5173`**

> **PowerShell users:** If `npm` is blocked by execution policy, use `node` directly:
> ```bash
> # Backend
> node server.js
> # Frontend
> node node_modules/vite/bin/vite.js
> ```

---

## 📱 2. Where to Go (URLs)

Once both servers are running, open your browser.

### 🙍‍♂️ Customer Side
**URL:** [http://localhost:5173/](http://localhost:5173/)

What you can do:
- Browse all 5 cafeterias with live crowd ratings and EPT wait times.
- Add items to your cart from any shop's menu.
- Place an order — the system calculates a realistic prep time using the Smart EPT engine.
- Track your live order on the countdown radar screen.

---

### 👨‍🍳 Vendor Side (Live Dashboards)

Each cafeteria has its own vendor dashboard. Navigate to the shop you want to manage:

| Shop | Vendor Dashboard URL |
| :--- | :--- |
| 🥟 Kitchen Kukkries | [http://localhost:5173/vendor/kitchen-kukkries/live](http://localhost:5173/vendor/kitchen-kukkries/live) |
| 🍔 Kunj Burger Point | [http://localhost:5173/vendor/kunj-burger-point/live](http://localhost:5173/vendor/kunj-burger-point/live) |
| 🫓 Doctor Dosa | [http://localhost:5173/vendor/doctor-dosa/live](http://localhost:5173/vendor/doctor-dosa/live) |
| ☕ Millennials Cafe | [http://localhost:5173/vendor/millennials-cafe/live](http://localhost:5173/vendor/millennials-cafe/live) |
| 🧋 Momo & Shakes Corner | [http://localhost:5173/vendor/momo-shakes-corner/live](http://localhost:5173/vendor/momo-shakes-corner/live) |

What you can do:
1. **Watch live orders** land in your **"Preparing"** queue when a customer places an order.
2. **Advance order status:** `Preparing → Almost Ready → Ready → Completed`
3. **Add Offline Orders:** Log physical walk-in orders to organically bump up EPT for incoming online users.
4. **Manage menu items** — add, edit, or remove items from the Menu tab.
5. **Toggle Dark Mode** from the Profile screen.

---

## 🧠 3. How the EPT Algorithm Works

The Smart EPT (Estimated Prep Time) uses a **batching + capacity-aware parallel** model:

### Step 1 — Batching (same item, multiple qty)
```
effective_parallel = min(quantity, cooks)
item_time = (quantity / effective_parallel) × prep_time × 1.1
```

### Step 2 — Combine all items (SUM / cooks)
```
optimized_prep_time = SUM(all item_times) / cooks
```
This reflects how a kitchen shares cook capacity across multiple different dishes.

### Step 3 — Final EPT
```
EPT = ((pending queue time + offline load) / cooks) + optimized_prep_time
```

### Edge Case — Empty Queue
If no orders are pending, EPT defaults to the **minimum prep time from the shop's menu** (never shows 0 mins).

---

## 💡 4. Pro Testing Tip

For the best experience, open **two side-by-side browser windows**:
- **Left:** [http://localhost:5173/](http://localhost:5173/) ← Customer view
- **Right:** [http://localhost:5173/vendor/kitchen-kukkries/live](http://localhost:5173/vendor/kitchen-kukkries/live) ← Vendor view for Kitchen Kukkries

Place an order as a customer and watch it instantly appear on the vendor dashboard. Advance its status to **"Ready"** and see the customer tracker update in real time!

---

## 🔌 5. API Endpoints (Backend Reference)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/health` | Health check |
| GET | `/api/shops` | All shops with live EPT |
| GET | `/api/shops/:id` | Single shop details |
| GET | `/api/shops/:id/menu` | Menu items for a shop |
| POST | `/api/orders` | Place a new order |
| GET | `/api/orders/:id` | Get order by ID |
| PATCH | `/api/orders/:id/status` | Update order status |
| GET | `/api/orders?shopId=X` | All orders for a vendor |
| POST | `/api/menu` | Add menu item |
| PUT | `/api/menu/:id` | Update menu item |
| DELETE | `/api/menu/:id` | Delete menu item |
| POST | `/api/offline-load` | Log offline/walk-in orders |
| GET | `/api/offline-load/:shopId` | Active offline loads |
| GET | `/api/ept` | Compute EPT for a single item |
| POST | `/api/ept-cart` | Compute EPT for a full cart |
