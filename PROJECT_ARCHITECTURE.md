# QuickBite — Project Architecture & Codebase Overview

This document provides a comprehensive breakdown of the QuickBite project structure. It explains how the two separate parts (Frontend and Backend) communicate, what each file is responsible for, and how the entire system functions together to provide predictive ordering.

---

## 🏗️ High-Level Architecture
QuickBite operates as a **Monorepo** containing two distinct environments:
1. **Node.js/Express Backend (`/backend`)**: Serves as the central brain. It holds all the data in memory, handles API requests, and constantly calculates the dynamic Estimated Prep Time (EPT) based on kitchen load.
2. **React/Vite Frontend (`/frontend`)**: Handles the user interface. It strictly uses Tailwind CSS for styling and is divided into two major routing zones: the Customer Side (`/`) and the Vendor Side (`/vendor`).

Both applications run concurrently and communicate via REST API over `http://localhost:3001`.

---

## ⚙️ Backend Breakdown (`/backend`)

The backend is entirely localized in three main files to keep logic clean and heavily separated:

### `server.js` (The Router & API Layer)
* **What it does:** This is the entry point for the backend. It spins up an Express server on Port 3001.
* **Key Responsibilities:** It defines all the API endpoints the frontend utilizes:
  * `/api/shops`: To fetch vendor details.
  * `/api/orders`: Handles both fetching orders (for vendors) and creating new orders (from customers).
  * `/api/menu`: Manages the CRUD (Create, Read, Update, Delete) cycle for menu items.
  * `/api/offline-load`: Exposes endpoints for offline order management.

### `db.js` (The In-Memory Database)
* **What it does:** Since the app was built to be immediately runnable without needing a PostgreSQL/MongoDB setup, this file serves as the Single Source of Truth database.
* **Key Responsibilities:** 
  * Contains the mock variables simulating SQL tables: `shops`, `menuItems`, `orders`, and `offlineLoads`.
  * Exports isolated CRUD functions like `createOrder()`, `updateOrderStatus()`, and `getAllShops()`.
  * Includes the "seed data" representing pre-loaded restaurants like "Burger Barn" and "Spice Garden".

### `ept.js` (The Prediction Engine)
* **What it does:** The most complex piece of business logic in the app.
* **Key Responsibilities:** Calculates exactly how long an order might take based on the formula: 
  `((total prep time of all pending orders + manual offline load) / number of active cooks) + base prep time of the new item`.
* It calculates single-item EPTs and generates current crowd level indicators (Low, Moderate, High) for the customer's dashboard.

---

## 📱 Frontend Breakdown (`/frontend/src/`)

The React application uses Vite for fast hot-module reloading and Tailwind CSS for utility-first styling. The root folder restricts the layout to `max-w-md` constraints, creating a mobile app simulator on desktop screens.

### Core Entry Files
* `main.jsx`: Injects the React code into the HTML DOM.
* `App.jsx`: Sets up the global layout routing (React Router) separating the `/vendor` paths from the base `/` customer paths.

### State Management (`/store`)
* `AppContext.jsx`: A React Context Provider wrapping the entire app. 
  * **Role:** Manages the **Dark Mode** logic (`localStorage` persistence and flipping the `dark` class on the HTML tree) and potentially holds global states like selected shop metadata.

---

### 1. Customer Application (`/customer`)
These components manage the end-user flow from browsing food to tracking an active order.

* **`CustomerLayout.jsx`**: A wrapper component. It anchors the Bottom Navigation bar horizontally to the user's screen and handles route switching.
* **`Dashboard.jsx`**: The main Hub screen. It lists all cafeterias by fetching from `/api/shops` and dynamically displaying their live EPT and Crowd Levels to help users decide where to eat.
* **`Menu.jsx`**: Displays a selected shop's menu. Users click here to choose items and see individual prep times.
* **`OrderConfirmation.jsx`**: The checkout area. When an order is placed here, it executes a `POST` request to the backend `/api/orders`, locking in the estimated wait time.
* **`OrderTracking.jsx`**: A live radar dashboard showing exact countdown details. It periodically polls the backend (`GET /api/orders/:id`) to detect when the vendor shifts the status from "Pending" -> "Preparing" -> "Ready".
* **`CustomerProfile.jsx`**: Account settings, housing the interactive Dark Mode toggle switch that visually updates the system instantly.

---

### 2. Vendor Application (`/vendor`)
These components provide kitchen staff and cafeteria managers tools to control orders and configuration.

* **`VendorLayout.jsx`**: The vendor-specific routing wrapper, anchoring the orange-branded Vendor Bottom Navigation bar.
* **`LiveDashboard.jsx`**: The most critical screen for kitchens. 
  * Splits the view into a **"Preparing"** priority queue and a **"Ready to Collect"** list.
  * Allows vendors to press action buttons ("Start Prep", "Complete") which trigger backend PATCH requests.
  * **Add Offline Order Module**: Contains the custom dropdown we built where walk-in orders are routed into the digital queue seamlessly.
* **`MenuManagement.jsx`**: A dashboard to execute operations over the shop's menu. Vendors can edit prices, toggle item unavailability, or upload new options here.
* **`VendorOrders.jsx`**: Insights and History. Tracks metrics like total daily revenue, average wait times, and a ledger of completed orders.
* **`VendorProfile.jsx`**: Contains vendor-side app configurations, primarily the Dark Mode controller and shop opening/closing hours settings.
