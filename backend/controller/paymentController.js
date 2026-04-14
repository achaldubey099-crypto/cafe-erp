const crypto = require('crypto');

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
      return res.json({ success: true });
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

module.exports = {
  verifyPayment,
  createOrder,
};