const express = require("express");
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const upload = require("../middleware/upload");

const {
  getDashboard,
  getWeeklySales,
  getTopProducts,
  getActiveOrders,
  getOrdersByTable,
  getTableStatus, // ⭐ ADD THIS
  updateOrderStatus
} = require("../controller/adminController");
const { getCurrentRestaurant, updateCurrentRestaurant } = require("../controller/restaurantController");

const router = express.Router();

// ================= DASHBOARD =================
router.get("/dashboard", protect, adminOnly, getDashboard);
router.get("/restaurant/me", protect, adminOnly, getCurrentRestaurant);
router.patch("/restaurant/me", protect, adminOnly, upload.single("logoFile"), updateCurrentRestaurant);

// ================= ANALYTICS =================
router.get("/weekly-sales", protect, adminOnly, getWeeklySales);
router.get("/top-products", protect, adminOnly, getTopProducts);

// ================= POS / ORDER VIEW =================

// Get all active orders (for POS table view)
router.get("/orders/active", protect, adminOnly, getActiveOrders);

// Get orders for a specific table
router.get("/orders/table/:tableId", protect, adminOnly, getOrdersByTable);

// ================= TABLE STATUS =================

// Get table status (Empty / Preparing / Ready)
router.get("/tables/status", protect, adminOnly, getTableStatus);

// ================= ORDER CONTROL =================

// Update order status (pending → preparing → ready)
router.put("/orders/:id", protect, adminOnly, updateOrderStatus);

module.exports = router;
