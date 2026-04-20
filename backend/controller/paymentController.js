const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const { ensureRestaurantForUser } = require('../utils/restaurantScope');

/**
 * Verify Razorpay payment signature
 * Expects: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
const verifyPayment = (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET not set');
      return res.status(500).json({ success: false, message: 'Server misconfiguration' });
    }

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      const verificationToken = jwt.sign(
        {
          type: 'payment-verification',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return res.json({
        success: true,
        verificationToken,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });
    }

    return res.status(400).json({ success: false });
  } catch (err) {
    console.error('verifyPayment error:', err);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
};
const razorpayMod = require('../utils/razorpay');
const razorpay = razorpayMod && razorpayMod.default ? razorpayMod.default : razorpayMod;

const createOrder = async (req, res) => {
  try {
    console.log('createOrder body:', req.body);
    const { amount } = req.body || {};

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid or missing amount' });
    }

    const options = {
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: 'receipt_' + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json(order);
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ error: err.message });
  }
};

const getRecentPaymentLogs = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const matchStage = {
      paymentLogs: { $exists: true, $ne: [] },
    };

    if (restaurantId) {
      matchStage.restaurantId = restaurantId;
    }

    const payments = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$paymentLogs" },
      {
        $match: {
          "paymentLogs.status": "paid",
          "paymentLogs.createdAt": { $gte: since },
        },
      },
      {
        $project: {
          _id: 0,
          orderId: "$_id",
          orderNumber: "$orderNumber",
          tableId: "$tableId",
          grandTotal: "$grandTotal",
          amountPaid: "$amountPaid",
          paymentStatus: "$paymentStatus",
          method: "$paymentLogs.method",
          amount: "$paymentLogs.amount",
          source: "$paymentLogs.source",
          transactionId: "$paymentLogs.transactionId",
          razorpayOrderId: "$paymentLogs.razorpayOrderId",
          razorpayPaymentId: "$paymentLogs.razorpayPaymentId",
          createdAt: "$paymentLogs.createdAt",
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json({
      payments,
      summary: {
        totalPayments: payments.length,
        totalCollected: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  verifyPayment,
  createOrder,
  getRecentPaymentLogs,
};
