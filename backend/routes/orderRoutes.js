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
const { protect } = require('../middleware/auth');


// ================= USER ROUTES =================

// Create Order (Checkout)
router.post('/', protect, createOrder);

// Get Orders by Table
router.get('/table', getOrdersByTable);

// Get Latest Order (Order Tracking Page)
router.get('/latest', getLatestOrderByTable);

// Profile Data (if used in user side)
router.get('/profile', getProfileData);


// ================= ADMIN ROUTES =================

// Get All Orders (Admin Panel)
router.get('/', getOrders);

// Update Order Status (Kitchen Flow)
router.put('/:id', updateOrderStatus);


module.exports = router;
