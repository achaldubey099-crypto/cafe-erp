const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
  {
    profitMargin: {
      type: Number,
      default: 0.4,
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);
