const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const { ensureRestaurantForUser } = require('../utils/restaurantScope');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const serializeFeedback = (feedback) => ({
  _id: feedback._id,
  restaurantId: feedback.restaurantId || feedback.orderId?.restaurantId || null,
  orderId: feedback.orderId,
  userId: feedback.userId,
  rating: feedback.rating,
  comment: feedback.comment,
  createdAt: feedback.createdAt,
  updatedAt: feedback.updatedAt,
});

const ensureCustomerOwnsOrder = async (orderId, userId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    const error = new Error('Order not found');
    error.status = 404;
    throw error;
  }

  if (!order.userId) {
    const error = new Error('This order is not linked to a customer account');
    error.status = 403;
    throw error;
  }

  if (order.userId.toString() !== userId) {
    const error = new Error('You can only review your own orders');
    error.status = 403;
    throw error;
  }

  return order;
};

exports.submitFeedback = async (req, res) => {
  try {
    if (req.user?.role !== 'user') {
      return res.status(403).json({ message: 'Customer login is required to review orders' });
    }

    const { orderId, rating, comment = '' } = req.body;
    const numericRating = Number(rating);

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be a number from 1 to 5' });
    }

    const order = await ensureCustomerOwnsOrder(orderId, req.user.id);

    const feedback = await Feedback.findOneAndUpdate(
      { orderId, userId: req.user.id },
      {
        restaurantId: order.restaurantId || null,
        orderId,
        userId: req.user.id,
        rating: numericRating,
        comment: String(comment).trim(),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      message: 'Review saved',
      feedback: serializeFeedback(feedback),
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.getAdminFeedback = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const { page, limit, skip } = getPaginationParams(req.query, { defaultLimit: 10, maxLimit: 50 });

    const feedbackDocs = await Feedback.find(
      restaurantId ? { restaurantId } : {}
    )
      .populate("userId", "name email")
      .populate("orderId", "tableId orderNumber grandTotal status createdAt restaurantId")
      .sort({ createdAt: -1, _id: -1 });

    const filteredFeedback = restaurantId
      ? feedbackDocs.filter((item) => String(item.restaurantId || item.orderId?.restaurantId || "") === String(restaurantId))
      : feedbackDocs;

    const totalItems = filteredFeedback.length;
    const paginated = filteredFeedback.slice(skip, skip + limit).map((feedback) => ({
      _id: feedback._id,
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt,
      user: feedback.userId
        ? {
            _id: feedback.userId._id,
            name: feedback.userId.name || "Customer",
            email: feedback.userId.email || "",
          }
        : null,
      order: feedback.orderId
        ? {
            _id: feedback.orderId._id,
            tableId: feedback.orderId.tableId,
            orderNumber: feedback.orderId.orderNumber,
            grandTotal: feedback.orderId.grandTotal,
            status: feedback.orderId.status,
            createdAt: feedback.orderId.createdAt,
          }
        : null,
    }));

    res.json({
      feedback: paginated,
      pagination: buildPaginationMeta({ page, limit, totalItems }),
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.getOrderFeedback = async (req, res) => {
  try {
    if (req.user?.role !== 'user') {
      return res.status(403).json({ message: 'Customer login is required to view this review' });
    }

    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    await ensureCustomerOwnsOrder(orderId, req.user.id);

    const feedback = await Feedback.findOne({
      orderId,
      userId: req.user.id,
    });

    if (!feedback) {
      return res.json({ feedback: null });
    }

    res.json({ feedback: serializeFeedback(feedback) });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};
