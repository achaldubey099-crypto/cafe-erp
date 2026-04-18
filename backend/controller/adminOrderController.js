const Order = require("../models/Order");
const { ensureRestaurantForUser } = require("../utils/restaurantScope");

const assertRestaurantOwnership = (order, restaurantId, action) => {
  if (restaurantId && String(order.restaurantId) !== String(restaurantId)) {
    return {
      message: `Cannot ${action} another restaurant's order`,
      status: 403,
    };
  }

  return null;
};

const getLiveOrders = async (req, res) => {
  try {
    const { status, sortBy } = req.query;
    const { restaurantId } = await ensureRestaurantForUser(req);

    const filter = {
      status: { $in: ["pending", "preparing", "ready"] },
    };

    if (restaurantId) {
      filter.restaurantId = restaurantId;
    }

    if (status) {
      filter.status = status;
    }

    const sort = sortBy === "newest" ? { createdAt: -1 } : { createdAt: 1 };
    const orders = await Order.find(filter).sort(sort);

    const formattedOrders = orders.map((order) => ({
      ...order._doc,
      waitTime: `${Math.floor((Date.now() - order.createdAt) / 60000)}m`,
    }));

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { restaurantId } = await ensureRestaurantForUser(req);

    const allowedStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const ownershipError = assertRestaurantOwnership(order, restaurantId, "update");
    if (ownershipError) {
      return res.status(ownershipError.status).json({ message: ownershipError.message });
    }

    if (["completed", "cancelled"].includes(order.status)) {
      return res.status(400).json({ message: "Order already finalized" });
    }

    const updatePayload = { status };

    if (status === "preparing" && !order.startedAt) {
      updatePayload.startedAt = new Date();
    }

    if (status === "completed") {
      updatePayload.completedAt = new Date();
    }

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

const getPastOrders = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const page = Number.parseInt(req.query.page, 10) || 1;
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

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    const { restaurantId } = await ensureRestaurantForUser(req);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const ownershipError = assertRestaurantOwnership(order, restaurantId, "delete");
    if (ownershipError) {
      return res.status(ownershipError.status).json({ message: ownershipError.message });
    }

    await order.deleteOne();

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLiveOrders,
  updateOrderStatus,
  getPastOrders,
  deleteOrder,
};
