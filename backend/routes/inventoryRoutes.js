const express = require("express");
const router = express.Router();

// ✅ Import controller (CommonJS)
const {
  addItem,
  getItems,
  updateItem,
  getInventoryStats,
} = require("../controller/inventoryController");

/**
 * @route   POST /api/inventory
 * @desc    Add new inventory item
 * @access  Admin (handled in server.js)
 */
router.post("/", addItem);

/**
 * @route   GET /api/inventory
 * @desc    Get all inventory items (filters + pagination)
 * @access  Admin (handled in server.js)
 */
router.get("/", getItems);

/**
 * @route   PUT /api/inventory/:id
 * @desc    Update inventory item
 * @access  Admin (handled in server.js)
 */
router.put("/:id", updateItem);

/**
 * @route   GET /api/inventory/stats
 * @desc    Get inventory dashboard stats
 * @access  Admin (handled in server.js)
 */
router.get("/stats", getInventoryStats);

module.exports = router;