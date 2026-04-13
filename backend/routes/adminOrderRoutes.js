const express = require("express");
const {
  getLiveOrders,
  updateOrderStatus,
  getPastOrders,
} = require("../controller/adminOrderController");
const { protectAdmin } = require("../middleware/auth");
const Order = require("../models/Order");

const router = express.Router();

// 🔥 LIVE ORDERS (Queue + Filter + Sort)
router.get("/live", protectAdmin, getLiveOrders);

// 🔄 UPDATE ORDER STATUS
router.put("/:id/status", protectAdmin, updateOrderStatus);

// 📜 PAST ORDERS (with pagination)
router.get("/history", protectAdmin, getPastOrders);

// 🔍 GET SINGLE ORDER DETAILS
router.get("/:id", protectAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;