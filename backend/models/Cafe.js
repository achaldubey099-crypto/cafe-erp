const mongoose = require('mongoose');

const cafeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    subscriptionExpiry: { type: Date, default: null, index: true },
    features: { type: [String], default: ['POS'], index: true },
    // optional link to legacy Restaurant model
    restaurantRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cafe', cafeSchema);
