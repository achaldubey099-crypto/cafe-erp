const mongoose = require("mongoose");
const { createPublicId } = require("../utils/publicIds");
const { buildRestaurantAccessKey } = require("../utils/accessKeys");

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
    accessKey: {
      type: String,
      default: null,
      unique: true,
      index: true,
      sparse: true,
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

restaurantSchema.pre("validate", function () {
  this.accessKey = buildRestaurantAccessKey(this);
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
