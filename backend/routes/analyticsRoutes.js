const express = require("express");
const router = express.Router();

// ✅ Correct middleware import (matches your file: /middleware/auth.js)
const { protectAdmin } = require("../middleware/auth");

// ✅ Controller import (CommonJS)
const { getAnalytics } = require("../controller/analyticsController");

// ✅ Route (Admin only)
router.get("/", protectAdmin, getAnalytics);

module.exports = router;