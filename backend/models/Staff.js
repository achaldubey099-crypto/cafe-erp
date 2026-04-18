const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  cafeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cafe",
    default: null,
    index: true
  },

  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    default: null,
    index: true
  },

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
