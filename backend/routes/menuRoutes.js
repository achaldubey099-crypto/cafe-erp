const express = require('express');
const router = express.Router();

const {
  getMenu,
  getFeaturedItem,
  createMenuItem
} = require('../controller/menuController');
const upload = require('../middleware/upload');

// ================= SPECIAL ROUTES =================

// Featured item (must be before /:id)
router.get('/featured', getFeaturedItem);

// ================= MAIN ROUTES =================

// Get all menu items (with search + filter)
router.get('/', getMenu);

// Create new menu item (for admin / testing)
router.post('/', upload.single('imageFile'), createMenuItem);

// ================= FUTURE READY =================

// (Optional) Get single item by ID (useful later)
router.get('/:id', async (req, res) => {
  try {
    const Menu = require('../models/Menu');
    const item = await Menu.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
