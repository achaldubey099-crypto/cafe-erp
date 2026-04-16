const mongoose = require("mongoose");
const { createPublicId } = require("../utils/publicIds");

const tableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    publicTableId: {
      type: String,
      required: true,
      unique: true,
      default: () => createPublicId("table"),
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model("Table", tableSchema);
