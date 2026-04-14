const Feedback = require('../models/Feedback');
const Order = require('../models/Order');

const serializeFeedback = (feedback) => ({
  _id: feedback._id,
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

    await ensureCustomerOwnsOrder(orderId, req.user.id);

    const feedback = await Feedback.findOneAndUpdate(
      { orderId, userId: req.user.id },
      {
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
