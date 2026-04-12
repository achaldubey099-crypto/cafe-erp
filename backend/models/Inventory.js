const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      unique: true,
      required: true,
    },
    category: {
      type: String,
      enum: ["Coffee", "Dairy", "Pastry", "Syrups", "Other"],
      default: "Other",
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    unit: {
      type: String,
      enum: ["kg", "L", "pcs"],
      required: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    vendor: {
      type: String,
    },
  },
  { timestamps: true }
);

// ✅ Model name stays "Inventory"
const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = Inventory;