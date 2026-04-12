const Order = require("../models/Order");


// ✅ 1. LIVE ORDERS (Queue Management + Filter + Sort)
const getLiveOrders = async (req, res) => {
  try {
    const { status, sortBy } = req.query;

    let filter = {
      status: { $in: ["pending", "preparing", "ready"] },
    };

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

    // ⏱️ Smart timestamps
    if (status === "preparing" && !order.startedAt) {
      order.startedAt = new Date();
    }

    if (status === "completed") {
      order.completedAt = new Date();
    }

    order.status = status;

    await order.save();

    res.json({
      message: "Order status updated successfully",
      order,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ 3. PAST ORDERS (with pagination support)
const getPastOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const orders = await Order.find({
      status: { $in: ["completed", "cancelled"] },
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments({
      status: { $in: ["completed", "cancelled"] },
    });

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
};