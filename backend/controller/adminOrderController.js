const Order = require("../models/Order");
const { ensureRestaurantForUser } = require("../utils/restaurantScope");


// ✅ 1. LIVE ORDERS (Queue Management + Filter + Sort)
const getLiveOrders = async (req, res) => {
  try {
    const { status, sortBy } = req.query;
    const { restaurantId } = await ensureRestaurantForUser(req);

    let filter = {
      status: { $in: ["pending", "preparing", "ready"] },
    };

    if (restaurantId) {
      filter.restaurantId = restaurantId;
    }

    // 🔍 Optional filter
    if (status) {
      filter.status = status;
    }

    // 🔽 Sorting logic
    let sort = { createdAt: 1 }; // oldest first (queue)

    if (sortBy === "newest") {
      sort = { createdAt: -1 };
    }

    const orders = await Order.find(filter).sort(sort);

    const formattedOrders = orders.map((order) => {
      const waitTime = Math.floor(
        (Date.now() - order.createdAt) / 60000
      );

      return {
        ...order._doc,
        waitTime: `${waitTime}m`,
      };
    });

    res.json({
      total: formattedOrders.length,
      orders: formattedOrders,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ 2. UPDATE ORDER STATUS (Improved + Safe)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ];

    // 🚨 Validate status
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // ⛔ Prevent updating completed/cancelled orders
    if (["completed", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        message: "Order already finalized",
      });
    }

    // Build update payload and avoid document save() so old orders without
    // orderNumber don't fail full-schema validation during status updates.
    const updatePayload = {
      status,
    };

    if (status === "preparing" && !order.startedAt) {
      updatePayload.startedAt = new Date();
    }

    if (status === "completed") {
      updatePayload.completedAt = new Date();
    }

    // Backfill missing orderNumber for legacy documents.
    if (!order.orderNumber) {
      updatePayload.orderNumber = await Order.getNextOrderNumber();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updatePayload },
      { new: true }
    );

    res.json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ 3. PAST ORDERS (with pagination support)
const getPastOrders = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const historyFilter = {
      status: { $in: ["completed", "cancelled"] },
    };
    if (restaurantId) {
      historyFilter.restaurantId = restaurantId;
    }

    const orders = await Order.find(historyFilter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments(historyFilter);

    res.json({
      page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      orders,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  getLiveOrders,
  updateOrderStatus,
  getPastOrders,
  // delete an order (admin)
  deleteOrder: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      const { restaurantId } = await ensureRestaurantForUser(req);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (restaurantId && String(order.restaurantId) !== String(restaurantId)) {
        return res.status(403).json({ message: "Cannot delete orders from another restaurant" });
      }

      await order.deleteOne();

      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};
