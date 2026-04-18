const express = require('express');
const router = express.Router();
const { resolveTenantContext } = require('../middleware/tenant');

const {
    createOrder,
    getOrders,
    getOrdersByTable,
    getLatestOrderByTable,
    updateOrderStatus,
    getProfileData
} = require('../controller/orderController');
const { optionalProtect, protect, protectAdmin } = require('../middleware/auth');


// ================= USER ROUTES =================

// Create Order (Checkout)
router.post('/', optionalProtect, resolveTenantContext, createOrder);

// Get Orders by Table
router.get('/table', resolveTenantContext, getOrdersByTable);

// Get Latest Order (Order Tracking Page)
router.get('/latest', resolveTenantContext, getLatestOrderByTable);

// Profile Data (if used in user side)
router.get('/profile', resolveTenantContext, getProfileData);


// ================= ADMIN ROUTES =================

// Get All Orders (Admin Panel)
router.get('/', protect, getOrders);

// Update Order Status (Kitchen Flow)
router.put('/:id', protectAdmin, updateOrderStatus);


module.exports = router;
