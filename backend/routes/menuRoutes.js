const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/upload');
const { optionalProtect, protectAdmin } = require('../middleware/auth');
const { resolveTenantContext } = require('../middleware/tenant');

const {
  getPublicMenu,
  getMenu,
  getFeaturedItem,
  createMenuItem,
  updateMenuItem,
  bulkUploadMenu // 🔥 NEW (make sure you export this)
} = require('../controller/menuController');

const Menu = require('../models/Menu');

// Multer for CSV upload
const csvUpload = multer({ dest: 'uploads/' });

// ================= SPECIAL ROUTES =================

// Featured item (must be before /:id)
router.get('/featured', optionalProtect, getFeaturedItem);
router.get('/access', resolveTenantContext, getPublicMenu);

// ================= BULK OPERATIONS =================

// 🔥 Upload CSV (bulk menu upload)
router.post('/bulk-upload', protectAdmin, csvUpload.single('file'), bulkUploadMenu);

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
router.get('/', optionalProtect, getMenu);

// Create new menu item (with image upload)
router.post('/', protectAdmin, upload.single('imageFile'), createMenuItem);
router.put('/:id', protectAdmin, upload.single('imageFile'), updateMenuItem);

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
