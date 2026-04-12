const express = require("express");
const router = express.Router();

const {
  createStaff,
  getAllStaff,
  updateStaff,
  deleteStaff,
  updateStatus,
  getStaffStats
} = require("../controller/staffController");

// ADMIN ONLY ROUTES

router.post("/", createStaff);
router.get("/", getAllStaff);
router.get("/stats", getStaffStats);
router.put("/:id", updateStaff);
router.delete("/:id", deleteStaff);
router.patch("/:id/status", updateStatus);

module.exports = router;