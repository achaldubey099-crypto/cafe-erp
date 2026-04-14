const express = require('express');
const router = express.Router();

const { verifyPayment, createOrder } = require('../controller/paymentController');

// POST /api/payment/verify
router.post('/verify', verifyPayment);

// POST /api/payment/create-order
router.post('/create-order', createOrder);

module.exports = router;