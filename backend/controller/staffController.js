const Staff = require("../models/Staff");


// ➕ CREATE STAFF
const createStaff = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const existing = await Staff.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Staff with this email already exists" });
    }

    const staff = await Staff.create({
      name,
      email,
      phone,
      role
    });

    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📋 GET ALL STAFF
const getAllStaff = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;

    let query = {};

    if (role) query.role = role;
    if (status) query.status = status;

    const staff = await Staff.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Staff.countDocuments(query);

    res.json({ staff, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✏️ UPDATE STAFF
const updateStaff = async (req, res) => {
  try {
    const updated = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // you can ignore mongoose warning for now
    );

    if (!updated) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ❌ DELETE STAFF
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    await staff.deleteOne();

    res.json({ message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🟢 TOGGLE STATUS
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📊 STATS FOR DASHBOARD
const getStaffStats = async (req, res) => {
  try {
    const total = await Staff.countDocuments();

    const active = await Staff.countDocuments({ status: "active" });

    const activeNow = await Staff.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    });

    const roles = await Staff.distinct("role");

    res.json({
      total,
      activeNow,
      rolesCount: roles.length,
      retentionRate: total === 0 ? 0 : ((active / total) * 100).toFixed(0)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createStaff,
  getAllStaff,
  updateStaff,
  deleteStaff,
  updateStatus,
  getStaffStats
};