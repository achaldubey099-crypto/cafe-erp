const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      unique: true,
      index: true,
    },
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
