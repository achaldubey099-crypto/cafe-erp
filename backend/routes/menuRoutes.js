const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/upload');

const {
  getMenu,
  getFeaturedItem,
  createMenuItem,
  bulkUploadMenu // 🔥 NEW (make sure you export this)
} = require('../controller/menuController');

const Menu = require('../models/Menu');

// Multer for CSV upload
const csvUpload = multer({ dest: 'uploads/' });

// ================= SPECIAL ROUTES =================

// Featured item (must be before /:id)
router.get('/featured', getFeaturedItem);

// ================= BULK OPERATIONS =================

// 🔥 Upload CSV (bulk menu upload)
router.post('/bulk-upload', csvUpload.single('file'), bulkUploadMenu);

// 🔥 Delete all menu items (for testing reset)
router.delete('/clear', async (req, res) => {
  try {
    await Menu.deleteMany({});
    res.json({ message: "All menu items deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= MAIN ROUTES =================

// Get all menu items (with search + filter)
router.get('/', getMenu);

// Create new menu item (with image upload)
router.post('/', upload.single('imageFile'), createMenuItem);

// ================= FUTURE READY =================

// Get single item by ID
router.get('/:id', async (req, res) => {
  try {
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