<div align="center">
  <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&q=80" alt="QuickBite Logo" style="border-radius: 50%; border: 4px solid #ff785a;" width="120"/>
  <h1>QuickBite: Predictive Ordering System</h1>
  <p><strong>A dual-sided cafeteria ordering platform with a predictive dynamic queue algorithm.</strong></p>
</div>

---

## 🚀 Overview

QuickBite is an end-to-end full-stack application engineered to solve long queue times in cafeterias and food courts. By utilizing a **Smart EPT** (Estimated Prep Time) engine, QuickBite calculates wait times dynamically based on active kitchen load, staff headcount, and item-specific prep times.

It provides an unparalleled, mobile-first **Customer Application** for students/staff, and a high-speed, live **Vendor Dashboard** for kitchen staff.

---

## ✨ Key Features

- **Predictive EPT Engine:** Real-time formula with batching + parallel cooking logic:
  ```
  EPT = ((pending prep time + offline load) / cooks) + optimized_prep_time
  ```
  where `optimized_prep_time = SUM(batched item times) / cooks`
- **Smart Batching:** Multiple quantities of the same item are batch-cooked using `effective_parallel = min(qty, cooks)`, with a 10% overhead factor for realism.
- **Capacity-Aware Parallel Cooking:** Multiple different items are summed and divided by cook count — reflecting how a real kitchen shares capacity across dishes.
- **Dual-Sided Architecture:** A single frontend React application logically partitioned for Customers (`/customer/*`) and Vendors (`/vendor/*`).
- **Offline Sync:** Vendors can inject physical walk-in orders to organically scale up the digital EPT for incoming online customers.
- **Mobile-App Native Design:** Developed with strict max-width formatting so it presents exactly like a downloaded mobile-app natively on desktop web browsers.
- **Dynamic Theming:** Instant, fully-integrated Dark and Light mode.

---

## 🛠️ Technology Stack

| Domain | Tech |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend API** | Node.js, Express.js |
| **Data Layer** | Centralized in-memory node datastore (portable to SQL/NoSQL) |
| **Navigation** | React Router DOM |

---

## 🏪 Available Shops

| Shop ID | Name | Cuisine |
| :--- | :--- | :--- |
| `kitchen-kukkries` | Kitchen Kukkries | Momos, Chinese |
| `kunj-burger-point` | Kunj Burger Point | Burgers, Fast Food, Shakes |
| `doctor-dosa` | Doctor Dosa | South Indian, Dosa |
| `millennials-cafe` | Millennials Cafe | Cafe, Sandwiches, Pizza |
| `momo-shakes-corner` | Momo & Shakes Corner | Momos, Shakes |

---

## 🏁 Setup & Install Guide

The app must be spun up as two separate server instances. Follow these steps:

### 1. Fire up the Backend
```bash
cd backend
npm install
node server.js
```
*(Listening on `http://localhost:3001`)*

### 2. Fire up the Frontend UI
```bash
cd frontend
npm install
npm run dev
```
*(Listening on `http://localhost:5173`)*

---

## 🖥️ Live Dashboard Navigation

Open two parallel web browser windows to witness the live system in action!

### The Customer Interface
Navigate to **`http://localhost:5173/`**
- Browse active shops with live crowd ratings and EPT.
- Add items to cart and place an order.
- Track your live order countdown on the radar screen.

### The Vendor Interface
Navigate to any shop's dashboard, e.g.:
**`http://localhost:5173/vendor/kitchen-kukkries/live`**

Full list of vendor dashboard URLs:
- 🥟 Kitchen Kukkries — `/vendor/kitchen-kukkries/live`
- 🍔 Kunj Burger Point — `/vendor/kunj-burger-point/live`
- 🫓 Doctor Dosa — `/vendor/doctor-dosa/live`
- ☕ Millennials Cafe — `/vendor/millennials-cafe/live`
- 🧋 Momo & Shakes Corner — `/vendor/momo-shakes-corner/live`

**What you can do:**
- Watch live customer orders drop into your **"Preparing"** list.
- Advance orders through statuses: `Preparing → Almost Ready → Ready → Completed`.
- Add offline/walk-in orders to bump up EPT for incoming online customers.
- Manage menu items and toggle Dark Mode from the bottom nav.
