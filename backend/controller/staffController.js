const Staff = require("../models/Staff");
const { ensureRestaurantForUser } = require("../utils/restaurantScope");

const getStaffScope = async (req) => {
  if (req.user?.role === "superadmin") {
    return {};
  }

  const { restaurantId, cafeId } = await ensureRestaurantForUser(req);

  if (cafeId) {
    return { cafeId };
  }

  if (restaurantId) {
    return { restaurantId };
  }

  return null;
};

// ➕ CREATE STAFF
const createStaff = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const scope = await getStaffScope(req);

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    if (scope === null) {
      return res.status(400).json({ message: "Cafe or restaurant context is required for staff access" });
    }

    const existing = await Staff.findOne({ email, ...scope });
    if (existing) {
      return res.status(400).json({ message: "Staff with this email already exists for this cafe" });
    }

    const staff = await Staff.create({
      ...scope,
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
    const scope = await getStaffScope(req);

    if (scope === null) {
      return res.status(400).json({ message: "Cafe or restaurant context is required for staff access" });
    }

    let query = { ...scope };

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
    const scope = await getStaffScope(req);
    if (scope === null) {
      return res.status(400).json({ message: "Cafe or restaurant context is required for staff access" });
    }

    const updated = await Staff.findOneAndUpdate(
      { _id: req.params.id, ...scope },
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
    const scope = await getStaffScope(req);
    if (scope === null) {
      return res.status(400).json({ message: "Cafe or restaurant context is required for staff access" });
    }

    const staff = await Staff.findOne({ _id: req.params.id, ...scope });

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
    const scope = await getStaffScope(req);
    if (scope === null) {
      return res.status(400).json({ message: "Cafe or restaurant context is required for staff access" });
    }

    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, ...scope },
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
    const scope = await getStaffScope(req);
    if (scope === null) {
      return res.status(400).json({ message: "Cafe or restaurant context is required for staff access" });
    }

    const total = await Staff.countDocuments(scope);

    const active = await Staff.countDocuments({ ...scope, status: "active" });

    const activeNow = await Staff.countDocuments({
      ...scope,
      lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    });

    const roles = await Staff.distinct("role", scope);

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
