const express = require('express');
const router = express.Router();

const {
    toggleFavorite,
    getFavorites
} = require('../controller/favoriteController');

// Add / Remove
router.post('/', toggleFavorite);

// Get favorites
router.get('/', getFavorites);

module.exports = router;