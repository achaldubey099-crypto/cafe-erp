const express = require('express');
const router = express.Router();

const {
    getMenu,
    getFeaturedItem,
    createMenuItem
} = require('../controller/menuController');

// IMPORTANT: specific route first
router.get('/featured', getFeaturedItem);

// general route
router.get('/', getMenu);

// Create menu item
router.post('/', createMenuItem);

module.exports = router;