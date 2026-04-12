const express = require('express');
const router = express.Router();

const {
    getCategories,
    createCategory
} = require('../controller/categoryController');

// Get all categories
router.get('/', getCategories);

// Create new category
router.post('/', createCategory);

module.exports = router;