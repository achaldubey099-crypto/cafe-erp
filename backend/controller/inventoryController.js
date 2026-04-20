import Inventory from "../models/Inventory.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Helper: Get status dynamically
 */
const getItemStatus = (item) => {
  if (item.quantity === 0) return "Out of Stock";
  if (item.quantity <= item.lowStockThreshold) return "Low Stock";
  return "In Stock";
};

/**
 * @desc Add new inventory item
 * @route POST /api/inventory
 * @access Admin
 */
export const addItem = async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Get all inventory items (with filters + pagination)
 * @route GET /api/inventory
 * @access Admin
 */
export const getItems = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 10 } = req.query;

    let query = {};

    // Filter by category
    if (category && category !== "All") {
      query.category = category;
    }

    if (search && String(search).trim()) {
      const searchPattern = new RegExp(escapeRegex(String(search).trim()), "i");
      query.$or = [
        { name: searchPattern },
        { sku: searchPattern },
        { category: searchPattern },
        { vendor: searchPattern },
      ];
    }

    let items = await Inventory.find(query);

    // Add dynamic status
    items = items.map((item) => {
      const obj = item.toObject();
      obj.status = getItemStatus(item);
      return obj;
    });

    // Filter by status
    if (status && status !== "All") {
      items = items.filter((item) => item.status === status);
    }

    // Pagination
    const safePage = Number(page) || 1;
    const safeLimit = Number(limit) || 10;
    const start = (safePage - 1) * safeLimit;
    const paginatedItems = items.slice(start, start + safeLimit);

    res.json({
      total: items.length,
      page: safePage,
      items: paginatedItems,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Update inventory item
 * @route PUT /api/inventory/:id
 * @access Admin
 */
export const updateItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Get inventory statistics (cards data)
 * @route GET /api/inventory/stats
 * @access Admin
 */
export const getInventoryStats = async (req, res) => {
  try {
    const items = await Inventory.find();

    let total = items.length;
    let lowStock = 0;
    let outOfStock = 0;

    items.forEach((item) => {
      if (item.quantity === 0) {
        outOfStock++;
      } else if (item.quantity <= item.lowStockThreshold) {
        lowStock++;
      }
    });

    res.json({
      totalItems: total,
      lowStockItems: lowStock,
      outOfStockItems: outOfStock,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
