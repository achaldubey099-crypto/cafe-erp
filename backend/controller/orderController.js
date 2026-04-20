const mongoose = require("mongoose");
const Order = require("../models/Order");
const { ADMIN_ROLES } = require("../middleware/auth");
const { ensureRestaurantForUser } = require("../utils/restaurantScope");
const { getPaginationParams, buildPaginationMeta, escapeRegex } = require("../utils/pagination");

const PAYMENT_METHOD_MAP = {
  upi: "UPI",
  card: "Card",
  counter: "Counter",
};

const ACTIVE_STATUSES = ["pending", "preparing", "ready"];

const normalizePaymentMethod = (value) => {
  if (!value) {
    return "UPI";
  }

  const key = String(value).trim().toLowerCase();
  return PAYMENT_METHOD_MAP[key] || null;
};

const buildOrderScopeFilter = ({ restaurantId, tableId, sessionId, userId, activeOnly = false }) => {
  const filter = {};

  if (restaurantId) {
    filter.restaurantId = restaurantId;
  }

  if (userId) {
    filter.userId = userId;
  } else if (sessionId) {
    filter.sessionId = sessionId;
    if (tableId) {
      filter.tableId = Number(tableId);
    }
  } else if (tableId) {
    filter.tableId = Number(tableId);
  }

  if (activeOnly) {
    filter.status = { $in: ACTIVE_STATUSES };
  }

  return filter;
};

const buildOrderSearchFilter = (search) => {
  const normalizedSearch = String(search || "").trim();

  if (!normalizedSearch) {
    return null;
  }

  const searchPattern = new RegExp(escapeRegex(normalizedSearch), "i");
  const searchFilters = [{ "items.name": searchPattern }, { status: searchPattern }];

  const numericSearch = Number.parseInt(normalizedSearch, 10);
  if (Number.isFinite(numericSearch)) {
    searchFilters.push({ tableId: numericSearch });
    searchFilters.push({ orderNumber: numericSearch });
  }

  if (mongoose.Types.ObjectId.isValid(normalizedSearch)) {
    searchFilters.push({ _id: normalizedSearch });
  }

  return { $or: searchFilters };
};

