const express = require('express');
const router = express.Router();

const {
    createOrder,
    getOrders,
    getOrdersByTable,
    getLatestOrderByTable,
    updateOrderStatus,
    getProfileData
} = require('../controller/orderController');

// Create Order (checkout)
router.post('/', createOrder);

// Get All Orders (admin)
router.get('/', getOrders);

// Get Orders by Table
router.get('/table', getOrdersByTable);

// ⭐ Profile API (ADD THIS HERE)
router.get('/profile', getProfileData);

// Get Latest Order (for order tracking page)
router.get('/latest', getLatestOrderByTable);

// Update Order Status (kitchen flow)
router.put('/:id', updateOrderStatus);

module.exports = router;