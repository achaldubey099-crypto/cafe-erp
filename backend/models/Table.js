const mongoose = require("mongoose");
const { createPublicId } = require("../utils/publicIds");
const { buildTableAccessKey } = require("../utils/accessKeys");
const { buildDefaultTableSlug, slugifySegment } = require("../utils/tableSlug");

const tableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    cafeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cafe',
      default: null,
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
    slug: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    publicTableId: {
      type: String,
      required: true,
      unique: true,
      default: () => createPublicId("table"),
    },
    accessKey: {
      type: String,
      default: null,
      unique: true,
      index: true,
      sparse: true,
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
tableSchema.index({ restaurantId: 1, slug: 1 }, { unique: true, sparse: true });

tableSchema.pre("validate", function () {
  this.slug = slugifySegment(this.slug) || buildDefaultTableSlug(this.label, this.tableNumber);
  this.accessKey = buildTableAccessKey(this);
});

module.exports = mongoose.model("Table", tableSchema);
