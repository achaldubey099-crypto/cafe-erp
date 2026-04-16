const mongoose = require("mongoose");
const { createPublicId } = require("../utils/publicIds");

const restaurantSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    publicRestaurantId: {
      type: String,
      required: true,
      unique: true,
      default: () => createPublicId("rest"),
    },
    logoUrl: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
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

module.exports = mongoose.model("Restaurant", restaurantSchema);
