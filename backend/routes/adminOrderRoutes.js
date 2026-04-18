const express = require("express");
const Order = require("../models/Order");
const {
  deleteOrder,
  getLiveOrders,
  getPastOrders,
  updateOrderStatus,
} = require("../controller/adminOrderController");
const { protectAdmin } = require("../middleware/auth");
const { ensureRestaurantForUser } = require("../utils/restaurantScope");

const router = express.Router();

router.get("/live", protectAdmin, getLiveOrders);
router.put("/:id/status", protectAdmin, updateOrderStatus);
router.get("/history", protectAdmin, getPastOrders);
router.delete("/:id", protectAdmin, deleteOrder);

router.get("/:id", protectAdmin, async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (restaurantId && String(order.restaurantId) !== String(restaurantId)) {
      return res.status(403).json({ message: "Cannot access another restaurant's order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
