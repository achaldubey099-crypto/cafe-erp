const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  phone: String,

  role: {
    type: String,
    enum: ["manager", "barista", "cashier"],
    default: "barista"
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },

  lastActive: {
    type: Date,
    default: Date.now
  },

  joinedAt: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

const Staff = mongoose.model("Staff", staffSchema);

module.exports = Staff;