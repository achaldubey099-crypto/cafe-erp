const Order = require("../models/Order");
const { ensureRestaurantForUser } = require("../utils/restaurantScope");

// ================= DASHBOARD =================
const getDashboard = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const orderFilter = restaurantId ? { restaurantId } : {};
    const totalOrders = await Order.countDocuments(orderFilter);

    const totalSalesResult = await Order.aggregate([
      ...(restaurantId ? [{ $match: { restaurantId } }] : []),
      {
        $group: {
          _id: null,
          total: { $sum: "$grandTotal" }
        }
      }
    ]);

    const totalSales = totalSalesResult[0]?.total || 0;

    const recentOrders = await Order.find(orderFilter)
      .sort({ createdAt: -1 })
      .limit(5);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.countDocuments({
      ...orderFilter,
      createdAt: { $gte: today }
    });

    const todaySalesResult = await Order.aggregate([
      {
        $match: {
          ...(restaurantId ? { restaurantId } : {}),
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$grandTotal" }
        }
      }
    ]);

    const todaySales = todaySalesResult[0]?.total || 0;

    res.json({
      totalOrders,
      totalSales,
      todayOrders,
      todaySales,
      recentOrders
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= WEEKLY SALES =================
const getWeeklySales = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const sales = await Order.aggregate([
      {
        $match: {
          ...(restaurantId ? { restaurantId } : {}),
          createdAt: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          total: { $sum: "$grandTotal" }
        }
      }
    ]);

    const daysMap = {
      1: "Sun", 2: "Mon", 3: "Tue",
      4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat"
    };

    const formatted = sales.map(item => ({
      day: daysMap[item._id],
      total: item.total
    }));

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= TOP PRODUCTS =================
const getTopProducts = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const topProducts = await Order.aggregate([
      ...(restaurantId ? [{ $match: { restaurantId } }] : []),
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalSold: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.json(topProducts);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET ACTIVE ORDERS =================
const getActiveOrders = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const orders = await Order.find({
      ...(restaurantId ? { restaurantId } : {}),
      status: { $in: ["pending", "preparing", "ready"] }
    }).sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET ORDERS BY TABLE =================
const getOrdersByTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { restaurantId } = await ensureRestaurantForUser(req);

    const orders = await Order.find({
      ...(restaurantId ? { restaurantId } : {}),
      tableId,
      status: { $in: ["pending", "preparing", "ready"] }
    }).sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= TABLE STATUS =================
const getTableStatus = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const orders = await Order.find({
      ...(restaurantId ? { restaurantId } : {}),
      status: { $in: ["pending", "preparing", "ready"] }
    });

    const tableMap = {};

    orders.forEach(order => {
      const tableId = order.tableId;

      if (!tableMap[tableId]) {
        tableMap[tableId] = "empty";
      }

      if (order.status === "pending" || order.status === "preparing") {
        tableMap[tableId] = "preparing";
      } else if (
        order.status === "ready" &&
        tableMap[tableId] !== "preparing"
      ) {
        tableMap[tableId] = "ready";
      }
    });

    const result = Object.keys(tableMap).map(tableId => ({
      tableId: Number(tableId),
      status: tableMap[tableId]
    }));

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE ORDER STATUS =================
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { restaurantId } = await ensureRestaurantForUser(req);

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (restaurantId && String(order.restaurantId) !== String(restaurantId)) {
      return res.status(403).json({ message: "Cannot update another restaurant's order" });
    }

    order.status = status;
    if (status === "completed") {
      order.completedAt = new Date();
    }
    await order.save();

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= EXPORTS =================
module.exports = {
  getDashboard,
  getWeeklySales,
  getTopProducts,
  getActiveOrders,
  getOrdersByTable,
  getTableStatus, // ⭐ ADDED
  updateOrderStatus
};
