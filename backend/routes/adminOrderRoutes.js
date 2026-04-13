import express from "express";
import {
  getLiveOrders,
  updateOrderStatus,
  getPastOrders,
} from "../controller/adminOrderController.js";

import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();


// 🔥 LIVE ORDERS (Queue + Filter + Sort)
router.get(
  "/live",
  verifyToken,
  isAdmin,
  getLiveOrders
);


// 🔄 UPDATE ORDER STATUS
router.put(
  "/:id/status",
  verifyToken,
  isAdmin,
  updateOrderStatus
);


// 📜 PAST ORDERS (with pagination)
router.get(
  "/history",
  verifyToken,
  isAdmin,
  getPastOrders
);


// 🔍 (Optional but VERY useful) GET SINGLE ORDER DETAILS
router.get(
  "/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const order = await (await import("../models/Order.js")).default.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;