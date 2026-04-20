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
  getTableStatus,
  updateOrderStatus,
} = require("../controller/adminController");
const { getCurrentRestaurant, updateCurrentRestaurant } = require("../controller/restaurantController");
const { getAdminFeedback } = require("../controller/feedbackController");
const { getRecentPaymentLogs } = require("../controller/paymentController");

const router = express.Router();

router.get("/dashboard", protect, adminOnly, getDashboard);
router.get("/restaurant/me", protect, adminOnly, getCurrentRestaurant);
router.patch("/restaurant/me", protect, adminOnly, upload.single("logoFile"), updateCurrentRestaurant);
router.get("/feedback", protect, adminOnly, getAdminFeedback);
router.get("/payments/logs", protect, adminOnly, getRecentPaymentLogs);

router.get("/weekly-sales", protect, adminOnly, getWeeklySales);
router.get("/top-products", protect, adminOnly, getTopProducts);

router.get("/orders/active", protect, adminOnly, getActiveOrders);
router.get("/orders/table/:tableId", protect, adminOnly, getOrdersByTable);
router.get("/tables/status", protect, adminOnly, getTableStatus);
router.put("/orders/:id", protect, adminOnly, updateOrderStatus);

module.exports = router;