exports.createOrder = async (req, res) => {
  try {
    const { sessionId, items, paymentMethod, splitBill } = req.body;

    const tenantRestaurant = req.tenant?.restaurant;
    const tenantTable = req.tenant?.table;
    const resolvedTableId = tenantTable?.tableNumber ?? null;

    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);

    if (!tenantRestaurant || !tenantTable || !resolvedTableId || !items || items.length === 0) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    if (!normalizedPaymentMethod) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const platformFee = 1.2;
    const serviceTax = 0.8;
    const grandTotal = totalAmount + platformFee + serviceTax;

    let splitData = {
      isSplit: false,
      peopleCount: 1,
      perPersonAmount: grandTotal,
    };

    if (splitBill?.isSplit) {
      const count = splitBill.peopleCount || 1;

      splitData = {
        isSplit: true,
        peopleCount: count,
        perPersonAmount: grandTotal / count,
      };
    }

    const order = await Order.create({
      restaurantId: tenantRestaurant._id,
      tableRef: tenantTable._id,
      tableId: resolvedTableId,
      orderNumber: await Order.getNextOrderNumber(),
      sessionId,
      userId: req.user?.role === "user" ? req.user.id : null,
      items,
      paymentMethod: normalizedPaymentMethod,
      totalAmount,
      platformFee,
      serviceTax,
      grandTotal,
      splitBill: splitData,
      status: "pending",
    });

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Authentication is required" });
    }

    const { userId, status, search } = req.query;
    const { restaurantId } = await ensureRestaurantForUser(req);
    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    const { page, limit, skip, shouldPaginate } = getPaginationParams(req.query);

    const filter = {};

    if (isAdmin) {
      if (userId) filter.userId = userId;
      if (restaurantId) filter.restaurantId = restaurantId;
    } else {
      if (userId && String(userId) !== String(req.userId)) {
        return res.status(403).json({ message: "Cannot access another customer's orders" });
      }

      filter.userId = req.userId;
    }

    if (status) {
      filter.status = status;
    }

    const searchFilter = buildOrderSearchFilter(search);
    if (searchFilter) {
      filter.$and = [...(filter.$and || []), searchFilter];
    }

    const baseQuery = Order.find(filter).sort({ createdAt: -1, _id: -1 });

    if (!shouldPaginate) {
      const orders = await baseQuery;
      return res.json(orders);
    }

    const requests = [
      baseQuery.clone().skip(skip).limit(limit),
      Order.countDocuments(filter),
    ];

    if (!isAdmin) {
      requests.push(
        Order.aggregate([
          { $match: filter },
          { $group: { _id: null, totalSpent: { $sum: "$grandTotal" } } },
        ])
      );
    }

    const [orders, totalItems, totalSpentAggregation = []] = await Promise.all(requests);
    const response = {
      orders,
      pagination: buildPaginationMeta({ page, limit, totalItems }),
    };

    if (!isAdmin) {
      response.summary = {
        totalSpent: totalSpentAggregation[0]?.totalSpent || 0,
      };
    }

    res.json(response);
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getOrdersByTable = async (req, res) => {
  try {
    const { tableId, sessionId, userId, activeOnly } = req.query;
    const tenantRestaurant = req.tenant?.restaurant;
    const tenantTable = req.tenant?.table;

    if (!tenantRestaurant && !tableId && !sessionId && !userId) {
      return res.status(400).json({ message: "table/restaurant access or scoped identifiers are required" });
    }

    const filter = buildOrderScopeFilter({
      restaurantId: tenantRestaurant?._id,
      tableId: tenantTable?.tableNumber ?? tableId,
      sessionId,
      userId,
      activeOnly: String(activeOnly) === "true",
    });

    const orders = await Order.find(filter).sort({ createdAt: -1, _id: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get Orders By Table Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getLatestOrderByTable = async (req, res) => {
  try {
    const { tableId, sessionId, userId, activeOnly } = req.query;
    const tenantRestaurant = req.tenant?.restaurant;
    const tenantTable = req.tenant?.table;

    if (!tenantRestaurant && !tableId && !sessionId && !userId) {
      return res.status(400).json({ message: "table/restaurant access or scoped identifiers are required" });
    }

    const filter = buildOrderScopeFilter({
      restaurantId: tenantRestaurant?._id,
      tableId: tenantTable?.tableNumber ?? tableId,
      sessionId,
      userId,
      activeOnly: String(activeOnly) === "true",
    });

    const order = await Order.findOne(filter).sort({ createdAt: -1, _id: -1 });

    if (!order) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get Latest Order Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { restaurantId } = await ensureRestaurantForUser(req);

    const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existingOrder = await Order.findById(id);

    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (restaurantId && String(existingOrder.restaurantId) !== String(restaurantId)) {
      return res.status(403).json({ message: "Cannot update another restaurant's order" });
    }

    const update = { status };

    if (status === "preparing") {
      update.startedAt = new Date();
    }

    if (status === "completed") {
      update.completedAt = new Date();
    }

    if (status === "cancelled") {
      update.completedAt = null;
    }

    const order = await Order.findByIdAndUpdate(id, update, { new: true });

    res.json({
      message: "Order status updated",
      order,
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getProfileData = async (req, res) => {
  try {
    const tenantRestaurant = req.tenant?.restaurant;
    const tenantTable = req.tenant?.table;

    if (!tenantRestaurant || !tenantTable) {
      return res.status(400).json({ message: "Restaurant and table access are required" });
    }

    const orders = await Order.find({
      restaurantId: tenantRestaurant._id,
      tableId: tenantTable.tableNumber,
    });

    const totalSpent = orders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
    const points = Math.floor(totalSpent * 0.1);
    const pastOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      user: {
        name: tenantRestaurant.brandName,
        tableId: tenantTable.tableNumber,
        restaurantName: tenantRestaurant.brandName,
        restaurantLogo: tenantRestaurant.logoUrl || "",
      },
      points,
      totalSpent,
      pastOrders,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ message: error.message });
  }
};
